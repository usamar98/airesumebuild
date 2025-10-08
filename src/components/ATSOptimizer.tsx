import React, { useState, useEffect } from 'react';
import { ResumeData } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ATSScore {
  overall: number;
  keywordMatch: number;
  formatting: number;
  content: number;
  readability: number;
}

interface ATSAnalysis {
  score: ATSScore;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
}

interface ATSOptimizerProps {
  resumeData: ResumeData;
  jobDescription?: string;
  onJobDescriptionChange?: (description: string) => void;
}

export default function ATSOptimizer({ resumeData, jobDescription = '', onJobDescriptionChange }: ATSOptimizerProps) {
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'suggestions'>('overview');

  // Extract text content from resume data
  const extractResumeText = (data: ResumeData): string => {
    const textParts: string[] = [];
    
    // Personal info
    textParts.push(data.personalInfo.fullName);
    textParts.push(data.personalInfo.professionalSummary);
    
    // Work experience
    data.workExperience.forEach(exp => {
      textParts.push(exp.jobTitle);
      textParts.push(exp.company);
      textParts.push(...exp.achievements);
      if (exp.technologies) textParts.push(...exp.technologies);
    });
    
    // Skills
    textParts.push(...data.skills);
    
    // Education
    data.education.forEach(edu => {
      textParts.push(edu.degree);
      textParts.push(edu.institution);
      if (edu.relevantCoursework) textParts.push(...edu.relevantCoursework);
    });
    
    // Projects
    data.projects.forEach(project => {
      textParts.push(project.name);
      textParts.push(project.description);
      textParts.push(...project.technologies);
      textParts.push(...project.highlights);
    });
    
    // Certifications
    data.certifications.forEach(cert => {
      textParts.push(cert.name);
      textParts.push(cert.issuingOrganization);
    });
    
    return textParts.join(' ').toLowerCase();
  };

  // Extract keywords from job description
  const extractJobKeywords = (description: string): string[] => {
    if (!description) return [];
    
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'this', 'that', 'these', 'those', 'we', 'you', 'they', 'it', 'he', 'she',
      'our', 'your', 'their', 'its', 'his', 'her', 'who', 'what', 'when', 'where',
      'why', 'how', 'all', 'any', 'some', 'many', 'much', 'more', 'most', 'other',
      'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
    ]);
    
    const words = description
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s+#.-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));
    
    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    // Return words sorted by frequency, take top 50
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word]) => word);
  };

  // Analyze ATS compatibility
  const analyzeATS = (resumeText: string, jobKeywords: string[]): ATSAnalysis => {
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];
    
    jobKeywords.forEach(keyword => {
      if (resumeText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });
    
    const keywordMatchScore = jobKeywords.length > 0 
      ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
      : 0;
    
    // Basic formatting score (simplified)
    const formattingScore = 85; // Assume good formatting from our builder
    
    // Content score based on resume completeness
    let contentScore = 0;
    if (resumeData.personalInfo.professionalSummary) contentScore += 20;
    if (resumeData.workExperience.length > 0) contentScore += 30;
    if (resumeData.skills.length > 0) contentScore += 20;
    if (resumeData.education.length > 0) contentScore += 15;
    if (resumeData.projects.length > 0) contentScore += 15;
    
    // Readability score (simplified)
    const readabilityScore = 80;
    
    const overallScore = Math.round(
      (keywordMatchScore * 0.4 + formattingScore * 0.2 + contentScore * 0.25 + readabilityScore * 0.15)
    );
    
    const suggestions: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Generate suggestions
    if (keywordMatchScore < 60) {
      suggestions.push('Include more relevant keywords from the job description');
      weaknesses.push('Low keyword match with job description');
    } else {
      strengths.push('Good keyword alignment with job description');
    }
    
    if (resumeData.personalInfo.professionalSummary.length < 100) {
      suggestions.push('Expand your professional summary with more details');
    }
    
    if (resumeData.workExperience.length === 0) {
      suggestions.push('Add work experience to strengthen your profile');
      weaknesses.push('Missing work experience section');
    } else {
      strengths.push('Includes relevant work experience');
    }
    
    if (resumeData.skills.length < 5) {
      suggestions.push('Add more relevant skills to your profile');
    } else {
      strengths.push('Comprehensive skills section');
    }
    
    if (missingKeywords.length > 0) {
      suggestions.push(`Consider adding these keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
    }
    
    return {
      score: {
        overall: overallScore,
        keywordMatch: keywordMatchScore,
        formatting: formattingScore,
        content: contentScore,
        readability: readabilityScore
      },
      matchedKeywords,
      missingKeywords,
      suggestions,
      strengths,
      weaknesses
    };
  };

  // Perform analysis when job description changes
  useEffect(() => {
    if (jobDescription.trim()) {
      setIsAnalyzing(true);
      
      // Simulate analysis delay
      setTimeout(() => {
        const resumeText = extractResumeText(resumeData);
        const jobKeywords = extractJobKeywords(jobDescription);
        const result = analyzeATS(resumeText, jobKeywords);
        setAnalysis(result);
        setIsAnalyzing(false);
      }, 1000);
    } else {
      setAnalysis(null);
    }
  }, [jobDescription, resumeData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <SparklesIcon className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">ATS Optimization Scanner</h2>
      </div>

      {/* Job Description Input */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="job-description" className="block text-sm font-medium text-gray-700">
            Job Description
          </label>
          <button
            type="button"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                console.log('Clipboard text:', text);
                onJobDescriptionChange?.(text);
              } catch (err) {
                console.error('Failed to read clipboard:', err);
                alert('Please use Ctrl+V or right-click paste in the textarea below');
              }
            }}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
          >
            Paste from Clipboard
          </button>
        </div>
        <textarea
          id="job-description"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Paste the job description here to analyze your resume's ATS compatibility... (Try Ctrl+V or right-click paste, or use the button above)"
          value={jobDescription}
          onChange={(e) => {
            console.log('Text changed:', e.target.value.length, 'characters');
            onJobDescriptionChange?.(e.target.value);
          }}
        />
      </div>

      {/* Analysis Results */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Analyzing ATS compatibility...</span>
        </div>
      )}

      {analysis && (
        <div>
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: InformationCircleIcon },
                { id: 'keywords', name: 'Keywords', icon: CheckCircleIcon },
                { id: 'suggestions', name: 'Suggestions', icon: ExclamationTriangleIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(analysis.score.overall)} mb-4`}>
                  <span className={`text-3xl font-bold ${getScoreColor(analysis.score.overall)}`}>
                    {analysis.score.overall}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">ATS Compatibility Score</h3>
                <p className="text-gray-600">
                  {analysis.score.overall >= 80 ? 'Excellent' : analysis.score.overall >= 60 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Keyword Match', score: analysis.score.keywordMatch },
                  { label: 'Formatting', score: analysis.score.formatting },
                  { label: 'Content Quality', score: analysis.score.content },
                  { label: 'Readability', score: analysis.score.readability }
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className={`text-sm font-semibold ${getScoreColor(item.score)}`}>
                        {item.score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-3">
                    Matched Keywords ({analysis.matchedKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.matchedKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-3">
                    Missing Keywords ({analysis.missingKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.slice(0, 20).map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  {analysis.missingKeywords.length > 20 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{analysis.missingKeywords.length - 20} more keywords
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Optimization Recommendations
              </h4>
              <ul className="space-y-3">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!jobDescription.trim() && !isAnalyzing && (
        <div className="text-center py-8">
          <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Optimize Your Resume?</h3>
          <p className="text-gray-600">
            Paste a job description above to get personalized ATS optimization recommendations.
          </p>
        </div>
      )}
    </div>
  );
}