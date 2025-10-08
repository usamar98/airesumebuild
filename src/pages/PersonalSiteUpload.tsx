import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

interface ParsedData {
  id: string;
  name: string;
  email: string;
  phone: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

const PersonalSiteUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { getAccessToken, isAuthenticated } = useSupabaseAuth();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return false;
    }
    
    return true;
  };

  const handleUploadAndParse = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    // Check authentication
    if (!isAuthenticated) {
      toast.error('Please log in to upload your resume');
      navigate('/login');
      return;
    }

    // Get authentication token from Supabase
    const token = await getAccessToken();

    if (!token) {
      toast.error('Authentication failed. Please log in again.');
      navigate('/login');
      return;
    }

    setIsUploading(true);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/personal-sites/upload-resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setParsedData(result.parsedData);
        toast.success('Resume parsed successfully!');
      } else {
        throw new Error(result.error || 'Parsing failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload and parse resume: ${error.message}`);
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  const handleProceedToGeneration = () => {
    if (parsedData) {
      // Store parsed data in sessionStorage for the next step
      sessionStorage.setItem('parsedResumeData', JSON.stringify(parsedData));
      navigate('/personal-site-generator/generate');
    }
  };

  const handleStartOver = () => {
    setFile(null);
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Personal Site Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your resume and let AI create a stunning personal website for you in minutes
          </p>
        </div>

        {!parsedData ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Step 1: Upload Your Resume
              </h2>
              <p className="text-gray-600">
                Upload your resume in PDF or Word format to get started
              </p>
            </div>

            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              
              <div className="space-y-4">
                {file ? (
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drop your resume here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports PDF, DOC, and DOCX files up to 10MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              {file && (
                <button
                  onClick={handleStartOver}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isUploading}
                >
                  Choose Different File
                </button>
              )}
              
              <button
                onClick={handleUploadAndParse}
                disabled={!file || isUploading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{isParsing ? 'Parsing Resume...' : 'Uploading...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>Upload &amp; Parse Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Parsed Data Preview */
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Resume Parsed Successfully!
              </h2>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Extracted Information Preview
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Personal Info</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Name:</strong> {parsedData.name}</p>
                    <p><strong>Email:</strong> {parsedData.email}</p>
                    <p><strong>Phone:</strong> {parsedData.phone}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {parsedData.skills.slice(0, 6).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {parsedData.skills.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{parsedData.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Experience</h4>
                  <p className="text-sm text-gray-600">
                    {parsedData.experience.length} position(s) found
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                  <p className="text-sm text-gray-600">
                    {parsedData.education.length} qualification(s) found
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleStartOver}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Upload Different Resume
              </button>
              
              <button
                onClick={handleProceedToGeneration}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Proceed to Site Generation</span>
                <CheckCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Process Steps */}
        <div className="mt-12">
          <div className="flex justify-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  parsedData ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium text-gray-900">Upload Resume</span>
              </div>
              
              <div className="w-16 h-0.5 bg-gray-300"></div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  parsedData ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  2
                </div>
                <span className={`text-sm font-medium ${
                  parsedData ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  Generate Site
                </span>
              </div>
              
              <div className="w-16 h-0.5 bg-gray-300"></div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 text-gray-500">
                  3
                </div>
                <span className="text-sm font-medium text-gray-500">Customize &amp; Publish</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalSiteUpload;