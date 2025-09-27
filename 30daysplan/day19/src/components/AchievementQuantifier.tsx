import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Award, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { ResumeData } from '../types';

interface AchievementQuantifierProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
}

interface Achievement {
  id: string;
  text: string;
  section: string;
  isQuantified: boolean;
  suggestions: QuantificationSuggestion[];
  score: number;
}

interface QuantificationSuggestion {
  type: 'percentage' | 'dollar' | 'time' | 'number' | 'ratio';
  suggestion: string;
  example: string;
  before: string;
  after: string;
}

interface AchievementTemplate {
  category: string;
  templates: {
    pattern: string;
    suggestions: string[];
    examples: { before: string; after: string }[];
  }[];
}

const ACHIEVEMENT_TEMPLATES: AchievementTemplate[] = [
  {
    category: 'Sales & Revenue',
    templates: [
      {
        pattern: 'increased sales|boosted revenue|grew business',
        suggestions: [
          'Add percentage increase (e.g., "by 25%")',
          'Include dollar amounts (e.g., "from $1M to $1.5M")',
          'Specify time period (e.g., "within 6 months")',
        ],
        examples: [
          {
            before: 'Increased sales for the company',
            after: 'Increased sales by 35% ($2.1M to $2.8M) within 8 months through strategic client outreach'
          },
          {
            before: 'Boosted revenue through marketing campaigns',
            after: 'Boosted revenue by $500K (22% increase) through 3 targeted marketing campaigns over Q2-Q3'
          }
        ]
      }
    ]
  },
  {
    category: 'Team Management',
    templates: [
      {
        pattern: 'managed team|led team|supervised',
        suggestions: [
          'Specify team size (e.g., "team of 12 developers")',
          'Add performance metrics (e.g., "improved productivity by 30%")',
          'Include project outcomes (e.g., "delivered 15 projects on time")',
        ],
        examples: [
          {
            before: 'Managed a development team',
            after: 'Managed a cross-functional team of 8 developers, delivering 12 projects with 95% on-time completion rate'
          },
          {
            before: 'Led team to success',
            after: 'Led team of 15 sales representatives, achieving 125% of quarterly targets and reducing turnover by 40%'
          }
        ]
      }
    ]
  },
  {
    category: 'Process Improvement',
    templates: [
      {
        pattern: 'improved process|optimized|streamlined|enhanced efficiency',
        suggestions: [
          'Add time savings (e.g., "reduced processing time by 2 hours")',
          'Include percentage improvements (e.g., "increased efficiency by 45%")',
          'Specify cost savings (e.g., "saved $50K annually")',
        ],
        examples: [
          {
            before: 'Improved the workflow process',
            after: 'Improved workflow process, reducing task completion time by 40% and saving 15 hours per week'
          },
          {
            before: 'Streamlined operations',
            after: 'Streamlined operations across 3 departments, cutting costs by $75K annually and improving efficiency by 25%'
          }
        ]
      }
    ]
  },
  {
    category: 'Technical Achievements',
    templates: [
      {
        pattern: 'developed|built|created|implemented',
        suggestions: [
          'Add user/usage numbers (e.g., "serving 10K+ users")',
          'Include performance metrics (e.g., "reduced load time by 60%")',
          'Specify scale (e.g., "processing 1M+ transactions daily")',
        ],
        examples: [
          {
            before: 'Developed a web application',
            after: 'Developed a React web application serving 25K+ daily users with 99.9% uptime and 2s average load time'
          },
          {
            before: 'Built a database system',
            after: 'Built a scalable database system handling 500K+ daily transactions with 40% faster query performance'
          }
        ]
      }
    ]
  },
  {
    category: 'Customer Service',
    templates: [
      {
        pattern: 'customer satisfaction|client retention|customer support',
        suggestions: [
          'Add satisfaction scores (e.g., "achieved 4.8/5 rating")',
          'Include retention rates (e.g., "improved retention by 25%")',
          'Specify response times (e.g., "reduced response time to under 2 hours")',
        ],
        examples: [
          {
            before: 'Improved customer satisfaction',
            after: 'Improved customer satisfaction from 3.2 to 4.7/5 rating, increasing retention rate by 30%'
          },
          {
            before: 'Provided excellent customer support',
            after: 'Provided customer support to 200+ clients daily, maintaining 95% satisfaction rate and <1 hour response time'
          }
        ]
      }
    ]
  }
];

const QUANTIFICATION_PATTERNS = {
  weak_verbs: ['helped', 'assisted', 'worked on', 'participated in', 'involved in', 'responsible for'],
  vague_terms: ['many', 'several', 'various', 'multiple', 'numerous', 'significant', 'substantial'],
  missing_metrics: [
    'increased', 'decreased', 'improved', 'reduced', 'enhanced', 'optimized',
    'grew', 'expanded', 'developed', 'created', 'built', 'managed', 'led'
  ]
};

export default function AchievementQuantifier({ resumeData, onResumeDataChange }: AchievementQuantifierProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Extract achievements from resume data
  const extractAchievements = (): Achievement[] => {
    const achievements: Achievement[] = [];
    let id = 0;

    // Extract from work experience
    resumeData.workExperience?.forEach((work, workIndex) => {
      work.achievements?.forEach((achievement, achievementIndex) => {
        achievements.push({
          id: `work-${workIndex}-${achievementIndex}`,
          text: achievement,
          section: `Work Experience - ${work.company}`,
          isQuantified: isQuantified(achievement),
          suggestions: generateSuggestions(achievement),
          score: calculateAchievementScore(achievement)
        });
      });
    });

    // Extract from projects
    resumeData.projects?.forEach((project, projectIndex) => {
      if (project.description) {
        achievements.push({
          id: `project-${projectIndex}`,
          text: project.description,
          section: `Project - ${project.name}`,
          isQuantified: isQuantified(project.description),
          suggestions: generateSuggestions(project.description),
          score: calculateAchievementScore(project.description)
        });
      }
    });

    return achievements;
  };

  // Check if text is already quantified
  const isQuantified = (text: string): boolean => {
    const quantifiers = [
      /\d+%/, // percentages
      /\$[\d,]+/, // dollar amounts
      /\d+[KMB]\+?/, // numbers with K, M, B
      /\d+:\d+/, // ratios
      /\d+\s*(hours?|days?|weeks?|months?|years?)/, // time periods
      /\d+\s*(users?|clients?|customers?|people|employees?)/, // people counts
      /\d+\s*(projects?|tasks?|items?|products?)/, // item counts
      /\d+(\.\d+)?\s*\/\s*\d+/, // ratings
      /\d+x/, // multipliers
    ];
    
    return quantifiers.some(pattern => pattern.test(text.toLowerCase()));
  };

  // Calculate achievement score based on impact words and quantification
  const calculateAchievementScore = (text: string): number => {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // Base score for quantification
    if (isQuantified(text)) score += 40;
    
    // Impact words
    const impactWords = ['increased', 'improved', 'reduced', 'optimized', 'enhanced', 'achieved', 'delivered', 'exceeded'];
    impactWords.forEach(word => {
      if (lowerText.includes(word)) score += 10;
    });
    
    // Deduct for weak language
    QUANTIFICATION_PATTERNS.weak_verbs.forEach(verb => {
      if (lowerText.includes(verb)) score -= 15;
    });
    
    QUANTIFICATION_PATTERNS.vague_terms.forEach(term => {
      if (lowerText.includes(term)) score -= 10;
    });
    
    return Math.max(0, Math.min(100, score));
  };

  // Generate quantification suggestions
  const generateSuggestions = (text: string): QuantificationSuggestion[] => {
    const suggestions: QuantificationSuggestion[] = [];
    const lowerText = text.toLowerCase();
    
    // Find matching templates
    ACHIEVEMENT_TEMPLATES.forEach(category => {
      category.templates.forEach(template => {
        const regex = new RegExp(template.pattern, 'i');
        if (regex.test(text)) {
          template.suggestions.forEach((suggestion, index) => {
            const example = template.examples[index] || template.examples[0];
            suggestions.push({
              type: getSuggestionType(suggestion),
              suggestion,
              example: suggestion,
              before: example.before,
              after: example.after
            });
          });
        }
      });
    });
    
    // Generic suggestions if no specific template matches
    if (suggestions.length === 0) {
      if (lowerText.includes('increased') || lowerText.includes('improved')) {
        suggestions.push({
          type: 'percentage',
          suggestion: 'Add specific percentage increase',
          example: 'by X%',
          before: text,
          after: text + ' by 25%'
        });
      }
      
      if (lowerText.includes('managed') || lowerText.includes('led')) {
        suggestions.push({
          type: 'number',
          suggestion: 'Specify team size or number of people',
          example: 'team of X people',
          before: text,
          after: text.replace(/team/i, 'team of 8')
        });
      }
      
      if (lowerText.includes('saved') || lowerText.includes('cost')) {
        suggestions.push({
          type: 'dollar',
          suggestion: 'Add dollar amount saved',
          example: '$X saved',
          before: text,
          after: text + ', saving $50K annually'
        });
      }
    }
    
    return suggestions;
  };

  const getSuggestionType = (suggestion: string): QuantificationSuggestion['type'] => {
    if (suggestion.includes('percentage') || suggestion.includes('%')) return 'percentage';
    if (suggestion.includes('dollar') || suggestion.includes('$')) return 'dollar';
    if (suggestion.includes('time') || suggestion.includes('hours') || suggestion.includes('days')) return 'time';
    if (suggestion.includes('ratio') || suggestion.includes('/')) return 'ratio';
    return 'number';
  };

  // Run analysis when resume data changes
  useEffect(() => {
    const extractedAchievements = extractAchievements();
    setAchievements(extractedAchievements);
    setAnalysisComplete(true);
  }, [resumeData]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const unquantifiedAchievements = achievements.filter(a => !a.isQuantified);
  const quantifiedAchievements = achievements.filter(a => a.isQuantified);
  const averageScore = achievements.length > 0 ? achievements.reduce((sum, a) => sum + a.score, 0) / achievements.length : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Achievement Quantifier</h3>
          <p className="text-sm text-gray-600">Transform vague accomplishments into quantified, impactful statements</p>
        </div>
      </div>

      {analysisComplete && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Achievements</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{achievements.length}</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Quantified</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{quantifiedAchievements.length}</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Need Improvement</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{unquantifiedAchievements.length}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Achievement Score</span>
              <span className={`text-sm font-bold ${getScoreColor(averageScore)}`}>
                {Math.round(averageScore)}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  averageScore >= 70 ? 'bg-green-500' : 
                  averageScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${averageScore}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {unquantifiedAchievements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            Achievements That Need Quantification
          </h4>
          
          <div className="space-y-3">
            {unquantifiedAchievements.map((achievement) => (
              <div key={achievement.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">{achievement.section}</div>
                    <div className="text-sm text-gray-900 mb-2">{achievement.text}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Impact Score:</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getScoreBgColor(achievement.score)} ${getScoreColor(achievement.score)}`}>
                        {achievement.score}/100
                      </span>
                    </div>
                  </div>
                </div>
                
                {achievement.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-700 mb-2">Quantification Suggestions:</div>
                    <div className="space-y-2">
                      {achievement.suggestions.slice(0, 2).map((suggestion, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-md">
                          <div className="text-xs font-medium text-blue-900 mb-1">{suggestion.suggestion}</div>
                          <div className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">Before:</span> {suggestion.before}
                          </div>
                          <div className="text-xs text-green-700">
                            <span className="font-medium">After:</span> {suggestion.after}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {quantifiedAchievements.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-green-500" />
            Well-Quantified Achievements
          </h4>
          
          <div className="space-y-2">
            {quantifiedAchievements.slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs text-green-600 mb-1">{achievement.section}</div>
                <div className="text-sm text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {achievement.text}
                </div>
                <div className="text-xs text-green-600 mt-1">Score: {achievement.score}/100</div>
              </div>
            ))}
            {quantifiedAchievements.length > 3 && (
              <div className="text-xs text-gray-500 text-center py-2">
                +{quantifiedAchievements.length - 3} more well-quantified achievements
              </div>
            )}
          </div>
        </div>
      )}

      {achievements.length === 0 && analysisComplete && (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No achievements found to analyze.</p>
          <p className="text-sm text-gray-400 mt-1">Add work experience or project descriptions to get started.</p>
        </div>
      )}
    </div>
  );
}