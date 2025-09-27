/**
 * User authentication API routes
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel, CreateUserData, LoginCredentials } from '../models/User.js';
import { AnalyticsModel } from '../models/Analytics.js';
import { authenticateSupabaseToken, requireAdmin, createRateLimiter, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth.js';
import { emailService } from '../services/emailService.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', createRateLimiter(5, 15), registerValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { email, password, name } = req.body as CreateUserData;
    
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ 
        error: 'An account with this email already exists. Please use a different email or try logging in.' 
      });
      return;
    }
    
    const user = await UserModel.create({ email, password, name });
    
    // Generate verification token
    const verificationToken = emailService.generateVerificationToken();
    const tokenExpiry = emailService.generateTokenExpiry(24); // 24 hours
    
    // Save verification token to user
    await UserModel.setEmailVerificationToken(user.id!, verificationToken, tokenExpiry);
    
    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken, name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Track registration event
    await AnalyticsModel.trackEvent({
      user_id: user.id,
      feature_name: 'auth',
      action: 'register',
      metadata: JSON.stringify({ email, name })
    });

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', createRateLimiter(5, 15), loginValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { email, password } = req.body as LoginCredentials;
    
    const user = await UserModel.findByEmail(email);
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValidPassword = await UserModel.comparePassword(password, user.password!);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if email is verified
    if (!user.email_verified) {
      res.status(401).json({ 
        error: 'Please verify your email address before logging in. Check your email for verification link.',
        requiresVerification: true
      });
      return;
    }

    // Update last login
    await UserModel.updateLastLogin(user.id!);
    
    // Generate token
    const { password: _, ...userWithoutPassword } = user;
    const token = UserModel.generateToken(userWithoutPassword);

    // Track login event
    await AnalyticsModel.trackEvent({
      user_id: user.id,
      feature_name: 'auth',
      action: 'login',
      metadata: JSON.stringify({ email })
    });

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Track logout event
    await AnalyticsModel.trackEvent({
      user_id: req.user!.id,
      feature_name: 'auth',
      action: 'logout'
    });

    res.json({ message: 'Logout successful' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', authenticateSupabaseToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
], async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const updates = req.body;
    const updatedUser = await UserModel.updateUser(req.user!.id, updates);
    
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ message: 'Profile updated successfully', user: userWithoutPassword });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Verify token
 * GET /api/auth/verify
 */
router.get('/verify', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  res.json({ valid: true, user: req.user });
});

// Email verification route
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await UserModel.verifyEmail(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Resend verification email route
router.post('/resend-verification',
  createRateLimiter(5, 15),
  [
    body('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { email } = req.body;
      
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (user.email_verified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }
      
      // Generate new verification token
      const verificationToken = emailService.generateVerificationToken();
      const tokenExpiry = emailService.generateTokenExpiry(24); // 24 hours
      
      // Save verification token to user
      await UserModel.setEmailVerificationToken(user.id!, verificationToken, tokenExpiry);
      
      // Send verification email
      try {
        await emailService.sendVerificationEmail(email, verificationToken, user.name);
        res.json({
          success: true,
          message: 'Verification email sent successfully'
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        res.status(500).json({
          success: false,
          message: 'Failed to send verification email'
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

export default router;
