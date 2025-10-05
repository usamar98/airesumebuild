/**
 * Admin dashboard API routes
 * Handle user management and analytics for admin users
 */
import { Router, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../models/User.js';
import { AnalyticsModel } from '../models/Analytics.js';
import { authenticateSupabaseToken, requireAdmin, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth.js';

const router = Router();

// Apply authentication and admin check to all routes
router.use(authenticateSupabaseToken);
router.use(requireAdmin);

/**
 * Get dashboard overview statistics
 * GET /api/admin/dashboard
 */
router.get('/dashboard', async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [userStats, featureUsage, dailyActiveUsers, featureAdoption] = await Promise.all([
      UserModel.getUserStats(),
      AnalyticsModel.getFeatureUsageStats(30),
      AnalyticsModel.getDailyActiveUsers(30),
      AnalyticsModel.getFeatureAdoptionRate('job_search', 30)
    ]);

    res.json({
      userStats,
      featureUsage,
      dailyActiveUsers,
      featureAdoption
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * Get all users with pagination
 * GET /api/admin/users
 */
router.get('/users', async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const users = await UserModel.findAll(limit, offset);
    const userStats = await UserModel.getUserStats();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: userStats.totalUsers,
        totalPages: Math.ceil(userStats.totalUsers / limit)
      }
    });
  } catch (error: any) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Get specific user details with analytics
 * GET /api/admin/users/:id
 */
router.get('/users/:id', async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = await AnalyticsModel.exportUserData(userId);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      analytics: userData.analytics_data
    });
  } catch (error: any) {
    console.error('User details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

/**
 * Update user (admin can modify any user)
 * PUT /api/admin/users/:id
 */
router.put('/users/:id', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin')
], async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const updates = req.body;
    const updatedUser = await UserModel.updateUser(userId, updates);
    
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Track admin action
    await AnalyticsModel.trackEvent({
      user_id: req.user!.id,
      feature_name: 'admin',
      action: 'update_user',
      metadata: JSON.stringify({ target_user_id: userId, updates })
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ message: 'User updated successfully', user: userWithoutPassword });
  } catch (error: any) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const deleted = await UserModel.deleteUser(userId);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Track admin action
    await AnalyticsModel.trackEvent({
      user_id: req.user!.id,
      feature_name: 'admin',
      action: 'delete_user',
      metadata: JSON.stringify({ target_user_id: userId })
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * Get analytics overview
 * GET /api/admin/analytics
 */
router.get('/analytics', async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const [featureUsage, userEngagement, popularTemplates, popularIndustries] = await Promise.all([
      AnalyticsModel.getFeatureUsageStats(days),
      AnalyticsModel.getUserEngagementStats(50),
      AnalyticsModel.getPopularTemplates(days),
      AnalyticsModel.getPopularIndustries(days)
    ]);

    res.json({
      featureUsage,
      userEngagement,
      popularTemplates,
      popularIndustries
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * Get recent activity feed
 * GET /api/admin/activity
 */
router.get('/activity', async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const activities = await AnalyticsModel.getRecentActivity(limit);

    res.json({ activities });
  } catch (error: any) {
    console.error('Activity feed error:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

/**
 * Export user data (GDPR compliance)
 * GET /api/admin/users/:id/export
 */
router.get('/users/:id/export', async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const userData = await AnalyticsModel.exportUserData(userId);
    if (!userData.user_info) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Track admin action
    await AnalyticsModel.trackEvent({
      user_id: req.user!.id,
      feature_name: 'admin',
      action: 'export_user_data',
      metadata: JSON.stringify({ target_user_id: userId })
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user_${userId}_data.json"`);
    res.json(userData);
  } catch (error: any) {
    console.error('User export error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

/**
 * Get feature adoption metrics
 * GET /api/admin/metrics/adoption
 */
router.get('/metrics/adoption', async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const feature = req.query.feature as string || 'job_search';
    const adoption = await AnalyticsModel.getFeatureAdoptionRate(feature, 30);
    res.json({ adoption });
  } catch (error: any) {
    console.error('Adoption metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch adoption metrics' });
  }
});

/**
 * Get daily active users chart data
 * GET /api/admin/metrics/dau
 */
router.get('/metrics/dau', async (req: SupabaseAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const dauData = await AnalyticsModel.getDailyActiveUsers(days);
    res.json({ dauData });
  } catch (error: any) {
    console.error('DAU metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch DAU metrics' });
  }
});

export default router;