/**
 * This is a API server
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env from project root BEFORE importing any modules that use env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Now import other modules
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import multer from 'multer'
import { improveText } from './routes/improve-text.ts'
import { analyzeResume } from './routes/analyze-resume.ts'
import generatePDF from './routes/generate-pdf.ts'
import parsePDF from './routes/parse-pdf.ts'
import { generateTemplates } from './routes/generate-templates.ts'
import getTemplates from './routes/get-templates.ts'
import { generateWorkSuggestions } from './routes/generate-work-suggestions.ts'
import { generateCoverLetter } from './routes/generate-cover-letter.ts'
import { generateUpworkProposal } from './routes/generate-upwork-proposal.ts'
import authRoutes from './routes/auth.ts'
import protectedRoutes from './routes/protected.ts'
import adminRoutes from './routes/admin.ts'
import personalSitesRoutes from './routes/personal-sites.ts'
// TEMPORARILY DISABLED FOR RAILWAY DEPLOYMENT - Job-related and employer features
// import jobsRoutes from './routes/jobs.ts'
// import savedJobsRoutes from './routes/saved-jobs.ts'
// import proposalsRoutes from './routes/proposals.ts'
// New job posting platform routes
// import jobPostingsRoutes from './routes/job-postings.ts'
// import applicationsRoutes from './routes/applications.ts'
import userProfilesRoutes from './routes/user-profiles.ts'
import aiAssistanceRoutes from './routes/ai-assistance.ts'
// import applicantRoutes from './routes/applicant.ts'
// import employerRoutes from './routes/employer.ts'
// Platform Analytics routes
import platformAnalyticsRoutes from './routes/platform-analytics.ts'
import referralsRoutes from './routes/referrals.ts'
import websiteAnalyticsRoutes from './routes/website-analytics.ts'
import checkUserExistsRoutes from './routes/check-user-exists.ts'
import helmet from 'helmet'
import { createRateLimiter, authenticateSupabaseToken } from './middleware/supabaseAuth.ts'

const app: express.Application = express()

// Using Supabase for all database operations

// Security middleware with CSP configuration to allow blob URLs
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", "blob:"], // Allow blob URLs in iframes
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:"],
      workerSrc: ["'self'", "blob:"]
    }
  }
}))
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://web-production-3f4a.up.railway.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting - temporarily disabled for debugging
// app.use('/api/auth', createRateLimiter(5, 15)) // 5 requests per 15 minutes for auth
// app.use('/api', createRateLimiter(100, 15)) // 100 requests per 15 minutes for general API

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() })

/**
 * Root route for API info
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Job Posting & Application Platform API Server',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      protected: '/api/protected',
      admin: '/api/admin',
      jobs: '/api/jobs',
      jobPostings: '/api/job-postings',
      applications: '/api/applications',
      userProfiles: '/api/user-profiles',
      aiAssistance: '/api/ai-assistance',
      platformAnalytics: '/api/platform-analytics',
      referrals: '/api/referrals',
      websiteAnalytics: '/api/website-analytics'
    }
  })
})

/**
 * health endpoint - MUST be before static file serving
 */
app.get('/api/health', (req: Request, res: Response) => {
  console.log('Health endpoint called');
  try {
    const response = {
      success: true,
      message: 'ok',
    };
    console.log('Sending response:', response);
    res.status(200).json(response);
    console.log('Response sent');
  } catch (error) {
    console.error('Health endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

/**
 * test endpoint
 */
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ success: true, message: 'test endpoint working' })
})

/**
 * API Routes - MUST be before static file serving
 */
// Authentication routes
app.use('/api/auth', authRoutes)
app.use('/api/protected', protectedRoutes)

// Admin routes - temporarily disabled during Supabase migration
// Routes
app.use('/api/admin', adminRoutes)

// TEMPORARILY DISABLED FOR RAILWAY DEPLOYMENT - Job-related and employer features
// Job-related routes
// app.use('/api/jobs', jobsRoutes)
// app.use('/api/saved-jobs', savedJobsRoutes)
// app.use('/api/proposals', proposalsRoutes)

// New job posting platform routes
// app.use('/api/job-postings', jobPostingsRoutes)
// app.use('/api/applications', applicationsRoutes)
app.use('/api/user-profiles', userProfilesRoutes)
app.use('/api/ai-assistance', aiAssistanceRoutes)
// app.use('/api/applicant', applicantRoutes)
// app.use('/api/employer', employerRoutes)

// Platform Analytics routes
app.use('/api/platform-analytics', platformAnalyticsRoutes)
app.use('/api/referrals', referralsRoutes)
app.use('/api/website-analytics', websiteAnalyticsRoutes)

// Personal Sites routes - MUST be before the catch-all /api route
app.use('/api/personal-sites', personalSitesRoutes)

app.use('/api', checkUserExistsRoutes)

// Existing API routes
app.post('/api/improve-text', improveText)
app.post('/api/analyze-resume', (req, res, next) => {
  console.log('Before multer middleware');
  console.log('Content-Type:', req.headers['content-type']);
  next();
}, upload.single('resume'), (req, res, next) => {
  console.log('After multer middleware');
  console.log('File:', req.file ? 'Present' : 'Missing');
  next();
}, analyzeResume)
app.post('/api/generate-pdf', generatePDF)
app.post('/api/parse-pdf', upload.single('resume'), parsePDF)
app.post('/api/generate-templates', generateTemplates)
app.get('/api/get-templates', getTemplates)
app.post('/api/generate-work-suggestions', generateWorkSuggestions)
app.post('/api/generate-cover-letter', authenticateSupabaseToken, generateCoverLetter)
app.post('/api/generate-upwork-proposal', authenticateSupabaseToken, generateUpworkProposal)

/**
 * Static file serving for production - MUST be after API routes
 */
// Temporarily disabled for development testing
// if (process.env.NODE_ENV === 'production') {
//   // Serve static files from the dist directory
//   app.use(express.static(path.join(__dirname, '..', 'dist')))
//   
//   // Handle React Router - send all non-API requests to index.html
//   app.get('/*', (req: Request, res: Response) => {
//     if (!req.path.startsWith('/api')) {
//       res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
//     }
//   })
// }

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler caught error:', error);
  console.error('Error stack:', error.stack);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  
  // Check if response was already sent
  if (res.headersSent) {
    console.error('Headers already sent, cannot send error response');
    return next(error);
  }
  
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
