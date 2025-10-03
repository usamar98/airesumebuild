/**
 * User authentication API routes
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { createClient } from '@supabase/supabase-js';
import { AnalyticsModel } from '../models/Analytics.ts';
import { authenticateSupabaseToken, requireAdmin, createRateLimiter, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth.ts';
import { emailService } from '../services/emailService.ts';

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Supabase client initialization:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseServiceKey?.length || 0
  });
  
  if (!supabaseUrl || !supabaseServiceKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    console.error('Missing environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  try {
    const client = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
};

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

const router = Router();

/**
 * Railway Deployment Debug Endpoint
 * GET /api/auth/debug
 */
router.get('/debug', async (req: Request, res: Response): Promise<void> => {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    railway: {
      environment: process.env.RAILWAY_ENVIRONMENT || 'not-detected',
      projectId: process.env.RAILWAY_PROJECT_ID || 'not-detected',
      serviceId: process.env.RAILWAY_SERVICE_ID || 'not-detected',
      deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || 'not-detected',
      replicaId: process.env.RAILWAY_REPLICA_ID || 'not-detected'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
      jwtSecretValid: process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-secret-key' && process.env.JWT_SECRET.length > 10,
      frontendUrl: process.env.FRONTEND_URL,
      frontendUrlValid: process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'),
      supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
      supabaseUrlValid: process.env.SUPABASE_URL && process.env.SUPABASE_URL.includes('supabase.co'),
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET',
      supabaseServiceKeyValid: process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ'),
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
      emailPass: process.env.EMAIL_PASS ? 'SET' : 'NOT_SET',
      emailFrom: process.env.EMAIL_FROM ? 'SET' : 'NOT_SET'
    },
    supabaseConnection: 'NOT_TESTED',
    databaseTables: 'NOT_TESTED',
    authTest: 'NOT_TESTED',
    registrationTest: 'NOT_TESTED',
    errors: [],
    warnings: []
  };

  // Check for configuration warnings
  if (!debugInfo.environment.jwtSecretValid) {
    debugInfo.warnings.push('JWT_SECRET appears to be using default/placeholder value');
  }
  if (!debugInfo.environment.frontendUrlValid) {
    debugInfo.warnings.push('FRONTEND_URL appears to be using localhost instead of production URL');
  }
  if (!debugInfo.environment.supabaseUrlValid) {
    debugInfo.warnings.push('SUPABASE_URL does not appear to be a valid Supabase URL');
  }
  if (!debugInfo.environment.supabaseServiceKeyValid) {
    debugInfo.warnings.push('SUPABASE_SERVICE_ROLE_KEY does not appear to be a valid JWT token');
  }

  try {
    // Test Supabase client creation
    console.log('Debug: Testing Supabase client creation...');
    const supabase = getSupabaseClient();
    debugInfo.supabaseConnection = 'SUCCESS';
    
    // Test database connection
    console.log('Debug: Testing database connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (healthError) {
      debugInfo.errors.push(`Database connection error: ${healthError.message}`);
      debugInfo.databaseTables = 'ERROR';
    } else {
      debugInfo.databaseTables = 'SUCCESS';
    }
    
    // Test user table structure and RLS
    console.log('Debug: Testing user table structure and RLS...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(0);
    
    if (tableError) {
      debugInfo.errors.push(`User table error: ${tableError.message}`);
      if (tableError.message.includes('permission denied')) {
        debugInfo.errors.push('RLS policy may be blocking access - check table permissions');
      }
    }
    
    // Test auth admin capabilities
    console.log('Debug: Testing auth admin capabilities...');
    try {
      const { data: authTest, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      if (authError) {
        debugInfo.errors.push(`Auth admin error: ${authError.message}`);
        debugInfo.authTest = 'ERROR';
      } else {
        debugInfo.authTest = 'SUCCESS';
        console.log(`Debug: Found ${authTest.users?.length || 0} existing users`);
      }
    } catch (authTestError: any) {
      debugInfo.errors.push(`Auth admin test failed: ${authTestError.message}`);
      debugInfo.authTest = 'ERROR';
    }
    
    // Test user creation capability (dry run)
    console.log('Debug: Testing user creation capability...');
    try {
      // Test with a fake email to see if we get validation errors vs permission errors
      const testEmail = `test-${Date.now()}@example.com`;
      const { data: createTest, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'test123456',
        user_metadata: { name: 'Test User', role: 'user' },
        email_confirm: false
      });
      
      if (createError) {
        if (createError.message.includes('already registered')) {
          debugInfo.registrationTest = 'SUCCESS (user exists)';
        } else {
          debugInfo.errors.push(`Registration test error: ${createError.message}`);
          debugInfo.registrationTest = 'ERROR';
        }
      } else {
        debugInfo.registrationTest = 'SUCCESS';
        // Clean up test user
        if (createTest.user?.id) {
          await supabase.auth.admin.deleteUser(createTest.user.id);
        }
      }
    } catch (regTestError: any) {
      debugInfo.errors.push(`Registration test failed: ${regTestError.message}`);
      debugInfo.registrationTest = 'ERROR';
    }
    
  } catch (error: any) {
    debugInfo.supabaseConnection = 'ERROR';
    debugInfo.errors.push(`Supabase client error: ${error.message}`);
  }

  res.json(debugInfo);
});

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
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Registration attempt started for:`, req.body?.email);
  
  try {
    // Enhanced environment check for Railway debugging
    console.log(`[${requestId}] Environment check:`, {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      supabaseUrlValid: process.env.SUPABASE_URL?.includes('supabase.co'),
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyValid: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ'),
      hasFrontendUrl: !!process.env.FRONTEND_URL,
      frontendUrl: process.env.FRONTEND_URL,
      nodeEnv: process.env.NODE_ENV,
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT,
      port: process.env.PORT
    });
    
    // Validate critical environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`[${requestId}] Missing critical environment variables`);
      res.status(500).json({ error: 'Server configuration error - missing database credentials' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[${requestId}] Validation failed:`, errors.array());
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { email, password, name } = req.body as CreateUserData;
    console.log(`[${requestId}] Creating Supabase client...`);
    
    let supabase;
    try {
      supabase = getSupabaseClient();
      console.log(`[${requestId}] Supabase client created successfully`);
      
      // Test basic connectivity
      console.log(`[${requestId}] Testing Supabase connectivity...`);
      const { data: healthCheck, error: healthError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (healthError) {
        console.error(`[${requestId}] Supabase connectivity test failed:`, {
          message: healthError.message,
          details: healthError.details,
          hint: healthError.hint,
          code: healthError.code
        });
        res.status(500).json({ error: 'Database connectivity test failed' });
        return;
      }
      console.log(`[${requestId}] Supabase connectivity test passed`);
      
    } catch (clientError: any) {
      console.error(`[${requestId}] Failed to create Supabase client:`, {
        message: clientError.message,
        stack: clientError.stack,
        name: clientError.name,
        cause: clientError.cause
      });
      res.status(500).json({ error: 'Database connection failed - check server configuration' });
      return;
    }
    
    console.log(`[${requestId}] Attempting to create user with Supabase Auth...`);
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role: 'job_seeker'
      },
      email_confirm: false // Require email verification
    });

    if (authError) {
      console.error(`[${requestId}] Supabase auth error:`, {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        details: authError.details,
        hint: authError.hint,
        fullError: authError
      });
      
      // Enhanced error handling for Railway debugging
      if (authError.message.includes('already registered')) {
        console.log(`[${requestId}] User already exists - this is expected behavior`);
        res.status(400).json({ 
          error: 'An account with this email already exists. Please use a different email or try logging in.' 
        });
        return;
      }
      
      if (authError.message.includes('Invalid API key') || authError.message.includes('JWT')) {
        console.error(`[${requestId}] Authentication configuration error - check SUPABASE_SERVICE_ROLE_KEY`);
        res.status(500).json({ error: 'Server authentication configuration error' });
        return;
      }
      
      if (authError.message.includes('permission') || authError.message.includes('policy')) {
        console.error(`[${requestId}] Database permission error - check RLS policies`);
        res.status(500).json({ error: 'Database permission configuration error' });
        return;
      }
      
      console.error(`[${requestId}] Unhandled auth error type:`, authError.message);
      res.status(400).json({ error: authError.message || 'Registration failed - check server logs' });
      return;
    }

    if (!authData.user) {
      console.error(`[${requestId}] No user data returned from Supabase`);
      res.status(400).json({ error: 'Failed to create user account' });
      return;
    }

    console.log(`[${requestId}] User created successfully, ID:`, authData.user.id);

    // Create user profile in public.users table
    console.log(`[${requestId}] Creating user profile in public.users table...`);
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: 'job_seeker'
      });

    if (profileError) {
      console.error(`[${requestId}] Profile creation error:`, {
        message: profileError.message,
        details: profileError,
        hint: profileError.hint
      });
      // Don't fail registration if profile creation fails
    } else {
      console.log(`[${requestId}] User profile created successfully`);
    }

    // Send verification email
    console.log(`[${requestId}] Attempting to send verification email...`);
    try {
      const { error: emailError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        options: {
          redirectTo: `${process.env.FRONTEND_URL}/auth/verify`
        }
      });
      
      if (emailError) {
        console.error(`[${requestId}] Failed to generate verification email:`, emailError);
      } else {
        console.log(`[${requestId}] Verification email generated successfully`);
      }
    } catch (emailError) {
      console.error(`[${requestId}] Failed to send verification email:`, emailError);
      // Continue with registration even if email fails
    }

    // Track registration event
    console.log(`[${requestId}] Tracking registration event...`);
    try {
      await AnalyticsModel.trackEvent({
        user_id: authData.user.id,
        feature_name: 'auth',
        action: 'register',
        metadata: JSON.stringify({ email, name })
      });
      console.log(`[${requestId}] Analytics event tracked successfully`);
    } catch (analyticsError) {
      console.error(`[${requestId}] Analytics tracking error:`, analyticsError);
    }

    console.log(`[${requestId}] Registration completed successfully`);
    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: 'job_seeker',
        email_verified: false
      }
    });
  } catch (error: any) {
    console.error(`[${requestId}] Unexpected registration error:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', createRateLimiter(10, 15), loginValidation, async (req: Request, res: Response): Promise<void> => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Login attempt started for:`, req.body?.email);
  
  try {
    // Enhanced environment check for Railway debugging
    console.log(`[${requestId}] Environment check:`, {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      supabaseUrlValid: process.env.SUPABASE_URL?.includes('supabase.co'),
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyValid: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ'),
      nodeEnv: process.env.NODE_ENV,
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[${requestId}] Validation failed:`, errors.array());
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { email, password } = req.body as LoginCredentials;
    console.log(`[${requestId}] Creating Supabase client for login...`);
    
    let supabase;
    try {
      supabase = getSupabaseClient();
      console.log(`[${requestId}] Supabase client created successfully for login`);
    } catch (clientError: any) {
      console.error(`[${requestId}] Failed to create Supabase client for login:`, {
        message: clientError.message,
        stack: clientError.stack
      });
      res.status(500).json({ error: 'Database connection failed during login' });
      return;
    }
    
    // Authenticate with Supabase Auth
    console.log(`[${requestId}] Attempting authentication with Supabase...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error(`[${requestId}] Supabase auth error:`, {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        details: authError.details,
        hint: authError.hint,
        fullError: authError
      });
      
      if (authError.message.includes('Invalid login credentials')) {
        console.log(`[${requestId}] Invalid credentials provided`);
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      
      if (authError.message.includes('Invalid API key') || authError.message.includes('JWT')) {
        console.error(`[${requestId}] Authentication configuration error during login`);
        res.status(500).json({ error: 'Server authentication configuration error' });
        return;
      }
      
      console.error(`[${requestId}] Unhandled login auth error:`, authError.message);
      res.status(401).json({ error: authError.message || 'Login failed - check server logs' });
      return;
    }

    if (!authData.user || !authData.session) {
      console.error(`[${requestId}] No user data or session returned from Supabase`);
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    console.log(`[${requestId}] Authentication successful, user ID:`, authData.user.id);

    // Get user profile from public.users table
    console.log(`[${requestId}] Fetching user profile from database...`);
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Create profile if it doesn't exist
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || 'User',
          role: authData.user.user_metadata?.role || 'job_seeker'
        });
      
      if (insertError) {
        console.error('Profile creation error:', insertError);
      }
    }

    // Update last login
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);
    } catch (updateError) {
      console.error('Last login update error:', updateError);
    }

    // Track login event
    try {
      await AnalyticsModel.trackEvent({
        user_id: authData.user.id,
        feature_name: 'auth',
        action: 'login',
        metadata: JSON.stringify({ email })
      });
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
    }

    const profile = userProfile || {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.name || 'User',
      role: authData.user.user_metadata?.role || 'job_seeker'
    };

    res.json({
      message: 'Login successful',
      token: authData.session.access_token,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        email_verified: authData.user.email_confirmed_at ? true : false
      }
    });
  } catch (error: any) {
    console.error(`[${requestId}] Unexpected login error:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // Track logout event
    if (userId) {
      try {
        await AnalyticsModel.trackEvent({
          user_id: userId,
          feature_name: 'auth',
          action: 'logout',
          metadata: JSON.stringify({ timestamp: new Date().toISOString() })
        });
      } catch (analyticsError) {
        console.error('Analytics tracking error:', analyticsError);
      }
    }

    res.json({ message: 'Logged out successfully' });
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
    console.log('Profile route - Handler started');
    const userId = req.user?.id;
    console.log('Profile route - User ID:', userId);
    
    if (!userId) {
      console.log('Profile route - No user ID found');
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const supabase = getSupabaseClient();
    console.log('Profile route - Fetching user profile from database...');
    
    // Get user profile from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile route - Profile fetch error:', profileError);
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    console.log('Profile route - Profile found, sending response...');
    console.log('Profile route - Profile data:', userProfile ? 'Present' : 'Missing');
    res.json({ user: userProfile });
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Update User Profile
 * PUT /api/auth/profile
 */
router.put('/profile', authenticateSupabaseToken, [
  body('name').optional().isLength({ min: 1 }).withMessage('Name must not be empty'),
  body('email').optional().isEmail().withMessage('Must be a valid email')
], async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, email } = req.body;
    const supabase = getSupabaseClient();
    
    if (email) {
      // Check if email is already taken by another user
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();
      
      if (existingUser && !checkError) {
        res.status(400).json({ error: 'Email is already taken by another user' });
        return;
      }
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Update user profile in public.users table
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      res.status(500).json({ error: 'Failed to update profile' });
      return;
    }

    // If email is being updated, also update in Supabase Auth
    if (email) {
      try {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          userId,
          { email }
        );
        
        if (authUpdateError) {
          console.error('Auth email update error:', authUpdateError);
          // Don't fail the request if auth update fails
        }
      } catch (authError) {
        console.error('Auth update error:', authError);
      }
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
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
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const supabase = getSupabaseClient();
    
    // Get user profile from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    res.json({ 
      valid: true, 
      user: userProfile 
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

/**
 * Verify Email
 * POST /api/auth/verify-email
 */
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { token } = req.body;
    const supabase = getSupabaseClient();
    
    // Verify email with Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });

    if (error) {
      console.error('Email verification error:', error);
      res.status(400).json({ error: error.message || 'Invalid or expired verification token' });
      return;
    }

    if (!data.user) {
      res.status(400).json({ error: 'Email verification failed' });
      return;
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Track email verification event
    try {
      await AnalyticsModel.trackEvent({
        user_id: data.user.id,
        feature_name: 'auth',
        action: 'email_verified',
        metadata: JSON.stringify({ email: data.user.email })
      });
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
    }

    res.json({ 
      message: 'Email verified successfully',
      user: userProfile || {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 'User',
        role: data.user.user_metadata?.role || 'user',
        email_verified: true
      }
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

/**
 * Resend Verification Email
 * POST /api/auth/resend-verification
 */
router.post('/resend-verification', createRateLimiter(5, 15), [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { email } = req.body;
    const supabase = getSupabaseClient();
    
    // Resend verification email with Supabase Auth
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/verify`
      }
    });

    if (error) {
      console.error('Resend verification error:', error);
      // Don't reveal specific errors for security
      res.json({ message: 'If an account with this email exists, a verification email has been sent.' });
      return;
    }

    res.json({ message: 'Verification email sent successfully' });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

export default router;
