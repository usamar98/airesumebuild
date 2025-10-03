import { Request, Response } from 'express';
import { ResumeData } from '../../src/types/index.js';
import fs from 'fs';
import path from 'path';

interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  font_family: string;
  font_size: number;
  primary_color: string;
  secondary_color: string;
  section_order: string[];
  bullet_style: string;
  spacing: string;
  category: string;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 Generate PDF Request Body:', JSON.stringify(req.body, null, 2));
    console.log('📥 Request Body Keys:', Object.keys(req.body || {}));
    
    const { resumeData, templateId }: { resumeData: ResumeData; templateId?: string } = req.body;
    
    console.log('📥 Extracted resumeData:', resumeData ? 'exists' : 'undefined');
    console.log('📥 Extracted templateId:', templateId);

    // Validate required fields
    if (!resumeData.personalInfo?.fullName || !resumeData.personalInfo?.email) {
      return res.status(400).json({ error: 'Missing required personal information' });
    }

    if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
      return res.status(400).json({ error: 'At least one work experience is required' });
    }

    if (!resumeData.skills || resumeData.skills.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required' });
    }

    // Load template metadata if templateId is provided
    let templateMetadata: TemplateMetadata | null = null;
    
    if (templateId) {
      try {
        const templatesDir = path.join(process.cwd(), 'templates', 'generated');
        const templatePath = path.join(templatesDir, `${templateId}.json`);
        
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          templateMetadata = JSON.parse(templateContent);
          console.log(`Loaded template: ${templateId}`);
        } else {
          console.warn(`Template not found: ${templateId}, using default template`);
        }
      } catch (error) {
        console.error(`Error loading template ${templateId}:`, error);
        // Continue without template - will use default styling
      }
    }

    // Return success response with template metadata for client-side PDF generation
    res.json({
      success: true,
      message: 'Resume data validated successfully. PDF generation handled client-side.',
      resumeData,
      templateMetadata
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}