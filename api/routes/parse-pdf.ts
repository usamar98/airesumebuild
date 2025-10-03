import { Request, Response } from 'express';
import mammoth from 'mammoth';
import { parseResumeText } from '../services/resumeParser.js';

// Extract text from PDF buffer with multiple fallback methods
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const errors: string[] = [];
  
  // Method 1: Try pdf-parse library
  try {
    console.log('Attempting PDF extraction with pdf-parse...');
    const pdf = await import('pdf-parse');
    const data = await pdf.default(buffer, {
      // Add options for better parsing
      max: 0, // Parse all pages
      version: 'v1.10.100' // Use specific version
    });
    
    if (data.text && data.text.trim().length > 0) {
      console.log(`Successfully extracted ${data.text.length} characters with pdf-parse`);
      return data.text;
    } else {
      errors.push('pdf-parse: No text content found');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('pdf-parse extraction failed:', errorMsg);
    errors.push(`pdf-parse: ${errorMsg}`);
  }
  
  // Method 2: Try pdfjs-dist library as fallback
  try {
    console.log('Attempting PDF extraction with pdfjs-dist...');
    const pdfjsLib = await import('pdfjs-dist');
    
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ 
      data: uint8Array,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0 // Reduce console output
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    if (fullText.trim().length > 0) {
      console.log(`Successfully extracted ${fullText.length} characters with pdfjs-dist`);
      return fullText.trim();
    } else {
      errors.push('pdfjs-dist: No text content found');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('pdfjs-dist extraction failed:', errorMsg);
    errors.push(`pdfjs-dist: ${errorMsg}`);
  }
  
  // Method 3: Try basic buffer text extraction as last resort
  try {
    console.log('Attempting basic buffer text extraction...');
    const rawText = buffer.toString('utf8');
    // Look for readable text patterns
    const textMatches = rawText.match(/[a-zA-Z0-9\s.,!?;:()\[\]{}"'-]{10,}/g);
    
    if (textMatches && textMatches.length > 0) {
      const extractedText = textMatches.join(' ').replace(/\s+/g, ' ').trim();
      if (extractedText.length > 50) {
        console.log(`Extracted ${extractedText.length} characters using basic buffer method`);
        return extractedText;
      }
    }
    errors.push('Basic extraction: Insufficient readable text found');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Basic extraction failed:', errorMsg);
    errors.push(`Basic extraction: ${errorMsg}`);
  }
  
  // If all methods fail, throw detailed error
  const detailedError = `Failed to extract text from PDF using all available methods:\n${errors.join('\n')}`;
  console.error(detailedError);
  throw new Error(detailedError);
}

// Extract text from DOCX buffer
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error('Failed to extract text from DOCX');
  }
}

// Extract text from DOC buffer (basic text extraction)
async function extractTextFromDOC(buffer: Buffer): Promise<string> {
  try {
    // For DOC files, we'll use a simple text extraction
    // This is a basic implementation - for production, consider using a more robust library
    const text = buffer.toString('utf8');
    // Clean up the text by removing non-printable characters
    return text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
  } catch (error) {
    throw new Error('Failed to extract text from DOC');
  }
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported for this endpoint'
    });
  }

  try {
    console.log('📥 Parse PDF Request - File info:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');
    
    // File upload is already handled by multer middleware in app.ts
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a resume file to upload. Supported formats: PDF, DOC, DOCX.'
      });
    }

    const { buffer, mimetype, originalname, size } = req.file;
    
    // Additional file validation
    if (size === 0) {
      return res.status(400).json({ 
        error: 'Empty file',
        message: 'The uploaded file appears to be empty. Please upload a valid resume file.'
      });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        message: 'Only PDF, DOC, and DOCX files are allowed.'
      });
    }

    let extractedText: string;

    try {
      console.log(`Processing file: ${originalname} (${mimetype}, ${size} bytes)`);
        
      // Extract text based on file type
      switch (mimetype) {
        case 'application/pdf':
          extractedText = await extractTextFromPDF(buffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await extractTextFromDOCX(buffer);
          break;
        case 'application/msword':
          extractedText = await extractTextFromDOC(buffer);
          break;
        default:
          return res.status(400).json({ 
            error: 'Unsupported file type',
            message: `File type "${mimetype}" is not supported. Please upload a PDF, DOC, or DOCX file.`,
            supportedTypes: ['PDF', 'DOC', 'DOCX']
          });
      }

      // Validate extracted text
      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ 
          error: 'No text extracted',
          message: 'No readable text could be extracted from the file. Please ensure the file contains text and is not corrupted or password-protected.'
        });
      }

      if (extractedText.trim().length < 50) {
        return res.status(400).json({ 
          error: 'Insufficient content',
          message: 'The extracted text is too short to be a valid resume. Please upload a complete resume file.'
        });
      }

      console.log(`Successfully extracted ${extractedText.length} characters from ${originalname}`);

      // Parse the extracted text into structured data
      const parsedData = parseResumeText(extractedText);

      // Validate parsed data
      if (!parsedData.personalInfo.fullName && !parsedData.personalInfo.email) {
        console.warn('Warning: No personal information found in resume');
      }

      // Return both raw text and parsed data
      res.json({
        success: true,
        text: extractedText,
        parsedData: parsedData,
        fileName: originalname,
        fileSize: size,
        mimeType: mimetype,
        extractedLength: extractedText.length,
        processingTime: new Date().toISOString()
      });
    } catch (extractionError) {
      console.error('Text extraction error for file:', originalname, extractionError);
      
      const errorMessage = extractionError instanceof Error ? extractionError.message : 'Unknown extraction error';
      
      // Provide more specific error messages based on the error type
      let userMessage = '';
      let suggestions: string[] = [];
      
      if (errorMessage.includes('pdf-parse') && errorMessage.includes('pdfjs-dist')) {
        userMessage = 'Failed to extract text from the PDF file using multiple parsing methods.';
        suggestions = [
          'The PDF may be image-based (scanned document) - try converting to text-based PDF',
          'The PDF may be password-protected - remove password protection',
          'The PDF may be corrupted - try re-saving or re-creating the PDF',
          'Try converting the PDF to a Word document (.docx) format instead'
        ];
      } else if (errorMessage.includes('Password')) {
        userMessage = 'The PDF file appears to be password-protected.';
        suggestions = [
          'Remove password protection from the PDF',
          'Save the PDF without password protection',
          'Convert to Word document (.docx) format'
        ];
      } else if (errorMessage.includes('No text content found')) {
        userMessage = 'The PDF file appears to contain only images or non-selectable text.';
        suggestions = [
          'Ensure the PDF contains selectable text (not scanned images)',
          'Try using OCR software to convert images to text',
          'Re-create the resume using a word processor',
          'Convert to Word document (.docx) format'
        ];
      } else if (errorMessage.includes('corrupted') || errorMessage.includes('Invalid')) {
        userMessage = 'The PDF file appears to be corrupted or invalid.';
        suggestions = [
          'Try re-saving the PDF from the original source',
          'Use "Save As" to create a new copy of the PDF',
          'Convert to Word document (.docx) format',
          'Check if the file downloaded completely'
        ];
      } else {
        userMessage = `Failed to extract text from the ${mimetype.includes('pdf') ? 'PDF' : 'Word'} file.`;
        suggestions = [
          'Try converting to Word document (.docx) format',
          'Ensure the file is not corrupted',
          'Check if the file contains selectable text',
          'Try re-saving the file in a different format'
        ];
      }
      
      res.status(400).json({
        error: 'Text extraction failed',
        message: userMessage,
        suggestions: suggestions,
        technicalDetails: errorMessage,
        fileName: originalname,
        fileSize: size,
        mimeType: mimetype,
        troubleshooting: {
          fileInfo: `File: ${originalname} (${(size / 1024).toFixed(2)} KB)`,
          supportedFormats: ['PDF with selectable text', 'Microsoft Word (.docx)', 'Legacy Word (.doc)'],
          commonIssues: [
            'Scanned PDFs (image-based)',
            'Password-protected files',
            'Corrupted files',
            'Files with complex formatting'
          ]
        }
      });
    }
  } catch (error) {
    console.error('Parse PDF handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}