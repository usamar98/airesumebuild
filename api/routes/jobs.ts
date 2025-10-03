/**
 * Job Management API Routes
 * Handles job scheduling, monitoring, and control endpoints
 */
import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateSupabaseToken, createRateLimiter } from '../middleware/supabaseAuth';
import { getJobScheduler } from '../startup/initializeJobs';
import { JobScheduler } from '../jobs/JobScheduler';

const router = express.Router();

// Create rate limiter for job management (5 requests per minute)
const jobRateLimit = createRateLimiter(5, 1);

// Apply rate limiting and authentication to all routes
router.use(jobRateLimit);
router.use(authenticateSupabaseToken);

/**
 * Helper function to check if scheduler is available
 */
const checkScheduler = (res: any) => {
  const scheduler = getJobScheduler();
  if (!scheduler) {
    res.status(503).json({
      success: false,
      error: 'Job scheduler not initialized'
    });
    return null;
  }
  return scheduler;
};

/**
 * GET /api/jobs
 * Get all job configurations and their status
 */
router.get('/', async (req, res) => {
  try {
    const scheduler = checkScheduler(res);
    if (!scheduler) return;
    
    const jobs = await scheduler.getAllJobs();
    
    // Get latest execution status for each job
    const jobsWithStatus = await Promise.all(
      jobs.map(async (job) => {
        const executions = await scheduler.getJobExecutions(job.id, 1);
        const latestExecution = executions[0] || null;
        
        return {
          ...job,
          latest_execution: latestExecution,
          overall_status: determineOverallStatus(job, latestExecution)
        };
      })
    );

    res.json({
      success: true,
      jobs: jobsWithStatus,
      total: jobsWithStatus.length
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs'
    });
  }
});

/**
 * GET /api/jobs/:jobId
 * Get specific job configuration and status
 */
router.get('/:jobId', [
  param('jobId').notEmpty().withMessage('Job ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { jobId } = req.params;
    const scheduler = checkScheduler(res);
    if (!scheduler) return;
    
    const job = await scheduler.getJobStatus(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const executions = await scheduler.getJobExecutions(jobId, 10);
    const latestExecution = executions[0] || null;

    res.json({
      success: true,
      job: {
        ...job,
        latest_execution: latestExecution,
        overall_status: determineOverallStatus(job, latestExecution),
        recent_executions: executions
      }
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job'
    });
  }
});

/**
 * GET /api/jobs/:jobId/executions
 * Get execution history for a specific job
 */
router.get('/:jobId/executions', [
  param('jobId').notEmpty().withMessage('Job ID is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { jobId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const scheduler = checkScheduler(res);
    if (!scheduler) return;
    
    const executions = await scheduler.getJobExecutions(jobId, limit);

    res.json({
      success: true,
      executions,
      total: executions.length
    });
  } catch (error) {
    console.error('Error fetching job executions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job executions'
    });
  }
});

/**
 * POST /api/jobs/:jobId/trigger
 * Manually trigger a job execution
 */
router.post('/:jobId/trigger', [
  param('jobId').notEmpty().withMessage('Job ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { jobId } = req.params;
    const scheduler = checkScheduler(res);
    if (!scheduler) return;
    
    // Check if job exists
    const job = await scheduler.getJobStatus(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Trigger the job
    const result = await scheduler.triggerJob(jobId);

    res.json({
      success: true,
      message: 'Job triggered successfully',
      execution_result: result
    });
  } catch (error) {
    console.error('Error triggering job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger job'
    });
  }
});

/**
 * PUT /api/jobs/:jobId/enable
 * Enable a job
 */
router.put('/:jobId/enable', [
  param('jobId').notEmpty().withMessage('Job ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { jobId } = req.params;
    const scheduler = checkScheduler(res);
    if (!scheduler) return;
    
    await scheduler.enableJob(jobId);

    res.json({
      success: true,
      message: 'Job enabled successfully'
    });
  } catch (error) {
    console.error('Error enabling job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable job'
    });
  }
});

/**
 * PUT /api/jobs/:jobId/disable
 * Disable a job
 */
router.put('/:jobId/disable', [
  param('jobId').notEmpty().withMessage('Job ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { jobId } = req.params;
    const scheduler = checkScheduler(res);
    if (!scheduler) return;
    
    await scheduler.disableJob(jobId);

    res.json({
      success: true,
      message: 'Job disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable job'
    });
  }
});

/**
 * GET /api/jobs/status/summary
 * Get overall job system status summary
 */
router.get('/status/summary', async (req, res) => {
  try {
    const scheduler = checkScheduler(res);
    if (!scheduler) return;
    
    const jobs = await scheduler.getAllJobs();
    
    const summary = {
      total_jobs: jobs.length,
      enabled_jobs: jobs.filter(j => j.enabled).length,
      disabled_jobs: jobs.filter(j => !j.enabled).length,
      jobs_with_errors: 0,
      last_activity: null as Date | null,
      system_health: 'healthy' as 'healthy' | 'warning' | 'error'
    };

    // Get execution status for each job
    let hasErrors = false;
    let lastActivity: Date | null = null;

    for (const job of jobs) {
      const executions = await scheduler.getJobExecutions(job.id, 1);
      const latestExecution = executions[0];
      
      if (latestExecution) {
        const executionDate = new Date(latestExecution.started_at);
        if (!lastActivity || executionDate > lastActivity) {
          lastActivity = executionDate;
        }
        
        if (latestExecution.status === 'failed') {
          summary.jobs_with_errors++;
          hasErrors = true;
        }
      }
    }

    summary.last_activity = lastActivity;
    
    // Determine system health
    if (summary.jobs_with_errors > 0) {
      summary.system_health = summary.jobs_with_errors > summary.enabled_jobs / 2 ? 'error' : 'warning';
    }

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error fetching job summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job summary'
    });
  }
});

/**
 * GET /api/jobs/health
 * Health check endpoint for job system
 */
router.get('/health', async (req, res) => {
  try {
    const scheduler = getJobScheduler();
    
    if (!scheduler) {
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'Job scheduler not initialized'
      });
    }

    const jobs = await scheduler.getAllJobs();
    const enabledJobs = jobs.filter(j => j.enabled);
    
    res.json({
      success: true,
      status: 'healthy',
      message: 'Job system is operational',
      details: {
        total_jobs: jobs.length,
        enabled_jobs: enabledJobs.length,
        scheduler_running: true
      }
    });
  } catch (error) {
    console.error('Error checking job health:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: 'Job system health check failed',
      error: error.message
    });
  }
});

/**
 * Helper function to determine overall job status
 */
function determineOverallStatus(job: any, latestExecution: any): string {
  if (!job.enabled) return 'disabled';
  if (!latestExecution) return 'pending';
  
  switch (latestExecution.status) {
    case 'running':
      return 'running';
    case 'completed':
      return 'healthy';
    case 'failed':
      return job.retry_count >= job.max_retries ? 'failed' : 'retrying';
    case 'timeout':
      return 'timeout';
    default:
      return 'unknown';
  }
}

export default router;