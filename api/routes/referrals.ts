/**
 * Referrals API routes
 * Handle referral creation, tracking, and analytics
 */
import { Router, type Request, type Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest, createRateLimiter } from '../middleware/supabaseAuth.ts';
import { ReferralsService } from '../services/platforms/index.ts';

const router = Router();

// Rate limiters
const referralRateLimit = createRateLimiter(50, 60 * 1000); // 50 requests per minute
const createRateLimit = createRateLimiter(10, 60 * 1000); // 10 creates per minute
const trackingRateLimit = createRateLimiter(200, 60 * 1000); // 200 tracking requests per minute

// Initialize referrals service
const referralsService = new ReferralsService();

/**
 * Get user's referrals
 * GET /api/referrals
 */
router.get('/',
  authenticateSupabaseToken,
  referralRateLimit,
  [
    query('status').optional().isIn(['pending', 'completed', 'expired']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
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

      const { status, limit = 20, offset = 0 } = req.query;

      const referrals = await referralsService.getUserReferrals(userId, status as string);

      res.json({ referrals });
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  }
);

/**
 * Create a new referral
 * POST /api/referrals
 */
router.post('/',
  authenticateSupabaseToken,
  createRateLimit,
  [
    body('referred_email').isEmail().withMessage('Valid email is required'),
    body('job_id').optional().isUUID().withMessage('job_id must be a valid UUID'),
    body('campaign_name').optional().isLength({ min: 1, max: 100 }).withMessage('Campaign name must be 1-100 characters'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
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

      const { referred_email, job_id, campaign_name, metadata } = req.body;

      const referral = await referralsService.createReferral(userId, {
        referrer_user_id: userId,
        referral_source: campaign_name || 'manual',
        job_posting_id: job_id,
        metadata: { ...metadata, referred_email }
      });

      res.status(201).json({
        message: 'Referral created successfully',
        referral
      });
    } catch (error: any) {
      console.error('Error creating referral:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: 'Referral already exists for this email' });
      } else {
        res.status(500).json({ error: 'Failed to create referral' });
      }
    }
  }
);

/**
 * Generate referral URL
 * POST /api/referrals/generate-url
 */
router.post('/generate-url',
  authenticateSupabaseToken,
  referralRateLimit,
  [
    body('base_url').isURL().withMessage('Valid base URL is required'),
    body('job_id').optional().isUUID().withMessage('job_id must be a valid UUID'),
    body('campaign_name').optional().isLength({ min: 1, max: 100 }).withMessage('Campaign name must be 1-100 characters'),
    body('custom_params').optional().isObject().withMessage('Custom params must be an object')
  ],
  async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
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

      const { base_url, job_id, campaign_name, custom_params } = req.body;

      // First create a referral to get the referral code
      const referralResult = await referralsService.createReferral(userId, {
        referrer_user_id: userId,
        referral_source: campaign_name || 'url_generation',
        job_posting_id: job_id,
        metadata: custom_params || {}
      });

      if (!referralResult.success || !referralResult.data) {
        res.status(500).json({ error: 'Failed to create referral' });
        return;
      }

      // Generate the URL using the referral code
      const referralUrl = referralsService.generateReferralUrl(
        base_url,
        referralResult.data.referral_code,
        job_id
      );

      res.json({
        referral_url: referralUrl,
        referral_code: referralResult.data.referral_code,
        expires_at: referralResult.data.expires_at
      });
    } catch (error: any) {
      console.error('Error generating referral URL:', error);
      res.status(500).json({ error: 'Failed to generate referral URL' });
    }
  }
);

/**
 * Track referral click/conversion
 * POST /api/referrals/track
 */
router.post('/track',
  trackingRateLimit,
  [
    body('referral_code').isLength({ min: 1 }).withMessage('Referral code is required'),
    body('action').isIn(['click', 'signup', 'application', 'hire']).withMessage('Invalid action type'),
    body('user_agent').optional().isString().withMessage('User agent must be a string'),
    body('ip_address').optional().isIP().withMessage('Invalid IP address'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }

      const { referral_code, action, user_agent, ip_address, metadata } = req.body;

      // Get referral by code to verify it exists
      const referralResult = await referralsService.getReferralByCode(referral_code);
      
      if (!referralResult.success || !referralResult.data) {
        res.status(404).json({ error: 'Referral not found' });
        return;
      }

      // For now, just log the tracking action (could be enhanced to store in a tracking table)
      console.log('Referral action tracked:', {
        referral_code,
        action,
        user_agent,
        ip_address: ip_address || req.ip,
        metadata
      });

      res.json({
        message: 'Referral action tracked successfully',
        referral_id: referralResult.data.id,
        action_tracked: action
      });
    } catch (error: any) {
      console.error('Error tracking referral:', error);
      res.status(500).json({ error: 'Failed to track referral action' });
    }
  }
);

/**
 * Process referral from URL parameters
 * GET /api/referrals/process
 */
router.get('/process',
  trackingRateLimit,
  [
    query('ref').isLength({ min: 1 }).withMessage('Referral code is required'),
    query('action').optional().isIn(['click', 'signup', 'application']).withMessage('Invalid action type')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }

      const { ref: referralCode, action = 'click' } = req.query as { ref: string; action?: string };

      // For processing referrals from URL, we need a user ID. 
      // Since this is a public endpoint, we'll just verify the referral exists
      const referralResult = await referralsService.getReferralByCode(referralCode as string);
      
      if (!referralResult.success || !referralResult.data) {
        res.status(404).json({ error: 'Invalid referral code' });
        return;
      }

      // Log the referral click
      console.log('Referral processed from URL:', {
        referral_code: referralCode,
        action,
        user_agent: req.get('User-Agent'),
        ip_address: req.ip
      });

      res.json({
        message: 'Referral processed successfully',
        referral: referralResult.data,
        redirect_url: '/' // Default redirect
      });
    } catch (error: any) {
      console.error('Error processing referral:', error);
      res.status(500).json({ error: 'Failed to process referral' });
    }
  }
);

/**
 * Get referral analytics
 * GET /api/referrals/analytics
 */
router.get('/analytics',
  authenticateSupabaseToken,
  referralRateLimit,
  [
    query('start_date').optional().isISO8601().withMessage('start_date must be a valid ISO date'),
    query('end_date').optional().isISO8601().withMessage('end_date must be a valid ISO date'),
    query('campaign_name').optional().isString().withMessage('Campaign name must be a string'),
    query('aggregation').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('aggregation must be daily, weekly, or monthly')
  ],
  async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
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

      const { start_date, end_date, campaign_name, aggregation = 'daily' } = req.query;

      const analytics = await referralsService.fetchAnalytics(userId, {
        start: start_date ? new Date(start_date as string).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: end_date ? new Date(end_date as string).toISOString() : new Date().toISOString()
      });

      res.json({
        analytics,
        period: {
          start: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: end_date || new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error fetching referral analytics:', error);
      res.status(500).json({ error: 'Failed to fetch referral analytics' });
    }
  }
);

/**
 * Get referral performance summary
 * GET /api/referrals/summary
 */
router.get('/summary',
  authenticateSupabaseToken,
  referralRateLimit,
  async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get basic referral summary using existing methods
      const referrals = await referralsService.getUserReferrals(userId);
      
      if (!referrals.success) {
        res.status(500).json({ error: 'Failed to fetch referral summary' });
        return;
      }

      const summary = {
        total_referrals: referrals.data?.length || 0,
        pending_referrals: referrals.data?.filter(r => r.status === 'pending').length || 0,
        approved_referrals: referrals.data?.filter(r => r.status === 'approved').length || 0,
        rejected_referrals: referrals.data?.filter(r => r.status === 'rejected').length || 0
      };

      res.json({ summary });
    } catch (error: any) {
      console.error('Error fetching referral summary:', error);
      res.status(500).json({ error: 'Failed to fetch referral summary' });
    }
  }
);

export default router;