import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

// Lazy initialization of Supabase client
const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
};

export interface SupabaseAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    email_verified: boolean;
  };
}

// Middleware to verify Supabase JWT token
export const authenticateSupabaseToken = async (
  req: SupabaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('Auth middleware - Headers:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('Auth middleware - Token:', token ? `${token.substring(0, 20)}...` : 'Missing');

    if (!token) {
      console.log('Auth middleware - No token provided');
      res.status(401).json({ 
        success: false,
        message: 'Access denied. Please log in to use this feature.',
        requiresAuth: true 
      });
      return;
    }

    // Verify the JWT token with Supabase
    console.log('Auth middleware - Verifying token with Supabase...');
    const { data: { user }, error } = await getSupabaseClient().auth.getUser(token);

    if (error || !user) {
      console.log('Auth middleware - Token verification failed:', error?.message || 'No user');
      res.status(401).json({ 
        success: false,
        message: 'Invalid token. Please log in again.',
        requiresAuth: true 
      });
      return;
    }

    console.log('Auth middleware - Token verified, user ID:', user.id);

    // Get user profile from users table
    console.log('Auth middleware - Fetching user profile...');
    const { data: profile, error: profileError } = await getSupabaseClient()
      .from('users')
      .select('name, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Auth middleware - Error fetching user profile:', profileError);
      res.status(401).json({ 
        success: false,
        message: 'User profile not found.',
        requiresAuth: true 
      });
      return;
    }

    console.log('Auth middleware - Profile found:', profile ? 'Yes' : 'No');
    console.log('Auth middleware - Setting user data and proceeding...');

    req.user = {
      id: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || '',
      role: profile?.role || 'user',
      email_verified: user.email_confirmed_at !== null
    };

    next();
  } catch (error) {
    console.error('Supabase authentication error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid token. Please log in again.',
      requiresAuth: true 
    });
  }
};

// Middleware to require verified email
export const requireVerifiedEmail = async (
  req: SupabaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Please log in to use this feature.',
        requiresAuth: true
      });
      return;
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await getSupabaseClient().auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
        requiresAuth: true
      });
      return;
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      res.status(403).json({
        success: false,
        message: 'This feature requires email verification. Please check your email and verify your account.',
        requiresVerification: true,
        user: {
          email: user.email,
          email_verified: false
        }
      });
      return;
    }

    // Get user profile from users table
    const { data: profile, error: profileError } = await getSupabaseClient()
      .from('users')
      .select('name, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      res.status(401).json({
        success: false,
        message: 'User profile not found.',
        requiresAuth: true
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || '',
      role: profile?.role || 'user',
      email_verified: true
    };

    next();
  } catch (error) {
    console.error('Supabase authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
      requiresAuth: true
    });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (
  req: SupabaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Authentication required',
      requiresAuth: true 
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
    return;
  }

  next();
};

// Rate limiter middleware
export const createRateLimiter = (maxRequests: number, windowMinutes: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    const clientData = requests.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }
    
    if (clientData.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: `Too many requests. Please try again in ${Math.ceil((clientData.resetTime - now) / 60000)} minutes.`
      });
      return;
    }
    
    clientData.count++;
    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalSupabaseAuth = async (
  req: SupabaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user }, error } = await getSupabaseClient().auth.getUser(token);
      
      if (!error && user) {
        // Get user profile from users table
        const { data: profile } = await getSupabaseClient()
          .from('users')
          .select('name, role')
          .eq('id', user.id)
          .single();

        req.user = {
          id: user.id,
          email: user.email!,
          name: profile?.name || user.user_metadata?.name || '',
          role: profile?.role || 'user',
          email_verified: user.email_confirmed_at !== null
        };
      }
    }
  } catch (error) {
    // Ignore token errors for optional auth
    console.log('Optional auth failed, continuing without user');
  }
  
  next();
};