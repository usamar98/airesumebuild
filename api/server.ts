/**
 * local server entry file, for local development
 */
import app from './app.ts';
import { initializeJobScheduler, shutdownJobScheduler } from './startup/initializeJobs.ts';

/**
 * start server with port
 */
const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server ready on port ${PORT}`);
  
  // Initialize job scheduler after server starts
  try {
    await initializeJobScheduler();
    console.log('Background job scheduler initialized successfully');
  } catch (error) {
    console.error('Failed to initialize job scheduler:', error);
    // Don't exit the server if job scheduler fails to initialize
    // The server can still function without background jobs
  }
});

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} signal received`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Shutdown job scheduler
    await shutdownJobScheduler();
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

/**
 * close server
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;



