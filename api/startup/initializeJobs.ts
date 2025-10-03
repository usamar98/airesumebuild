/**
 * Job Scheduler Initialization
 * Initializes and starts the background job scheduler when the server starts
 */
import JobScheduler from '../jobs/JobScheduler.ts';

let jobScheduler: JobScheduler | null = null;

/**
 * Initialize the job scheduler
 */
export const initializeJobScheduler = async (): Promise<JobScheduler> => {
  if (jobScheduler) {
    console.log('Job scheduler already initialized');
    return jobScheduler;
  }

  try {
    console.log('Initializing job scheduler...');
    jobScheduler = new JobScheduler();
    await jobScheduler.initialize();
    
    // Start the scheduler
    await jobScheduler.start();
    
    console.log('Job scheduler initialized and started successfully');
    return jobScheduler;
  } catch (error) {
    console.error('Failed to initialize job scheduler:', error);
    throw error;
  }
};

/**
 * Get the job scheduler instance
 */
export const getJobScheduler = (): JobScheduler | null => {
  return jobScheduler;
};

/**
 * Shutdown the job scheduler gracefully
 */
export const shutdownJobScheduler = async (): Promise<void> => {
  if (jobScheduler) {
    try {
      console.log('Shutting down job scheduler...');
      await jobScheduler.stop();
      jobScheduler = null;
      console.log('Job scheduler shut down successfully');
    } catch (error) {
      console.error('Error shutting down job scheduler:', error);
    }
  }
};