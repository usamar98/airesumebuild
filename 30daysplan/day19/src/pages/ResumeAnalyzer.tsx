import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, DocumentArrowUpIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AnalysisResult } from '@/types';
import FileUpload from '@/components/FileUpload';
import AnalysisResults from '@/components/AnalysisResults';

export default function ResumeAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      if (data.success) {
        setAnalysisResult({
          overallScore: data.overallScore || 0,
          contentScore: data.contentScore || data.overallScore || 0,
          formattingScore: data.formattingScore || data.overallScore || 0,
          keywordScore: data.keywordScore || data.overallScore || 0,
          atsScore: data.atsScore || data.overallScore || 0,
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          missingKeywords: data.missingKeywords || [],
          suggestions: data.suggestions || [],
          detailedAnalysis: data.detailedAnalysis
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Resume analysis error:', err);
      
      let errorMessage = 'An error occurred during analysis';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('timed out')) {
          errorMessage = 'Analysis timed out. Please try again with a smaller file or check your internet connection.';
        } else if (err.message.includes('Failed to analyze resume')) {
          errorMessage = 'Unable to analyze this resume. The file may be corrupted or in an unsupported format. Please try uploading a different file.';
        } else if (err.message.includes('File too large')) {
          errorMessage = 'File is too large. Please upload a file smaller than 10MB.';
        } else if (err.message.includes('Unsupported file type')) {
          errorMessage = 'Unsupported file format. Please upload a PDF, DOC, or DOCX file.';
        } else if (err.message.includes('No text extracted')) {
          errorMessage = 'Unable to extract text from this file. Please ensure the file contains readable text and try again.';
        } else if (err.message.includes('API key')) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
    setUploadedFileName('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Resume Analyzer</h1>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!analysisResult && !error ? (
          /* Upload Section */
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Analyze Your Resume
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Update your resume and get detailed feedback on how to improve it. Our AI will analyze your content, 
                check ATS compatibility, and provide actionable suggestions.
              </p>
            </div>

            <FileUpload
              onFileSelect={handleFileUpload}
              disabled={isAnalyzing}
              acceptedTypes={[".pdf", ".doc", ".docx"]}
              maxSize={10} // 10MB
            />

            {isAnalyzing && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-700 font-medium">
                    Analyzing {uploadedFileName}...
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  This may take a few moments while our AI reviews your resume
                </p>
              </div>
            )}

            {/* Features List */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">ATS Compatibility</h3>
                  <p className="text-sm text-gray-500">
                    Check if your resume passes Applicant Tracking Systems
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                    <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Content Analysis</h3>
                  <p className="text-sm text-gray-500">
                    Get insights on your resume content and structure
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Improvement Suggestions</h3>
                  <p className="text-sm text-gray-500">
                    Receive actionable recommendations to enhance your resume
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Keyword Optimization</h3>
                  <p className="text-sm text-gray-500">
                    Identify missing keywords for your target industry
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          /* Error Section */
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-lg mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Analysis Failed
              </h2>
              <p className="text-red-600 mb-4">{error}</p>
              
              {/* Troubleshooting Tips */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Troubleshooting Tips:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ensure your file is a PDF, DOC, or DOCX format</li>
                  <li>• Check that the file size is under 10MB</li>
                  <li>• Make sure the document contains readable text</li>
                  <li>• Try updating with a different version of your resume</li>
                  <li>• Check your internet connection</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div>
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Analysis Results
                  </h2>
                  <p className="text-gray-600">File: {uploadedFileName}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Analyze Another Resume
                </button>
              </div>
            </div>

            <AnalysisResults results={analysisResult!} fileName={uploadedFileName} />
          </div>
        )}
      </div>
    </div>
  );
}