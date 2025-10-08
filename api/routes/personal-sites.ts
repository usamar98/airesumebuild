import express from 'express'
import multer from 'multer'
import { authenticateSupabaseToken } from '../middleware/supabaseAuth.ts'
import { supabase } from '../database/supabase.ts'
import { openaiService } from '../services/openaiService.ts'
import { v4 as uuidv4 } from 'uuid'
import mammoth from 'mammoth'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Upload and parse resume
router.post('/upload-resume', authenticateSupabaseToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user?.id
    const file = req.file

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Invalid file type. Only PDF and DOC files are allowed.' })
    }

    // Upload file to Supabase Storage
    const fileName = `${userId}/${uuidv4()}-${file.originalname}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resume-files')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return res.status(500).json({ success: false, error: 'Failed to upload file' })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resume-files')
      .getPublicUrl(fileName)

    // Parse the file content
    let extractedText = ''
    try {
      if (file.mimetype === 'application/pdf') {
        const pdf = await import('pdf-parse')
        const pdfData = await pdf.default(file.buffer)
        extractedText = pdfData.text
      } else if (file.mimetype.includes('word')) {
        const result = await mammoth.extractRawText({ buffer: file.buffer })
        extractedText = result.value
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError)
      return res.status(500).json({ success: false, error: 'Failed to parse file content' })
    }

    // Use OpenAI to extract structured data from the resume
    const prompt = `
    Parse the following resume text and extract structured information in JSON format:
    
    ${extractedText}
    
    Please extract and return a JSON object with the following structure:
    {
      "personalInfo": {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "phone number",
        "location": "city, state/country",
        "linkedin": "linkedin profile url",
        "website": "personal website url"
      },
      "summary": "Professional summary or objective",
      "experience": [
        {
          "title": "Job Title",
          "company": "Company Name",
          "location": "Location",
          "startDate": "Start Date",
          "endDate": "End Date or Present",
          "description": "Job description and achievements"
        }
      ],
      "education": [
        {
          "degree": "Degree Type",
          "institution": "School Name",
          "location": "Location",
          "graduationDate": "Graduation Date",
          "gpa": "GPA if mentioned"
        }
      ],
      "skills": ["skill1", "skill2", "skill3"],
      "projects": [
        {
          "name": "Project Name",
          "description": "Project description",
          "technologies": ["tech1", "tech2"],
          "url": "project url if available"
        }
      ],
      "certifications": [
        {
          "name": "Certification Name",
          "issuer": "Issuing Organization",
          "date": "Date Obtained"
        }
      ]
    }
    
    Only return the JSON object, no additional text.
    `

    const completion = await openaiService.generateText(prompt)

    let parsedData
    try {
      parsedData = JSON.parse(completion || '{}')
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return res.status(500).json({ success: false, error: 'Failed to parse AI response' })
    }

    // Save parsed data to database
    const { data: resumeParse, error: dbError } = await supabase
      .from('resume_parses')
      .insert({
        user_id: userId,
        file_url: publicUrl,
        file_name: file.originalname,
        file_size: file.size,
        parsed_data: parsedData,
        status: 'completed'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({ success: false, error: 'Failed to save parsed data' })
    }

    res.json({
      success: true,
      parsedData,
      parseId: resumeParse.id
    })

  } catch (error) {
    console.error('Upload resume error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get themes
router.get('/themes', async (req, res) => {
  try {
    console.log('🎨 Themes endpoint called');
    console.log('🔍 Querying site_themes table...');
    
    const { data: themes, error } = await supabase
      .from('site_themes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    console.log('📊 Database query result:', { themes: themes?.length || 0, error });

    if (error) {
      console.error('❌ Database error:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch themes' })
    }

    console.log('✅ Themes fetched successfully:', themes?.length || 0, 'themes');
    res.json({ success: true, themes })
  } catch (error) {
    console.error('💥 Get themes error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Generate site
router.post('/generate', authenticateSupabaseToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { parseId, themeId, customizations = {}, siteName } = req.body

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' })
    }

    if (!parseId || !themeId) {
      return res.status(400).json({ success: false, error: 'Parse ID and Theme ID are required' })
    }

    // Get parsed resume data
    const { data: resumeParse, error: parseError } = await supabase
      .from('resume_parses')
      .select('*')
      .eq('id', parseId)
      .eq('user_id', userId)
      .single()

    if (parseError || !resumeParse) {
      return res.status(404).json({ success: false, error: 'Resume parse not found' })
    }

    // Get theme configuration
    const { data: theme, error: themeError } = await supabase
      .from('site_themes')
      .select('*')
      .eq('id', themeId)
      .single()

    if (themeError || !theme) {
      return res.status(404).json({ success: false, error: 'Theme not found' })
    }

    // Generate subdomain
    const subdomain = `${resumeParse.parsed_data.personalInfo?.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}-${Date.now()}`

    // Use AI to generate enhanced content
    const prompt = `
    Based on the following resume data and theme, generate enhanced content for a personal website:
    
    Resume Data: ${JSON.stringify(resumeParse.parsed_data)}
    Theme: ${theme.name} (${theme.category})
    
    Generate enhanced content in JSON format:
    {
      "hero": {
        "headline": "Compelling professional headline",
        "subheadline": "Supporting description",
        "ctaText": "Call to action text"
      },
      "about": {
        "title": "About section title",
        "content": "Enhanced professional summary with personality"
      },
      "experience": {
        "title": "Experience section title",
        "items": [enhanced experience items with better descriptions]
      },
      "skills": {
        "title": "Skills section title",
        "categories": {
          "technical": ["technical skills"],
          "soft": ["soft skills"],
          "tools": ["tools and technologies"]
        }
      },
      "projects": {
        "title": "Projects section title",
        "items": [enhanced project descriptions]
      },
      "contact": {
        "title": "Contact section title",
        "message": "Contact call-to-action message"
      }
    }
    
    Make the content engaging, professional, and tailored to the theme style. Only return JSON.
    `

    const completion = await openaiService.generateText(prompt)

    let generatedContent
    try {
      generatedContent = JSON.parse(completion || '{}')
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      generatedContent = {}
    }

    // Create personal site record
    const { data: personalSite, error: siteError } = await supabase
      .from('personal_sites')
      .insert({
        user_id: userId,
        parse_id: parseId,
        site_name: siteName || `${resumeParse.parsed_data.personalInfo?.name || 'My'} Portfolio`,
        subdomain,
        theme_id: themeId,
        customizations,
        status: 'draft'
      })
      .select()
      .single()

    if (siteError) {
      console.error('Database error:', siteError)
      return res.status(500).json({ success: false, error: 'Failed to create site' })
    }

    // Create site content
    const { error: contentError } = await supabase
      .from('site_content')
      .insert({
        site_id: personalSite.id,
        sections: resumeParse.parsed_data,
        generated_content: generatedContent,
        user_edits: {},
        version: 1
      })

    if (contentError) {
      console.error('Content creation error:', contentError)
      return res.status(500).json({ success: false, error: 'Failed to create site content' })
    }

    const previewUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/personal-site-generator/preview/${personalSite.id}`

    res.json({
      success: true,
      siteId: personalSite.id,
      previewUrl,
      generatedContent,
      subdomain
    })

  } catch (error) {
    console.error('Generate site error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get site details
router.get('/:siteId', authenticateSupabaseToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { siteId } = req.params

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' })
    }

    const { data: site, error: siteError } = await supabase
      .from('personal_sites')
      .select(`
        *,
        site_content (*),
        site_themes (*)
      `)
      .eq('id', siteId)
      .eq('user_id', userId)
      .single()

    if (siteError || !site) {
      return res.status(404).json({ success: false, error: 'Site not found' })
    }

    res.json({ success: true, site })
  } catch (error) {
    console.error('Get site error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Update site content
router.put('/:siteId/content', authenticateSupabaseToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { siteId } = req.params
    const { sections, userEdits } = req.body

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' })
    }

    // Verify site ownership
    const { data: site, error: siteError } = await supabase
      .from('personal_sites')
      .select('id')
      .eq('id', siteId)
      .eq('user_id', userId)
      .single()

    if (siteError || !site) {
      return res.status(404).json({ success: false, error: 'Site not found' })
    }

    // Update site content
    const { data: updatedContent, error: updateError } = await supabase
      .from('site_content')
      .update({
        sections: sections || {},
        user_edits: userEdits || {},
        version: supabase.sql`version + 1`
      })
      .eq('site_id', siteId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return res.status(500).json({ success: false, error: 'Failed to update content' })
    }

    res.json({ success: true, content: updatedContent })
  } catch (error) {
    console.error('Update content error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Publish site
router.post('/:siteId/publish', authenticateSupabaseToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { siteId } = req.params
    const { customDomain } = req.body

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' })
    }

    // Verify site ownership
    const { data: site, error: siteError } = await supabase
      .from('personal_sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', userId)
      .single()

    if (siteError || !site) {
      return res.status(404).json({ success: false, error: 'Site not found' })
    }

    const publishedUrl = customDomain || `https://${site.subdomain}.myportfolio.com`

    // Update site status
    const { data: updatedSite, error: updateError } = await supabase
      .from('personal_sites')
      .update({
        status: 'published',
        published_url: publishedUrl,
        custom_domain: customDomain || null
      })
      .eq('id', siteId)
      .select()
      .single()

    if (updateError) {
      console.error('Publish error:', updateError)
      return res.status(500).json({ success: false, error: 'Failed to publish site' })
    }

    res.json({
      success: true,
      publishedUrl,
      status: 'published'
    })
  } catch (error) {
    console.error('Publish site error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get user's sites
router.get('/', authenticateSupabaseToken, async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' })
    }

    const { data: sites, error } = await supabase
      .from('personal_sites')
      .select(`
        *,
        site_themes (name, category)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch sites' })
    }

    res.json({ success: true, sites })
  } catch (error) {
    console.error('Get sites error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Delete site
router.delete('/:siteId', authenticateSupabaseToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { siteId } = req.params

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' })
    }

    // Verify site ownership and delete
    const { error } = await supabase
      .from('personal_sites')
      .delete()
      .eq('id', siteId)
      .eq('user_id', userId)

    if (error) {
      console.error('Delete error:', error)
      return res.status(500).json({ success: false, error: 'Failed to delete site' })
    }

    res.json({ success: true, message: 'Site deleted successfully' })
  } catch (error) {
    console.error('Delete site error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router