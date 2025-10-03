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

      const referrals = await referralsService.getUserReferrals(userId, {
        status: status as 'pending' | 'completed' | 'expired' | undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

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
        referredEmail: referred_email,
        jobId: job_id,
        campaignName: campaign_name,
        metadata
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

      const referralUrl = await referralsService.generateReferralUrl(userId, {
        baseUrl: base_url,
        jobId: job_id,
        campaignName: campaign_name,
        customParams: custom_params
      });

      res.json({
        referral_url: referralUrl.url,
        referral_code: referralUrl.code,
        expires_at: referralUrl.expiresAt
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

      const trackingResult = await referralsService.trackReferralAction(referral_code, {
        action,
        userAgent: user_agent,
        ipAddress: ip_address || req.ip,
        metadata
      });

      if (!trackingResult.success) {
        res.status(404).json({ error: trackingResult.error || 'Referral not found' });
        return;
      }

      res.json({
        message: 'Referral action tracked successfully',
        referral_id: trackingResult.referralId,
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

      const { ref: referralCode, action = 'click' } = req.query;

      const result = await referralsService.processReferralFromUrl(referralCode as string, {
        action,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });

      if (!result.success) {
        res.status(404).json({ error: result.error || 'Invalid referral code' });
        return;
      }

      res.json({
        message: 'Referral processed successfully',
        referral: result.referral,
        redirect_url: result.redirectUrl
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
        startDate: start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: end_date ? new Date(end_date as string) : new Date(),
        campaignName: campaign_name as string,
        aggregation: aggregation as 'daily' | 'weekly' | 'monthly'
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

      const summary = await referralsService.getReferralSummary(userId);

      res.json({ summary });
    } catch (error: any) {
      console.error('Error fetching referral summary:', error);
      res.status(500).json({ error: 'Failed to fetch referral summary' });
    }
  }
);

export default router;