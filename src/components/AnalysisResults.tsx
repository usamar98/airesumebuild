import { AnalysisResult } from '@/types';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  LightBulbIcon,
  ChartBarIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface AnalysisResultsProps {
  results: AnalysisResult;
  fileName: string;
}

export default function AnalysisResults({ results, fileName }: AnalysisResultsProps) {
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

  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const renderScoreCard = (title: string, score: number, icon: React.ReactNode) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {icon}
          <h3 className="text-lg font-medium text-gray-900 ml-2">{title}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
          {getScoreDescription(score)}
        </div>
      </div>
      
      <div className="flex items-center mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}/100
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Resume Analysis Results</h2>
            <p className="text-gray-600 mt-1">Analysis for: <span className="font-medium">{fileName}</span></p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{results.overallScore}/100</div>
            <div className="text-sm text-gray-500">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderScoreCard(
          'Content Quality',
          results.contentScore,
          <DocumentTextIcon className="h-6 w-6 text-blue-600" />
        )}
        {renderScoreCard(
          'Formatting',
          results.formattingScore,
          <ChartBarIcon className="h-6 w-6 text-green-600" />
        )}
        {renderScoreCard(
          'Keywords',
          results.keywordScore,
          <StarIcon className="h-6 w-6 text-purple-600" />
        )}
        {renderScoreCard(
          'ATS Compatibility',
          results.atsScore,
          <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
        )}
      </div>

      {/* Strengths */}
      {results.strengths.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-900">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {results.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-green-800">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {results.weaknesses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-900">Areas for Improvement</h3>
          </div>
          <ul className="space-y-2">
            {results.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-red-800">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {results.suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <LightBulbIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-blue-900">Recommendations</h3>
          </div>
          <ul className="space-y-3">
            {results.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <LightBulbIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Keywords */}
      {results.missingKeywords && results.missingKeywords.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <StarIcon className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-900">Suggested Keywords to Add</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {results.missingKeywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full border border-yellow-300"
              >
                {keyword}
              </span>
            ))}
          </div>
          <p className="text-sm text-yellow-700 mt-3">
            Consider incorporating these relevant keywords to improve your resume's visibility to ATS systems.
          </p>
        </div>
      )}

      {/* Detailed Analysis */}
      {results.detailedAnalysis && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
          <div className="prose max-w-none text-gray-700">
            <p className="whitespace-pre-line">{results.detailedAnalysis}</p>
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Quick Wins</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Fix any formatting inconsistencies</li>
              <li>• Add missing contact information</li>
              <li>• Include relevant keywords from job descriptions</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Long-term Improvements</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Quantify achievements with specific metrics</li>
              <li>• Tailor content for specific job applications</li>
              <li>• Consider professional resume review</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Score Interpretation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Interpretation</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span><strong>80-100:</strong> Excellent</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span><strong>60-79:</strong> Good</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
            <span><strong>40-59:</strong> Fair</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span><strong>0-39:</strong> Needs Work</span>
          </div>
        </div>
      </div>
    </div>
  );
}