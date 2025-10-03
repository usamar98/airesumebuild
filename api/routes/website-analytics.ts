/**
 * Website Analytics API routes
 * Handle website analytics tracking, UTM parameters, and custom events
 */
import { Router, type Request, type Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest, createRateLimiter } from '../middleware/supabaseAuth.ts';
import { CompanyWebsiteService } from '../services/platforms/index.ts';

const router = Router();

// Rate limiters
const trackingRateLimit = createRateLimiter(500, 60 * 1000); // 500 tracking requests per minute
const analyticsRateLimit = createRateLimiter(100, 60 * 1000); // 100 analytics requests per minute
const configRateLimit = createRateLimiter(20, 60 * 1000); // 20 config requests per minute

// Initialize website service
const websiteService = new CompanyWebsiteService();

/**
 * Track page view
 * POST /api/website-analytics/track/pageview
 */
router.post('/track/pageview',
  trackingRateLimit,
  [
    body('url').isURL().withMessage('Valid URL is required'),
    body('title').optional().isString().withMessage('Title must be a string'),
    body('referrer').optional().isURL().withMessage('Referrer must be a valid URL'),
    body('user_id').optional().isUUID().withMessage('user_id must be a valid UUID'),
    body('session_id').optional().isString().withMessage('session_id must be a string'),
    body('utm_source').optional().isString().withMessage('utm_source must be a string'),
    body('utm_medium').optional().isString().withMessage('utm_medium must be a string'),
    body('utm_campaign').optional().isString().withMessage('utm_campaign must be a string'),
    body('utm_term').optional().isString().withMessage('utm_term must be a string'),
    body('utm_content').optional().isString().withMessage('utm_content must be a string')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }

      const {
        url,
        title,
        referrer,
        user_id,
        session_id,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content
      } = req.body;

      const trackingData = {
        url,
        title,
        referrer,
        userId: user_id,
        sessionId: session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        utmParams: {
          source: utm_source,
          medium: utm_medium,
          campaign: utm_campaign,
          term: utm_term,
          content: utm_content
        }
      };

      const result = await websiteService.trackPageView(trackingData);

      res.json({
        message: 'Page view tracked successfully',
        tracking_id: result.trackingId,
        session_id: trackingData.sessionId
      });
    } catch (error: any) {
      console.error('Error tracking page view:', error);
      res.status(500).json({ error: 'Failed to track page view' });
    }
  }
);

/**
 * Track custom event
 * POST /api/website-analytics/track/event
 */
router.post('/track/event',
  trackingRateLimit,
  [
    body('event_name').isLength({ min: 1, max: 100 }).withMessage('Event name must be 1-100 characters'),
    body('event_category').optional().isString().withMessage('Event category must be a string'),
    body('event_label').optional().isString().withMessage('Event label must be a string'),
    body('event_value').optional().isNumeric().withMessage('Event value must be numeric'),
    body('url').optional().isURL().withMessage('URL must be valid'),
    body('user_id').optional().isUUID().withMessage('user_id must be a valid UUID'),
    body('session_id').optional().isString().withMessage('session_id must be a string'),
    body('custom_data').optional().isObject().withMessage('custom_data must be an object')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }

      const {
        event_name,
        event_category,
        event_label,
        event_value,
        url,
        user_id,
        session_id,
        custom_data
      } = req.body;

      const eventData = {
        eventName: event_name,
        eventCategory: event_category,
        eventLabel: event_label,
        eventValue: event_value ? parseFloat(event_value) : undefined,
        url,
        userId: user_id,
        sessionId: session_id,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        customData: custom_data
      };

      const result = await websiteService.trackCustomEvent(eventData);

      res.json({
        message: 'Event tracked successfully',
        tracking_id: result.trackingId
      });
    } catch (error: any) {
      console.error('Error tracking custom event:', error);
      res.status(500).json({ error: 'Failed to track custom event' });
    }
  }
);

/**
 * Generate UTM URL
 * POST /api/website-analytics/utm/generate
 */
router.post('/utm/generate',
  authenticateSupabaseToken,
  configRateLimit,
  [
    body('base_url').isURL().withMessage('Valid base URL is required'),
    body('utm_source').isLength({ min: 1 }).withMessage('UTM source is required'),
    body('utm_medium').isLength({ min: 1 }).withMessage('UTM medium is required'),
    body('utm_campaign').isLength({ min: 1 }).withMessage('UTM campaign is required'),
    body('utm_term').optional().isString().withMessage('UTM term must be a string'),
    body('utm_content').optional().isString().withMessage('UTM content must be a string')
  ],
  async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }

      const {
        base_url,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content
      } = req.body;

      const utmUrl = websiteService.generateUTMUrl(base_url, {
        source: utm_source,
        medium: utm_medium,
        campaign: utm_campaign,
        term: utm_term,
        content: utm_content
      });

      res.json({
        original_url: base_url,
        utm_url: utmUrl,
        utm_params: {
          source: utm_source,
          medium: utm_medium,
          campaign: utm_campaign,
          term: utm_term,
          content: utm_content
        }
      });
    } catch (error: any) {
      console.error('Error generating UTM URL:', error);
      res.status(500).json({ error: 'Failed to generate UTM URL' });
    }
  }
);

/**
 * Get website analytics data
 * GET /api/website-analytics/data
 */
router.get('/data',
  authenticateSupabaseToken,
  analyticsRateLimit,
  [
    query('start_date').optional().isISO8601().withMessage('start_date must be a valid ISO date'),
    query('end_date').optional().isISO8601().withMessage('end_date must be a valid ISO date'),
    query('aggregation').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('aggregation must be daily, weekly, or monthly'),
    query('metrics').optional().isString().withMessage('metrics must be a comma-separated string')
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

      const { start_date, end_date, aggregation = 'daily', metrics } = req.query;

      const analyticsData = await websiteService.fetchAnalytics(userId, {
        startDate: start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: end_date ? new Date(end_date as string) : new Date(),
        aggregation: aggregation as 'daily' | 'weekly' | 'monthly',
        metrics: metrics ? (metrics as string).split(',') : undefined
      });

      res.json({
        data: analyticsData,
        period: {
          start: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: end_date || new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error fetching website analytics:', error);
      res.status(500).json({ error: 'Failed to fetch website analytics' });
    }
  }
);

/**
 * Get website analytics summary
 * GET /api/website-analytics/summary
 */
router.get('/summary',
  authenticateSupabaseToken,
  analyticsRateLimit,
  [
    query('period').optional().isIn(['7d', '30d', '90d']).withMessage('period must be 7d, 30d, or 90d')
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

      const { period = '30d' } = req.query;

      const summary = await websiteService.getAnalyticsSummary(userId, period as '7d' | '30d' | '90d');

      res.json({ summary });
    } catch (error: any) {
      console.error('Error fetching website analytics summary:', error);
      res.status(500).json({ error: 'Failed to fetch website analytics summary' });
    }
  }
);

/**
 * Get top pages
 * GET /api/website-analytics/top-pages
 */
router.get('/top-pages',
  authenticateSupabaseToken,
  analyticsRateLimit,
  [
    query('start_date').optional().isISO8601().withMessage('start_date must be a valid ISO date'),
    query('end_date').optional().isISO8601().withMessage('end_date must be a valid ISO date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100')
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

      const { start_date, end_date, limit = 10 } = req.query;

      const topPages = await websiteService.getTopPages(userId, {
        startDate: start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: end_date ? new Date(end_date as string) : new Date(),
        limit: parseInt(limit as string)
      });

      res.json({ top_pages: topPages });
    } catch (error: any) {
      console.error('Error fetching top pages:', error);
      res.status(500).json({ error: 'Failed to fetch top pages' });
    }
  }
);

/**
 * Get traffic sources
 * GET /api/website-analytics/traffic-sources
 */
router.get('/traffic-sources',
  authenticateSupabaseToken,
  analyticsRateLimit,
  [
    query('start_date').optional().isISO8601().withMessage('start_date must be a valid ISO date'),
    query('end_date').optional().isISO8601().withMessage('end_date must be a valid ISO date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100')
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

      const { start_date, end_date, limit = 10 } = req.query;

      const trafficSources = await websiteService.getTrafficSources(userId, {
        startDate: start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: end_date ? new Date(end_date as string) : new Date(),
        limit: parseInt(limit as string)
      });

      res.json({ traffic_sources: trafficSources });
    } catch (error: any) {
      console.error('Error fetching traffic sources:', error);
      res.status(500).json({ error: 'Failed to fetch traffic sources' });
    }
  }
);

export default router;