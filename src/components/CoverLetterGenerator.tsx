import { useState } from 'react';
import { SparklesIcon, DocumentTextIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { ResumeData } from '@/types';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface CoverLetterGeneratorProps {
  resumeData: ResumeData;
}

export default function CoverLetterGenerator({ resumeData }: CoverLetterGeneratorProps) {
  const { getAccessToken } = useSupabaseAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [manualCoverLetter, setManualCoverLetter] = useState('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

  const startProgressTimer = () => {
    setElapsedTime(0);
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    setProgressInterval(interval);
    return interval;
  };

  const stopProgressTimer = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
    setElapsedTime(0);
  };

  const generateAICoverLetter = async () => {
    if (!jobDescription.trim() || !companyName.trim() || !positionTitle.trim()) {
      alert('Please fill in job description, company name, and position title');
      return;
    }

    setIsGenerating(true);
    const interval = startProgressTimer();
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        setIsGenerating(false);
        return;
      }

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeData,
          jobDescription,
          companyName,
          positionTitle,
          type: 'full'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (result.success) {
        setGeneratedCoverLetter(result.coverLetter);
      } else {
        let errorMessage = result.error || 'Unknown error';
        if (response.status === 408) {
          errorMessage = 'The AI service is taking longer than expected. Please try again in a moment.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status === 503) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        }
        alert('Failed to generate cover letter: ' + errorMessage);
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The AI service is taking longer than expected. Please try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      alert('Error generating cover letter: ' + errorMessage);
    } finally {
      setIsGenerating(false);
      stopProgressTimer();
    }
  };

  const enhanceManualCoverLetter = async () => {
    if (!manualCoverLetter.trim()) {
      alert('Please write some content first');
      return;
    }

    if (!jobDescription.trim() || !companyName.trim() || !positionTitle.trim()) {
      alert('Please fill in job description, company name, and position title for better enhancement');
      return;
    }

    setIsEnhancing(true);
    const interval = startProgressTimer();
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        setIsEnhancing(false);
        return;
      }

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeData,
          jobDescription,
          companyName,
          positionTitle,
          existingContent: manualCoverLetter,
          type: 'enhance'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (result.success) {
        setManualCoverLetter(result.coverLetter);
      } else {
        let errorMessage = result.error || 'Unknown error';
        if (response.status === 408) {
          errorMessage = 'The AI service is taking longer than expected. Please try again in a moment.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status === 503) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        }
        alert('Failed to enhance cover letter: ' + errorMessage);
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The AI service is taking longer than expected. Please try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      alert('Error enhancing cover letter: ' + errorMessage);
    } finally {
      setIsEnhancing(false);
      stopProgressTimer();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Cover letter copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cover Letter Generator</h1>
          <p className="text-gray-600">Create personalized cover letters using your resume data and job requirements</p>
        </div>

        <div className="p-6">
          {/* Job Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Google, Microsoft, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Title *
                </label>
                <input
                  type="text"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Software Engineer, Product Manager, etc."
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste the job description here..."
                rows={6}
                required
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'manual'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <DocumentTextIcon className="h-5 w-5 inline mr-2" />
                  Manual + AI Enhancement
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'ai'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <SparklesIcon className="h-5 w-5 inline mr-2" />
                  Fully AI Generated
                </button>
              </nav>
            </div>
          </div>

          {/* Manual + AI Enhancement Tab */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Cover Letter Draft
                  </label>
                  <button
                    onClick={enhanceManualCoverLetter}
                    disabled={isEnhancing || !manualCoverLetter.trim()}
                    className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEnhancing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enhancing... ({elapsedTime}s)
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Enhance with AI
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={manualCoverLetter}
                  onChange={(e) => setManualCoverLetter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your cover letter draft here. The AI will help enhance it based on your resume and the job description..."
                  rows={12}
                />
                {isEnhancing && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-amber-800 font-medium">
                        Enhancing your cover letter with AI...
                      </p>
                      <span className="text-sm text-amber-600 font-mono">
                        {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-1.5">
                      <div 
                        className="bg-amber-600 h-1.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min((elapsedTime / 90) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {manualCoverLetter && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => copyToClipboard(manualCoverLetter)}
                      className="inline-flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fully AI Generated Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="text-center">
                <button
                  onClick={generateAICoverLetter}
                  disabled={isGenerating}
                  className="inline-flex items-center px-6 py-3 text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Cover Letter...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-3" />
                      Generate AI Cover Letter
                    </>
                  )}
                </button>
                {isGenerating && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-blue-800 font-medium">
                          Generating your personalized cover letter...
                        </p>
                        <span className="text-sm text-blue-600 font-mono">
                          {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min((elapsedTime / 90) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-blue-700">
                        AI is analyzing your resume and crafting a tailored cover letter. This typically takes 30-60 seconds.
                      </p>
                      {elapsedTime > 60 && (
                        <p className="text-xs text-amber-700 mt-1">
                          Taking longer than usual... Please wait, the AI is working on a detailed response.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {generatedCoverLetter && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Generated Cover Letter
                    </label>
                    <button
                      onClick={() => copyToClipboard(generatedCoverLetter)}
                      className="inline-flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
                      {generatedCoverLetter}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Cover Letter Tips</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Customize each cover letter for the specific job and company</li>
                  <li>• Highlight relevant experience and skills from your resume</li>
                  <li>• Show enthusiasm for the role and company</li>
                  <li>• Keep it concise - aim for 3-4 paragraphs</li>
                  <li>• Use the AI enhancement to improve clarity and impact</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}