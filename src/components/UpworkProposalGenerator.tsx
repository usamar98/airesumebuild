import { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  BookmarkIcon,
  EyeIcon,
  StarIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  BriefcaseIcon,
  TagIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { ResumeData } from '../types';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

interface UpworkProposalGeneratorProps {
  resumeData: ResumeData;
}

interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  keywords: string[];
}

const proposalTemplates: ProposalTemplate[] = [
  { 
    id: 'web-dev', 
    name: 'Web Development', 
    description: 'Full-stack web applications, responsive design, modern frameworks', 
    category: 'Development',
    icon: '💻',
    keywords: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'API', 'responsive', 'modern']
  },
  { 
    id: 'mobile-dev', 
    name: 'Mobile Development', 
    description: 'iOS/Android apps, React Native, Flutter development', 
    category: 'Development',
    icon: '📱',
    keywords: ['React Native', 'Flutter', 'iOS', 'Android', 'mobile', 'app store']
  },
  { 
    id: 'design', 
    name: 'UI/UX Design', 
    description: 'User interface design, user experience optimization, prototyping', 
    category: 'Design',
    icon: '🎨',
    keywords: ['Figma', 'Adobe', 'prototype', 'user experience', 'interface', 'design system']
  },
  { 
    id: 'writing', 
    name: 'Content Writing', 
    description: 'Blog posts, copywriting, technical documentation, SEO content', 
    category: 'Writing',
    icon: '✍️',
    keywords: ['SEO', 'copywriting', 'blog', 'content strategy', 'technical writing']
  },
  { 
    id: 'marketing', 
    name: 'Digital Marketing', 
    description: 'Social media, PPC campaigns, email marketing, analytics', 
    category: 'Marketing',
    icon: '📈',
    keywords: ['Google Ads', 'Facebook Ads', 'social media', 'analytics', 'conversion']
  },
  { 
    id: 'data', 
    name: 'Data Analysis', 
    description: 'Data visualization, machine learning, statistical analysis', 
    category: 'Data',
    icon: '📊',
    keywords: ['Python', 'SQL', 'machine learning', 'visualization', 'statistics']
  },
  { 
    id: 'consulting', 
    name: 'Business Consulting', 
    description: 'Strategy development, process optimization, market research', 
    category: 'Business',
    icon: '💼',
    keywords: ['strategy', 'optimization', 'market research', 'business analysis']
  },
  { 
    id: 'general', 
    name: 'General Purpose', 
    description: 'Versatile template adaptable to any project type', 
    category: 'General',
    icon: '🚀',
    keywords: ['versatile', 'adaptable', 'professional', 'reliable']
  }
];

const budgetRanges = [
  { value: '$5 - $25', label: '$5 - $25 (Entry Level)', color: 'bg-green-100 text-green-800' },
  { value: '$25 - $50', label: '$25 - $50 (Intermediate)', color: 'bg-blue-100 text-blue-800' },
  { value: '$50 - $100', label: '$50 - $100 (Experienced)', color: 'bg-purple-100 text-purple-800' },
  { value: '$100 - $250', label: '$100 - $250 (Expert)', color: 'bg-orange-100 text-orange-800' },
  { value: '$250 - $500', label: '$250 - $500 (Premium)', color: 'bg-red-100 text-red-800' },
  { value: '$500 - $1,000', label: '$500 - $1,000 (Enterprise)', color: 'bg-indigo-100 text-indigo-800' },
  { value: '$1,000+', label: '$1,000+ (Strategic)', color: 'bg-gray-100 text-gray-800' }
];

const projectDurations = [
  { value: 'Less than 1 week', label: 'Less than 1 week', icon: '⚡' },
  { value: '1-2 weeks', label: '1-2 weeks', icon: '📅' },
  { value: '1 month', label: '1 month', icon: '🗓️' },
  { value: '2-3 months', label: '2-3 months', icon: '📆' },
  { value: '3-6 months', label: '3-6 months', icon: '🗓️' },
  { value: '6+ months', label: '6+ months', icon: '📋' }
];

const toneOptions = [
  { id: 'professional', name: 'Professional', description: 'Formal, business-focused, authoritative', icon: '👔' },
  { id: 'friendly', name: 'Friendly', description: 'Warm, approachable, conversational', icon: '😊' },
  { id: 'technical', name: 'Technical', description: 'Detail-oriented, precise, expertise-focused', icon: '🔧' },
  { id: 'creative', name: 'Creative', description: 'Innovative, expressive, unique approach', icon: '🎨' }
];

const lengthOptions = [
  { id: 'concise', name: 'Concise', description: '150-200 words', range: '150-200', icon: '⚡' },
  { id: 'standard', name: 'Standard', description: '250-350 words', range: '250-350', icon: '📝' },
  { id: 'detailed', name: 'Detailed', description: '400-500 words', range: '400-500', icon: '📄' }
];

export default function UpworkProposalGenerator({ resumeData }: UpworkProposalGeneratorProps) {
  const { getAccessToken } = useSupabaseAuth();
  
  // Form state
  const [projectTitle, setProjectTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [projectDuration, setProjectDuration] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedLength, setSelectedLength] = useState('standard');
  
  // Proposal state
  const [manualProposal, setManualProposal] = useState('');
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Smart features state
  const [proposalScore, setProposalScore] = useState(0);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [showTips, setShowTips] = useState(true);
  
  // Progress calculation
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Character limits (Upwork has specific limits)
  const MAX_PROPOSAL_LENGTH = 5000;
  const RECOMMENDED_MIN_LENGTH = 150;

  useEffect(() => {
    calculateCompletionPercentage();
    validateForm();
    generateKeywordSuggestions();
  }, [projectTitle, clientName, projectDescription, budgetRange, projectDuration, hourlyRate, selectedTemplate]);

  useEffect(() => {
    calculateProposalScore();
  }, [generatedProposal, manualProposal, activeTab]);

  useEffect(() => {
    // Load saved draft from localStorage
    const savedDraft = localStorage.getItem('upwork-proposal-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setProjectTitle(draft.projectTitle || '');
        setClientName(draft.clientName || '');
        setProjectDescription(draft.projectDescription || '');
        setBudgetRange(draft.budgetRange || '');
        setProjectDuration(draft.projectDuration || '');
        setHourlyRate(draft.hourlyRate || '');
        setManualProposal(draft.manualProposal || '');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  const validateForm = () => {
     const errors: {[key: string]: string} = {};
     
     if (!projectTitle.trim()) {
       errors.projectTitle = 'Project title is required';
     } else if (projectTitle.length < 5) {
       errors.projectTitle = 'Project title should be at least 5 characters';
     }
     
     if (!projectDescription.trim()) {
       errors.projectDescription = 'Project description is required';
     } else if (projectDescription.length < 50) {
       errors.projectDescription = 'Project description should be at least 50 characters for better context';
     }
     
     // Hourly rate is now optional, but if provided, must be valid
     if (hourlyRate && hourlyRate.trim() && (isNaN(Number(hourlyRate)) || Number(hourlyRate) < 5)) {
       errors.hourlyRate = 'Please enter a valid hourly rate (minimum $5)';
     }
     
     setFormErrors(errors);
   };

  const generateKeywordSuggestions = () => {
    const template = proposalTemplates.find(t => t.id === selectedTemplate);
    if (template && projectDescription) {
      const descWords = projectDescription.toLowerCase().split(/\s+/);
      const relevantKeywords = template.keywords.filter(keyword => 
        !descWords.some(word => word.includes(keyword.toLowerCase()))
      );
      setKeywordSuggestions(relevantKeywords.slice(0, 5));
    }
  };

  const calculateProposalScore = () => {
    const proposal = activeTab === 'ai' ? generatedProposal : manualProposal;
    if (!proposal) {
      setProposalScore(0);
      return;
    }

    let score = 0;
    const wordCount = proposal.split(/\s+/).length;
    
    // Length score (30 points)
    if (wordCount >= 150 && wordCount <= 500) {
      score += 30;
    } else if (wordCount >= 100) {
      score += 20;
    } else if (wordCount >= 50) {
      score += 10;
    }
    
    // Personalization score (25 points)
    if (clientName && proposal.toLowerCase().includes(clientName.toLowerCase())) {
      score += 15;
    }
    if (projectTitle && proposal.toLowerCase().includes(projectTitle.toLowerCase())) {
      score += 10;
    }
    
    // Professional elements score (25 points)
    const professionalElements = [
      /experience/i,
      /portfolio/i,
      /timeline/i,
      /deliverable/i,
      /approach/i,
      /methodology/i
    ];
    const foundElements = professionalElements.filter(regex => regex.test(proposal)).length;
    score += Math.min(foundElements * 4, 25);
    
    // Call to action score (20 points)
    const ctaPatterns = [
      /let.s discuss/i,
      /happy to chat/i,
      /schedule a call/i,
      /look forward/i,
      /contact me/i
    ];
    if (ctaPatterns.some(pattern => pattern.test(proposal))) {
      score += 20;
    }
    
    setProposalScore(Math.min(score, 100));
  };

  const calculateCompletionPercentage = () => {
     // Only count required fields for completion percentage
     const requiredFields = [projectTitle, projectDescription, budgetRange, projectDuration];
     const filledFields = requiredFields.filter(field => field.trim() !== '').length;
     const percentage = Math.round((filledFields / requiredFields.length) * 100);
     setCompletionPercentage(percentage);
   };

  const saveDraft = () => {
    const draft = {
      projectTitle,
      clientName,
      projectDescription,
      budgetRange,
      projectDuration,
      hourlyRate,
      manualProposal,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('upwork-proposal-draft', JSON.stringify(draft));
  };

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

  const generateAIProposal = async () => {
    if (Object.keys(formErrors).length > 0) {
      alert('Please fix the form errors before generating a proposal');
      return;
    }

    if (!projectTitle.trim() || !projectDescription.trim()) {
      alert('Please fill in the project title and description');
      return;
    }

    setIsGenerating(true);
    startProgressTimer();
    saveDraft();

    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const template = proposalTemplates.find(t => t.id === selectedTemplate);
      const tone = toneOptions.find(t => t.id === selectedTone);
      const length = lengthOptions.find(l => l.id === selectedLength);

      // Create a comprehensive prompt for Upwork proposals
      const proposalPrompt = `Create a professional Upwork proposal with the following requirements:

PROJECT DETAILS:
- Title: ${projectTitle}
- Client: ${clientName || 'the client'}
- Description: ${projectDescription}
- Budget Range: ${budgetRange}
- Duration: ${projectDuration}
- My Rate: $${hourlyRate}/hour

PROPOSAL REQUIREMENTS:
- Template Type: ${template?.name} (${template?.description})
- Tone: ${tone?.name} (${tone?.description})
- Length: ${length?.name} (${length?.range} words)
- Keywords to include: ${template?.keywords.join(', ')}

STRUCTURE THE PROPOSAL WITH:
1. Personalized greeting addressing the client's needs
2. Clear understanding of the project requirements
3. Your approach and methodology
4. Relevant experience from resume (highlight matching skills)
5. Timeline and deliverables
6. Professional closing with call to action

RESUME CONTEXT:
${JSON.stringify(resumeData, null, 2)}

Make it compelling, professional, and tailored to win the project. Focus on value proposition and results. Include specific examples and demonstrate expertise.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch('/api/generate-upwork-proposal', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`,
         },
         body: JSON.stringify({
           resumeData,
           projectTitle,
           clientName,
           projectDescription,
           budgetRange,
           projectDuration,
           hourlyRate,
           selectedTemplate,
           selectedTone,
           selectedLength
         }),
         signal: controller.signal
       });

      clearTimeout(timeoutId);
      
      // Check if response is ok and has content
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (response.status === 408) {
          errorMessage = 'The AI service is taking longer than expected. Please try again in a moment.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status === 503) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        }
        alert('Failed to generate proposal: ' + errorMessage);
        return;
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        alert('Failed to generate proposal: Server returned invalid response format');
        return;
      }

      // Get response text first to check if it's empty
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        alert('Failed to generate proposal: Server returned empty response');
        return;
      }

      // Try to parse JSON with proper error handling
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText);
        alert('Failed to generate proposal: Server returned invalid JSON response');
        return;
      }
      
      if (result.success) {
         setGeneratedProposal(result.proposal);
       } else {
         let errorMessage = result.error || 'Unknown error';
         alert('Failed to generate proposal: ' + errorMessage);
       }
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      alert('Error generating proposal: ' + errorMessage);
    } finally {
      setIsGenerating(false);
      stopProgressTimer();
    }
  };

  const enhanceManualProposal = async () => {
    if (!manualProposal.trim()) {
      alert('Please write some content first');
      return;
    }

    setIsEnhancing(true);
    startProgressTimer();
    saveDraft();

    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const enhancePrompt = `Enhance this Upwork proposal to make it more professional and compelling:

ORIGINAL PROPOSAL:
${manualProposal}

PROJECT CONTEXT:
- Title: ${projectTitle}
- Client: ${clientName || 'the client'}
- Description: ${projectDescription}
- Budget: ${budgetRange}
- Duration: ${projectDuration}

ENHANCEMENT REQUIREMENTS:
- Improve clarity and professionalism
- Add compelling value propositions
- Ensure proper structure and flow
- Optimize for Upwork best practices
- Keep the original intent and personality
- Target length: ${lengthOptions.find(l => l.id === selectedLength)?.range} words

Make it more likely to win the project while maintaining authenticity.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeData,
          jobDescription: enhancePrompt,
          companyName: clientName || 'Client',
          positionTitle: projectTitle,
          existingContent: manualProposal,
          type: 'enhance'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (result.success) {
        setManualProposal(result.coverLetter);
      } else {
        alert('Failed to enhance proposal: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error enhancing proposal: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsEnhancing(false);
      stopProgressTimer();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Proposal copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const getCharacterCount = (text: string) => text.length;
  const getRemainingCharacters = (text: string) => MAX_PROPOSAL_LENGTH - getCharacterCount(text);

  const getCharacterCountColor = (text: string) => {
    const count = getCharacterCount(text);
    if (count < RECOMMENDED_MIN_LENGTH) return 'text-orange-600';
    if (count > MAX_PROPOSAL_LENGTH * 0.9) return 'text-red-600';
    return 'text-green-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upwork Proposal Generator</h1>
              <p className="text-gray-600">Create winning proposals that get you hired on Upwork</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Completion</div>
                <div className="text-lg font-semibold text-blue-600">{completionPercentage}%</div>
              </div>
              <div className="w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray={`${completionPercentage}, 100`}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Smart Features Panel */}
          {(generatedProposal || manualProposal) && (
            <div className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
                Smart Analysis
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Proposal Score */}
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <StarIcon className="h-4 w-4 mr-2 text-yellow-500" />
                      Proposal Score
                    </h3>
                    <span className={`text-lg font-bold ${
                      proposalScore >= 80 ? 'text-green-600' : 
                      proposalScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {proposalScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        proposalScore >= 80 ? 'bg-green-500' : 
                        proposalScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${proposalScore}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {proposalScore >= 80 ? 'Excellent! Your proposal is highly competitive.' :
                     proposalScore >= 60 ? 'Good proposal, but could be improved.' :
                     'Needs improvement to be competitive.'}
                  </p>
                </div>

                {/* Keyword Suggestions */}
                {keywordSuggestions.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <TagIcon className="h-4 w-4 mr-2 text-blue-500" />
                      Suggested Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {keywordSuggestions.map((keyword, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                          onClick={() => {
                            const currentProposal = activeTab === 'ai' ? generatedProposal : manualProposal;
                            const updatedProposal = currentProposal + (currentProposal ? ' ' : '') + keyword;
                            if (activeTab === 'ai') {
                              setGeneratedProposal(updatedProposal);
                            } else {
                              setManualProposal(updatedProposal);
                            }
                          }}
                        >
                          + {keyword}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Click to add keywords to your proposal
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Validation Errors */}
          {Object.keys(formErrors).length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(formErrors).map(([field, error]) => (
                      <li key={field}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Project Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600" />
              Project Information
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.projectTitle ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Build a React E-commerce Website"
                    required
                  />
                  {formErrors.projectTitle && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.projectTitle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    Client Name/Company
                    <span className="text-gray-500 text-xs ml-1">(optional but recommended)</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., John Smith or ABC Company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                    Budget Range *
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select budget range</option>
                    {budgetRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    Project Duration *
                  </label>
                  <select
                    value={projectDuration}
                    onChange={(e) => setProjectDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select duration</option>
                    {projectDurations.map(duration => (
                      <option key={duration.value} value={duration.value}>
                        {duration.icon} {duration.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                     Your Hourly Rate
                     <span className="text-gray-500 text-xs ml-1">(optional)</span>
                   </label>
                   <div className="relative">
                     <span className="absolute left-3 top-2 text-gray-500">$</span>
                     <input
                       type="number"
                       value={hourlyRate}
                       onChange={(e) => setHourlyRate(e.target.value)}
                       className={`w-full pl-8 pr-16 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                         formErrors.hourlyRate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                       }`}
                       placeholder="25"
                       min="5"
                     />
                     <span className="absolute right-3 top-2 text-gray-500">/hour</span>
                   </div>
                   {formErrors.hourlyRate && (
                     <p className="mt-1 text-xs text-red-600">{formErrors.hourlyRate}</p>
                   )}
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Project Description *
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.projectDescription ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Paste the project description from Upwork here..."
                  rows={12}
                  required
                />
                {formErrors.projectDescription && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.projectDescription}</p>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  {projectDescription.length} characters
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Proposal Settings */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
              Proposal Settings
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <div className="space-y-2">
                  {proposalTemplates.map(template => (
                    <label key={template.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplate === template.id}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{template.icon}</span>
                          <span className="font-medium text-sm">{template.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                <div className="space-y-2">
                  {toneOptions.map(tone => (
                    <label key={tone.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="tone"
                        value={tone.id}
                        checked={selectedTone === tone.id}
                        onChange={(e) => setSelectedTone(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{tone.icon}</span>
                          <span className="font-medium text-sm">{tone.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{tone.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                <div className="space-y-2">
                  {lengthOptions.map(length => (
                    <label key={length.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="length"
                        value={length.id}
                        checked={selectedLength === length.id}
                        onChange={(e) => setSelectedLength(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{length.icon}</span>
                          <span className="font-medium text-sm">{length.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{length.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={saveDraft}
              className="inline-flex items-center px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <BookmarkIcon className="h-4 w-4 mr-2" />
              Save Draft
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            {showTips && (
              <button
                onClick={() => setShowTips(false)}
                className="inline-flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <InformationCircleIcon className="h-4 w-4 mr-2" />
                Hide Tips
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'ai'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <SparklesIcon className="h-5 w-5 inline mr-2" />
                  AI Generated Proposal
                </button>
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
              </nav>
            </div>
          </div>

          {/* AI Generated Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="text-center">
                <button
                  onClick={generateAIProposal}
                  disabled={isGenerating || !projectTitle.trim() || !projectDescription.trim()}
                  className="inline-flex items-center px-6 py-3 text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Proposal...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-3" />
                      Generate AI Proposal
                    </>
                  )}
                </button>
                
                {isGenerating && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-blue-800 font-medium">
                          Creating your winning Upwork proposal...
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
                        AI is analyzing your resume and crafting a tailored proposal. This typically takes 30-60 seconds.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {generatedProposal && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Generated Proposal
                    </label>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm ${getCharacterCountColor(generatedProposal)}`}>
                        {getCharacterCount(generatedProposal)} / {MAX_PROPOSAL_LENGTH} characters
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedProposal)}
                        className="inline-flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
                      {generatedProposal}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual + AI Enhancement Tab */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Proposal Draft
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm ${getCharacterCountColor(manualProposal)}`}>
                      {getCharacterCount(manualProposal)} / {MAX_PROPOSAL_LENGTH} characters
                    </span>
                    <button
                      onClick={enhanceManualProposal}
                      disabled={isEnhancing || !manualProposal.trim()}
                      className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                </div>
                <textarea
                  value={manualProposal}
                  onChange={(e) => setManualProposal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your proposal draft here. The AI will help enhance it based on your resume and the project requirements..."
                  rows={15}
                />
                {isEnhancing && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-amber-800 font-medium">
                        Enhancing your proposal with AI...
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
                {manualProposal && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => copyToClipboard(manualProposal)}
                      className="inline-flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Mode */}
          {showPreview && (generatedProposal || manualProposal) && (
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <EyeIcon className="h-5 w-5 mr-2 text-blue-600" />
                Proposal Preview
              </h3>
              <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>To:</strong> {clientName || 'Client'} | <strong>Project:</strong> {projectTitle || 'Project Title'}
                </div>
                <hr className="mb-4" />
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
                    {activeTab === 'ai' ? generatedProposal : manualProposal}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Upwork Tips */}
          {showTips && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <LightBulbIcon className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-green-900 mb-3">Upwork Proposal Best Practices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                    <div>
                      <h4 className="font-medium mb-2">✅ Do:</h4>
                      <ul className="space-y-1">
                        <li>• Personalize each proposal for the specific project</li>
                        <li>• Address the client by name when possible</li>
                        <li>• Highlight relevant experience and skills</li>
                        <li>• Include specific examples of past work</li>
                        <li>• Ask thoughtful questions about the project</li>
                        <li>• Keep it concise but comprehensive</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">❌ Don't:</h4>
                      <ul className="space-y-1">
                        <li>• Use generic, copy-paste proposals</li>
                        <li>• Focus only on your needs (payment, etc.)</li>
                        <li>• Make spelling or grammar mistakes</li>
                        <li>• Exceed the character limit (5,000 chars)</li>
                        <li>• Bid too low just to win the project</li>
                        <li>• Forget to proofread before submitting</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-100 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Pro Tip:</strong> Upwork clients receive many proposals. Make yours stand out by showing you understand their specific needs and can deliver results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}