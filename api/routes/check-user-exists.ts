import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface CheckUserExistsRequest {
  email: string;
}

interface CheckUserExistsResponse {
  exists: boolean;
  isVerified?: boolean;
  message?: string;
  error?: string;
}

/**
 * POST /api/check-user-exists
 * Check if a user with the given email already exists
 */
router.post('/check-user-exists', async (req: Request, res: Response) => {
  try {
    const { email }: CheckUserExistsRequest = req.body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        exists: false,
        error: 'Email is required and must be a string'
      } as CheckUserExistsResponse);
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    console.log('🔍 Checking if user exists for email:', normalizedEmail);

    // Check if user exists using admin client
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();

    if (checkError) {
      console.error('❌ Error checking existing users:', checkError);
      return res.status(500).json({
        exists: false,
        error: 'Failed to check user existence'
      } as CheckUserExistsResponse);
    }

    // Find user with matching email
    const existingUser = existingUsers.users.find(user => 
      user.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      console.log('🚫 User already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        confirmed: !!existingUser.email_confirmed_at,
        createdAt: existingUser.created_at
      });

      const isVerified = !!existingUser.email_confirmed_at;
      
      return res.status(200).json({
        exists: true,
        isVerified,
        message: isVerified 
          ? 'A user with this email already exists and is verified. Please try logging in instead.'
          : 'A user with this email already exists but is not verified. Please check your email for the verification link or try logging in.'
      } as CheckUserExistsResponse);
    }

    console.log('✅ No existing user found for email:', normalizedEmail);
    
    return res.status(200).json({
      exists: false,
      message: 'Email is available for registration'
    } as CheckUserExistsResponse);

  } catch (error: any) {
    console.error('💥 Unexpected error in check-user-exists:', error);
    return res.status(500).json({
      exists: false,
      error: 'Internal server error'
    } as CheckUserExistsResponse);
  }
});

export default router;