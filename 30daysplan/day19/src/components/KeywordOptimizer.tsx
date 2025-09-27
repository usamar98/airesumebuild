import React, { useState, useEffect, useMemo } from 'react';
import { ResumeData } from '../types';
import { 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface KeywordOptimizerProps {
  resumeData: ResumeData;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
}

interface KeywordAnalysis {
  keyword: string;
  resumeCount: number;
  jobCount: number;
  density: number;
  importance: 'high' | 'medium' | 'low';
  suggestions: string[];
}

interface KeywordResults {
  matchedKeywords: KeywordAnalysis[];
  missingKeywords: KeywordAnalysis[];
  overusedKeywords: KeywordAnalysis[];
  matchPercentage: number;
  totalKeywords: number;
  suggestions: string[];
}

const KeywordOptimizer: React.FC<KeywordOptimizerProps> = ({
  resumeData,
  jobDescription,
  onJobDescriptionChange
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matched' | 'missing' | 'suggestions'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Extract text from resume data
  const extractResumeText = (data: ResumeData): string => {
    const sections = [];
    
    // Personal info
    if (data.personalInfo?.professionalSummary) sections.push(data.personalInfo.professionalSummary);
    
    // Experience
    data.workExperience?.forEach(exp => {
      if (exp.jobTitle) sections.push(exp.jobTitle);
      if (exp.company) sections.push(exp.company);
      if (exp.achievements) sections.push(exp.achievements.join(' '));
    });
    
    // Education
    data.education?.forEach(edu => {
      if (edu.degree) sections.push(edu.degree);
      if (edu.institution) sections.push(edu.institution);
      if (edu.relevantCoursework) sections.push(edu.relevantCoursework.join(' '));
    });
    
    // Skills
    if (data.skills) {
      sections.push(data.skills.join(' '));
    }
    
    // Projects
    data.projects?.forEach(project => {
      if (project.name) sections.push(project.name);
      if (project.description) sections.push(project.description);
      if (project.technologies) sections.push(project.technologies.join(' '));
    });
    
    // Certifications
    data.certifications?.forEach(cert => {
      if (cert.name) sections.push(cert.name);
      if (cert.issuingOrganization) sections.push(cert.issuingOrganization);
    });
    
    // Languages
    data.languages?.forEach(lang => {
      if (lang.name) sections.push(lang.name);
    });
    
    return sections.join(' ').toLowerCase();
  };

  // Extract keywords from job description
  const extractJobKeywords = (jobDesc: string): string[] => {
    if (!jobDesc.trim()) return [];
    
    const text = jobDesc.toLowerCase();
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'who', 'what', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
      'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'just', 'now', 'here', 'there', 'then', 'up', 'out',
      'if', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'among', 'under', 'over', 'from', 'within', 'without', 'across', 'along'
    ]);
    
    // Extract words and phrases
    const words = text.match(/\b[a-z]+\b/g) || [];
    const phrases = text.match(/\b[a-z]+(?:\s+[a-z]+){1,2}\b/g) || [];
    
    // Filter and count
    const wordCounts = new Map<string, number>();
    
    // Add single words
    words.forEach(word => {
      if (word.length > 2 && !commonWords.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
    
    // Add phrases
    phrases.forEach(phrase => {
      if (phrase.length > 5 && !phrase.split(' ').every(w => commonWords.has(w))) {
        wordCounts.set(phrase, (wordCounts.get(phrase) || 0) + 1);
      }
    });
    
    // Return sorted by frequency
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word]) => word);
  };

  // Analyze keywords
  const keywordAnalysis = useMemo((): KeywordResults => {
    if (!jobDescription.trim()) {
      return {
        matchedKeywords: [],
        missingKeywords: [],
        overusedKeywords: [],
        matchPercentage: 0,
        totalKeywords: 0,
        suggestions: ['Please enter a job description to analyze keywords.']
      };
    }
    
    const resumeText = extractResumeText(resumeData);
    const jobKeywords = extractJobKeywords(jobDescription);
    
    if (jobKeywords.length === 0) {
      return {
        matchedKeywords: [],
        missingKeywords: [],
        overusedKeywords: [],
        matchPercentage: 0,
        totalKeywords: 0,
        suggestions: ['Unable to extract meaningful keywords from the job description.']
      };
    }
    
    const matched: KeywordAnalysis[] = [];
    const missing: KeywordAnalysis[] = [];
    const overused: KeywordAnalysis[] = [];
    
    jobKeywords.forEach((keyword, index) => {
      const resumeMatches = (resumeText.match(new RegExp(`\\b${keyword}\\b`, 'gi')) || []).length;
      const jobMatches = (jobDescription.toLowerCase().match(new RegExp(`\\b${keyword}\\b`, 'gi')) || []).length;
      const density = resumeText.length > 0 ? (resumeMatches / resumeText.split(' ').length) * 100 : 0;
      
      // Determine importance based on frequency in job description and position
      let importance: 'high' | 'medium' | 'low' = 'low';
      if (index < 10 || jobMatches >= 3) importance = 'high';
      else if (index < 20 || jobMatches >= 2) importance = 'medium';
      
      const analysis: KeywordAnalysis = {
        keyword,
        resumeCount: resumeMatches,
        jobCount: jobMatches,
        density,
        importance,
        suggestions: []
      };
      
      if (resumeMatches > 0) {
        if (density > 2) {
          analysis.suggestions.push('Consider reducing usage to avoid keyword stuffing');
          overused.push(analysis);
        } else {
          analysis.suggestions.push('Good keyword usage');
        }
        matched.push(analysis);
      } else {
        analysis.suggestions.push(
          importance === 'high' 
            ? 'High priority - consider adding to summary or skills section'
            : importance === 'medium'
            ? 'Medium priority - consider adding to experience descriptions'
            : 'Low priority - add if relevant to your experience'
        );
        missing.push(analysis);
      }
    });
    
    const matchPercentage = jobKeywords.length > 0 ? (matched.length / jobKeywords.length) * 100 : 0;
    
    const suggestions = [
      `You're matching ${matched.length} out of ${jobKeywords.length} key terms (${matchPercentage.toFixed(1)}%).`,
      matchPercentage < 30 ? 'Consider adding more relevant keywords to improve ATS compatibility.' :
      matchPercentage < 60 ? 'Good keyword coverage. Focus on adding high-priority missing terms.' :
      'Excellent keyword coverage! Fine-tune for optimal results.',
      missing.filter(k => k.importance === 'high').length > 0 ? 
        `Focus on adding these high-priority terms: ${missing.filter(k => k.importance === 'high').slice(0, 3).map(k => k.keyword).join(', ')}` : '',
      overused.length > 0 ? `Reduce usage of overused terms: ${overused.slice(0, 3).map(k => k.keyword).join(', ')}` : ''
    ].filter(Boolean);
    
    return {
      matchedKeywords: matched.sort((a, b) => b.importance === 'high' ? 1 : -1),
      missingKeywords: missing.sort((a, b) => {
        if (a.importance !== b.importance) {
          const order = { high: 3, medium: 2, low: 1 };
          return order[b.importance] - order[a.importance];
        }
        return b.jobCount - a.jobCount;
      }),
      overusedKeywords: overused,
      matchPercentage,
      totalKeywords: jobKeywords.length,
      suggestions
    };
  }, [resumeData, jobDescription]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onJobDescriptionChange(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Match Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Keyword Match Score</h3>
          <ChartBarIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Match Percentage</span>
              <span>{keywordAnalysis.matchPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  keywordAnalysis.matchPercentage >= 70 ? 'bg-green-500' :
                  keywordAnalysis.matchPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(keywordAnalysis.matchPercentage, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {keywordAnalysis.matchedKeywords.length}
            </div>
            <div className="text-sm text-gray-600">of {keywordAnalysis.totalKeywords}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-900">
                {keywordAnalysis.matchedKeywords.length}
              </div>
              <div className="text-sm text-green-700">Matched Keywords</div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {keywordAnalysis.missingKeywords.filter(k => k.importance === 'high').length}
              </div>
              <div className="text-sm text-yellow-700">High Priority Missing</div>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-900">
                {keywordAnalysis.overusedKeywords.length}
              </div>
              <div className="text-sm text-red-700">Overused Keywords</div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Optimization Suggestions
        </h3>
        <ul className="space-y-2">
          {keywordAnalysis.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderKeywordList = (keywords: KeywordAnalysis[], title: string, emptyMessage: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {keywords.length === 0 ? (
        <p className="text-gray-500 italic">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {keywords.map((keyword, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{keyword.keyword}</span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    keyword.importance === 'high' ? 'bg-red-100 text-red-800' :
                    keyword.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {keyword.importance} priority
                  </span>
                  {keyword.resumeCount > 0 && (
                    <span className="text-sm text-gray-600">
                      Used {keyword.resumeCount}x
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {keyword.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Keyword Optimization</h2>
        </div>
        
        {/* Job Description Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Job Description
          </label>
          <div className="relative">
            <textarea
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                onJobDescriptionChange(pastedText);
              }}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'v') {
                  e.preventDefault();
                  handlePasteFromClipboard();
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                onJobDescriptionChange(target.value);
              }}
              placeholder="Paste the job description here to analyze keyword matches..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <button
              onClick={handlePasteFromClipboard}
              className="absolute top-2 right-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Paste from Clipboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'matched', name: 'Matched', icon: CheckCircleIcon },
            { id: 'missing', name: 'Missing', icon: ExclamationTriangleIcon },
            { id: 'suggestions', name: 'Suggestions', icon: LightBulbIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.id === 'matched' && keywordAnalysis.matchedKeywords.length > 0 && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {keywordAnalysis.matchedKeywords.length}
                  </span>
                )}
                {tab.id === 'missing' && keywordAnalysis.missingKeywords.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {keywordAnalysis.missingKeywords.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'matched' && renderKeywordList(
          keywordAnalysis.matchedKeywords,
          'Matched Keywords',
          'No keywords matched yet. Add a job description to see matches.'
        )}
        {activeTab === 'missing' && renderKeywordList(
          keywordAnalysis.missingKeywords,
          'Missing Keywords',
          'Great! All important keywords are present in your resume.'
        )}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Optimization Recommendations</h3>
            
            {keywordAnalysis.missingKeywords.filter(k => k.importance === 'high').length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900 mb-2">High Priority Actions</h4>
                <ul className="space-y-1">
                  {keywordAnalysis.missingKeywords
                    .filter(k => k.importance === 'high')
                    .slice(0, 5)
                    .map((keyword, index) => (
                      <li key={index} className="text-red-800 text-sm">
                        • Add "{keyword.keyword}" to your summary or skills section
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}
            
            {keywordAnalysis.overusedKeywords.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">Reduce Keyword Density</h4>
                <ul className="space-y-1">
                  {keywordAnalysis.overusedKeywords.slice(0, 5).map((keyword, index) => (
                    <li key={index} className="text-yellow-800 text-sm">
                      • Reduce usage of "{keyword.keyword}" (currently used {keyword.resumeCount} times)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">General Tips</h4>
              <ul className="space-y-1 text-blue-800 text-sm">
                <li>• Use keywords naturally in context, avoid keyword stuffing</li>
                <li>• Include variations and synonyms of important terms</li>
                <li>• Focus on skills and technologies mentioned in the job posting</li>
                <li>• Update your summary to include 3-5 key terms from the job description</li>
                <li>• Use industry-specific terminology and acronyms when appropriate</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordOptimizer;