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
import { improveText } from './routes/improve-text.js'
import { analyzeResume } from './routes/analyze-resume.js'
import generatePDF from './routes/generate-pdf.js'
import parsePDF from './routes/parse-pdf.js'
import { generateTemplates } from './routes/generate-templates.js'
import getTemplates from './routes/get-templates.js'
import { generateWorkSuggestions } from './routes/generate-work-suggestions.js'
import { generateCoverLetter } from './routes/generate-cover-letter.js'
import authRoutes from './routes/auth.js'
import protectedRoutes from './routes/protected.js'
import adminRoutes from './routes/admin.js'
import { db } from './database/database.js'
import helmet from 'helmet'
import { createRateLimiter, authenticateSupabaseToken } from './middleware/supabaseAuth.js'

const app: express.Application = express()

// Database is automatically initialized when imported

// Security middleware
app.use(helmet())
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

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() })

/**
 * Static file serving for production
 */
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, '..', 'dist')))
  
  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
    }
  })
}

/**
 * Root route for API info
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Resume AI API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      protected: '/api/protected',
      admin: '/api/admin'
    }
  })
})

/**
 * API Routes
 */
// Authentication routes
app.use('/api/auth', authRoutes)
app.use('/api/protected', protectedRoutes)

// Admin routes
app.use('/api/admin', adminRoutes)

// Existing API routes
app.post('/api/improve-text', improveText)
app.post('/api/analyze-resume', upload.single('resume'), analyzeResume)
app.post('/api/generate-pdf', generatePDF)
app.post('/api/parse-pdf', upload.single('file'), parsePDF)
app.post('/api/generate-templates', generateTemplates)
app.get('/api/get-templates', getTemplates)
app.post('/api/generate-work-suggestions', generateWorkSuggestions)
app.post('/api/generate-cover-letter', authenticateSupabaseToken, generateCoverLetter)

/**
 * test endpoint
 */
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ success: true, message: 'test endpoint working' })
})

/**
 * health
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'ok',
  })
})

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
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
