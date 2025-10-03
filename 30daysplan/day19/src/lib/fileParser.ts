// File parsing utilities for resume analysis

// Validate file type and size
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = parseInt((typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MAX_FILE_SIZE) || '10485760'); // 10MB default
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only PDF and DOCX files are supported'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  return { isValid: true };
};

// Convert file to base64 for API transmission
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Extract text from uploaded file
export const extractTextFromFile = async (file: File): Promise<string> => {
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await extractTextFromDOCX(file);
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error('Failed to extract text from file');
  }
};

// Extract text from PDF file (client-side)
const extractTextFromPDF = async (file: File): Promise<string> => {
  // For client-side PDF parsing, we'll send the file to the backend
  // This is a placeholder that sends the file to the server for processing
  const formData = new FormData();
  formData.append('resume', file);
  
  try {
    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to parse PDF');
    }
    
    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

// Extract text from DOCX file (client-side)
const extractTextFromDOCX = async (file: File): Promise<string> => {
  // For client-side DOCX parsing, we'll send the file to the backend
  // This is a placeholder that sends the file to the server for processing
  const formData = new FormData();
  formData.append('resume', file);
  
  try {
    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to parse DOCX');
    }
    
    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Check if file is PDF
export const isPDF = (file: File): boolean => {
  return file.type === 'application/pdf';
};

// Check if file is DOCX
export const isDOCX = (file: File): boolean => {
  return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
};