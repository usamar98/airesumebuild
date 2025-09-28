import { Router } from 'express';
import { requireVerifiedEmail, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth.js';
import { AnalyticsModel } from '../models/Analytics.js';

const router = Router();

// Apply authentication middleware to all routes in this router
router.use(requireVerifiedEmail);

// Resume Builder route
router.get('/resume-builder', async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // Track feature usage
    await AnalyticsModel.trackEvent({
      event_type: 'feature_usage',
      feature_name: 'resume_builder',
      action: 'access',
      user_id: req.user?.id
    });

    res.json({
      success: true,
      message: 'Resume Builder access granted',
      feature: 'resume_builder',
      user: req.user
    });
  } catch (error) {
    console.error('Resume Builder error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Resume Analyzer route
router.get('/resume-analyzer', async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // Track feature usage
    await AnalyticsModel.trackEvent({
      event_type: 'feature_usage',
      feature_name: 'resume_analyzer',
      action: 'access',
      user_id: req.user?.id
    });

    res.json({
      success: true,
      message: 'Resume Analyzer access granted',
      feature: 'resume_analyzer',
      user: req.user
    });
  } catch (error) {
    console.error('Resume Analyzer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Templates route
router.get('/templates', async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // Track feature usage
    await AnalyticsModel.trackEvent({
      event_type: 'feature_usage',
      feature_name: 'templates',
      action: 'access',
      user_id: req.user?.id
    });

    res.json({
      success: true,
      message: 'Templates access granted',
      feature: 'templates',
      user: req.user
    });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cover Letter route
router.get('/cover-letter', async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // Track feature usage
    await AnalyticsModel.trackEvent({
      event_type: 'feature_usage',
      feature_name: 'cover_letter',
      action: 'access',
      user_id: req.user?.id
    });

    res.json({
      success: true,
      message: 'Cover Letter access granted',
      feature: 'cover_letter',
      user: req.user
    });
  } catch (error) {
    console.error('Cover Letter error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile (protected route)
router.get('/profile', async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;