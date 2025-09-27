import { Request, Response } from 'express';
import OpenAI from 'openai';
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
  accent_color: string;
  section_order: string[];
  bullet_style: string;
  spacing: string;
  header_style: string;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  line_height: number;
  section_spacing: number;
  category: string;
}

const PROFESSIONAL_FONTS = [
  'Inter', 'Roboto', 'Lato', 'Montserrat', 'Open Sans', 'Source Sans Pro',
  'Poppins', 'Nunito Sans', 'Work Sans', 'DM Sans'
];

const MODERN_COLORS = {
  primary: ['#000000', '#1f2937', '#111827', '#0f172a', '#1e293b', '#374151'],
  secondary: ['#555555', '#6b7280', '#9ca3af', '#64748b', '#4b5563', '#525252'],
  accent: ['#2563eb', '#10b981', '#f59e0b', '#6366f1', '#1e40af', '#7c3aed', '#dc2626', '#06b6d4', '#ec4899', '#059669']
};

const BULLET_STYLES = ['dash', 'circle', 'square', 'none'];
const SPACING_OPTIONS = ['compact', 'normal', 'relaxed', 'wide'];
const SECTION_ORDERS = [
  ['Work', 'Skills', 'Education', 'Projects'],
  ['Skills', 'Work', 'Education', 'Projects'],
  ['Projects', 'Skills', 'Work', 'Education'],
  ['Education', 'Work', 'Projects', 'Skills'],
  ['Work', 'Education', 'Skills', 'Projects']
];

export const generateTemplates = async (req: Request, res: Response) => {
  try {
    console.log('Starting template generation...');
    
    // Read all base templates
    const baseTemplatesDir = path.join(process.cwd(), 'templates', 'base');
    const baseTemplateFiles = fs.readdirSync(baseTemplatesDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${baseTemplateFiles.length} base templates`);
    
    let totalGenerated = 0;
    
    for (const templateFile of baseTemplateFiles) {
      const templatePath = path.join(baseTemplatesDir, templateFile);
      const baseTemplate: TemplateMetadata = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      
      console.log(`Generating variations for ${baseTemplate.name}...`);
      
      // Generate 5 variations using OpenAI
      const variations = await generateVariationsWithAI(baseTemplate);
      
      // Save each variation
      for (let i = 0; i < variations.length; i++) {
        const variationId = `${baseTemplate.id}_var_${i + 1}`;
        const variation = {
          ...variations[i],
          id: variationId,
          base_template: baseTemplate.id,
          variation_number: i + 1
        };
        
        const outputPath = path.join(process.cwd(), 'templates', 'generated', `${variationId}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(variation, null, 2));
        totalGenerated++;
        
        console.log(`Generated variation ${i + 1} for ${baseTemplate.name}`);
      }
    }
    
    console.log(`Successfully generated ${totalGenerated} template variations`);
    
    res.json({
      success: true,
      message: `Generated ${totalGenerated} template variations`,
      totalGenerated
    });
    
  } catch (error) {
    console.error('Error generating templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

async function generateVariationsWithAI(baseTemplate: TemplateMetadata): Promise<TemplateMetadata[]> {
  const systemPrompt = `You are a professional resume designer. Generate 5 variations for the given base template JSON.

Rules:
1. Modify font_family, colors, section_order, bullet_style, spacing, and margins
2. Keep the same structure and required fields
3. Use professional fonts: ${PROFESSIONAL_FONTS.join(', ')}
4. Use modern color palettes (hex codes)
5. Ensure good contrast and readability
6. Vary section orders logically
7. Return ONLY a JSON array of 5 template objects
8. Each variation should be professional and distinct

Base template to vary:`;

  const userPrompt = JSON.stringify(baseTemplate, null, 2);

  try {
    // Initialize OpenAI client here to ensure env vars are loaded
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 seconds timeout
      maxRetries: 2,
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 3000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const variations = JSON.parse(response);
    
    if (!Array.isArray(variations) || variations.length !== 5) {
      throw new Error('Invalid response format from OpenAI');
    }

    return variations;
    
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    
    // Fallback: generate variations programmatically
    return generateVariationsFallback(baseTemplate);
  }
}

function generateVariationsFallback(baseTemplate: TemplateMetadata): TemplateMetadata[] {
  const variations: TemplateMetadata[] = [];
  
  for (let i = 0; i < 5; i++) {
    const variation: TemplateMetadata = {
      ...baseTemplate,
      name: `${baseTemplate.name} Variation ${i + 1}`,
      font_family: PROFESSIONAL_FONTS[Math.floor(Math.random() * PROFESSIONAL_FONTS.length)],
      font_size: baseTemplate.font_size + (Math.random() > 0.5 ? 1 : -1),
      primary_color: MODERN_COLORS.primary[Math.floor(Math.random() * MODERN_COLORS.primary.length)],
      secondary_color: MODERN_COLORS.secondary[Math.floor(Math.random() * MODERN_COLORS.secondary.length)],
      accent_color: MODERN_COLORS.accent[Math.floor(Math.random() * MODERN_COLORS.accent.length)],
      section_order: SECTION_ORDERS[Math.floor(Math.random() * SECTION_ORDERS.length)],
      bullet_style: BULLET_STYLES[Math.floor(Math.random() * BULLET_STYLES.length)],
      spacing: SPACING_OPTIONS[Math.floor(Math.random() * SPACING_OPTIONS.length)],
      margins: {
        top: baseTemplate.margins.top + (Math.random() > 0.5 ? 10 : -10),
        bottom: baseTemplate.margins.bottom + (Math.random() > 0.5 ? 10 : -10),
        left: baseTemplate.margins.left + (Math.random() > 0.5 ? 5 : -5),
        right: baseTemplate.margins.right + (Math.random() > 0.5 ? 5 : -5)
      },
      line_height: baseTemplate.line_height + (Math.random() > 0.5 ? 0.1 : -0.1),
      section_spacing: baseTemplate.section_spacing + (Math.random() > 0.5 ? 4 : -4)
    };
    
    variations.push(variation);
  }
  
  return variations;
}