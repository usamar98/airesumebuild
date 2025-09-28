import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export default function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const templatesDir = path.join(process.cwd(), 'templates', 'generated');
    
    // Check if templates directory exists
    if (!fs.existsSync(templatesDir)) {
      return res.status(404).json({ error: 'Templates directory not found' });
    }

    // Read all template files
    const templateFiles = fs.readdirSync(templatesDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        // Sort by template number
        const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
        return aNum - bNum;
      });

    const templates = [];
    
    for (const file of templateFiles) {
      try {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const template = JSON.parse(content);
        templates.push(template);
      } catch (error) {
        console.warn(`Failed to parse template file ${file}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error loading templates:', error);
    res.status(500).json({ error: 'Failed to load templates' });
  }
}