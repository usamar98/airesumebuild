import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, FileText, Briefcase, User, Sparkles, MessageSquare, Search, Target, PenTool, CheckCircle, ArrowRight, Lightbulb, Zap, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { useRoleManagement } from '../hooks/useRoleManagement';

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'job_posting' | 'job_seeking' | 'general';
  path?: string;
  action?: () => void;
  premium?: boolean;
  comingSoon?: boolean;
}

interface GeneratedContent {
  type: 'job_description' | 'cover_letter' | 'interview_prep' | 'salary_analysis';
  content: string;
  metadata?: any;
}

const AIAssistantHub: React.FC = () => {
  const { user, token } = useSupabaseAuth();
  const { userRole } = useRoleManagement();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | 'job_posting' | 'job_seeking' | 'general'>('all');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user]);

  const aiTools: AITool[] = [
    // Job Posting Tools
    {
      id: 'job_description_generator',
      title: 'Job Description Generator',
      description: 'Create compelling job descriptions with AI assistance',
      icon: <FileText className="h-6 w-6" />,
      category: 'job_posting',
      path: '/post-job'
    },
    {
      id: 'salary_analyzer',
      title: 'Salary Range Analyzer',
      description: 'Get market-competitive salary recommendations',
      icon: <TrendingUp className="h-6 w-6" />,
      category: 'job_posting',
      action: () => generateSalaryAnalysis(),
      comingSoon: true
    },
    {
      id: 'candidate_screening',
      title: 'Candidate Screening Assistant',
      description: 'AI-powered candidate evaluation and ranking',
      icon: <Users className="h-6 w-6" />,
      category: 'job_posting',
      path: '/employer-dashboard'
    },
    {
      id: 'job_optimization',
      title: 'Job Posting Optimizer',
      description: 'Optimize your job posts for better visibility',
      icon: <Target className="h-6 w-6" />,
      category: 'job_posting',
      action: () => optimizeJobPosting(),
      comingSoon: true
    },

    // Job Seeking Tools
    {
      id: 'resume_builder',
      title: 'AI Resume Builder',
      description: 'Build professional resumes with AI guidance',
      icon: <FileText className="h-6 w-6" />,
      category: 'job_seeking',
      path: '/resume-builder'
    },
    {
      id: 'upwork_proposal_generator',
      title: 'Upwork Proposal Generator',
      description: 'Generate professional proposals and cover letters for freelance job applications based on job descriptions',
      icon: <Briefcase className="h-6 w-6" />,
      category: 'job_seeking',
      path: '/upwork-proposal'
    },
    {
      id: 'interview_prep',
      title: 'Interview Preparation',
      description: 'Practice with AI-generated interview questions',
      icon: <MessageSquare className="h-6 w-6" />,
      category: 'job_seeking',
      action: () => generateInterviewPrep(),
      comingSoon: true
    },
    {
      id: 'job_matcher',
      title: 'Smart Job Matcher',
      description: 'Find jobs that match your skills and preferences',
      icon: <Search className="h-6 w-6" />,
      category: 'job_seeking',
      comingSoon: true
    },
    {
      id: 'skill_gap_analysis',
      title: 'Skill Gap Analysis',
      description: 'Identify skills to improve for your target roles',
      icon: <Lightbulb className="h-6 w-6" />,
      category: 'job_seeking',
      action: () => analyzeSkillGap(),
      comingSoon: true
    },

    // General Tools
    {
      id: 'career_advisor',
      title: 'AI Career Advisor',
      description: 'Get personalized career guidance and advice',
      icon: <Bot className="h-6 w-6" />,
      category: 'general',
      comingSoon: true
    },
    {
      id: 'industry_insights',
      title: 'Industry Insights',
      description: 'Stay updated with industry trends and insights',
      icon: <TrendingUp className="h-6 w-6" />,
      category: 'general',
      comingSoon: true
    },
    {
      id: 'networking_assistant',
      title: 'Networking Assistant',
      description: 'Get tips for professional networking and outreach',
      icon: <Users className="h-6 w-6" />,
      category: 'general',
      comingSoon: true
    }
  ];

  // Filter tools based on user role - SIMPLIFIED FOR CORE FEATURES
  const getFilteredTools = () => {
    // Show all core tools regardless of role
    return aiTools.filter(tool => 
      tool.category === 'job_seeking' || 
      tool.category === 'general'
    );
    
    /* COMMENTED OUT FOR CORE FEATURES FOCUS
    if (userRole === 'job_seeker') {
      return aiTools.filter(tool => 
        tool.category === 'job_seeking' || 
        tool.category === 'general'
      );
    } else if (userRole === 'employer') {
      return aiTools.filter(tool => 
        tool.category === 'job_posting' || 
        tool.category === 'general'
      );
    } else {
      // For dual role or undefined, show all tools
      return aiTools;
    }
    */
  };

  const filteredTools = getFilteredTools();

  const generateSalaryAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/salary-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: quickPrompt || 'Analyze salary ranges for software engineer positions'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate salary analysis');
      }
      
      const data = await response.json();
      setGeneratedContent({
        type: 'salary_analysis',
        content: data.analysis,
        metadata: data.metadata
      });
      toast.success('Salary analysis generated successfully');
    } catch (error) {
      console.error('Error generating salary analysis:', error);
      toast.error('Failed to generate salary analysis');
    } finally {
      setLoading(false);
    }
  };

  const optimizeJobPosting = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/optimize-job-posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: quickPrompt || 'Optimize job posting for better candidate attraction'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to optimize job posting');
      }
      
      const data = await response.json();
      setGeneratedContent({
        type: 'job_description',
        content: data.optimizedContent,
        metadata: data.suggestions
      });
      toast.success('Job posting optimization completed');
    } catch (error) {
      console.error('Error optimizing job posting:', error);
      toast.error('Failed to optimize job posting');
    } finally {
      setLoading(false);
    }
  };

  const generateInterviewPrep = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: quickPrompt || 'Generate interview questions for software engineer position'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate interview prep');
      }
      
      const data = await response.json();
      setGeneratedContent({
        type: 'interview_prep',
        content: data.questions,
        metadata: data.tips
      });
      toast.success('Interview preparation generated successfully');
    } catch (error) {
      console.error('Error generating interview prep:', error);
      toast.error('Failed to generate interview preparation');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkillGap = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/skill-gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: quickPrompt || 'Analyze skill gaps for career advancement'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze skill gap');
      }
      
      const data = await response.json();
      setGeneratedContent({
        type: 'interview_prep',
        content: data.analysis,
        metadata: data.recommendations
      });
      toast.success('Skill gap analysis completed');
    } catch (error) {
      console.error('Error analyzing skill gap:', error);
      toast.error('Failed to analyze skill gap');
    } finally {
      setLoading(false);
    }
  };

  const getCareerAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-assistance/career-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: quickPrompt || 'Provide career guidance for professional growth'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get career advice');
      }
      
      const data = await response.json();
      setGeneratedContent({
        type: 'interview_prep',
        content: data.advice,
        metadata: data.actionItems
      });
      toast.success('Career advice generated successfully');
    } catch (error) {
      console.error('Error getting career advice:', error);
      toast.error('Failed to get career advice');
    } finally {
      setLoading(false);
    }
  };

  const getIndustryInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-assistance/industry-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: quickPrompt || 'Provide current industry trends and insights'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get industry insights');
      }
      
      const data = await response.json();
      setGeneratedContent({
        type: 'interview_prep',
        content: data.insights,
        metadata: data.trends
      });
      toast.success('Industry insights generated successfully');
    } catch (error) {
      console.error('Error getting industry insights:', error);
      toast.error('Failed to get industry insights');
    } finally {
      setLoading(false);
    }
  };

  const getNetworkingTips = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-assistance/networking-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: quickPrompt || 'Provide networking tips for career advancement'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get networking tips');
      }
      
      const data = await response.json();
      setGeneratedContent({
        type: 'interview_prep',
        content: data.tips,
        metadata: data.strategies
      });
      toast.success('Networking tips generated successfully');
    } catch (error) {
      console.error('Error getting networking tips:', error);
      toast.error('Failed to get networking tips');
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = (tool: AITool) => {
    if (tool.comingSoon) {
      toast.info('This feature is coming soon! 🚀');
      return;
    }
    
    if (tool.path) {
      navigate(tool.path);
    } else if (tool.action) {
      tool.action();
    }
  };

  const filteredToolsByCategory = filteredTools.filter(tool => 
    activeCategory === 'all' || tool.category === activeCategory
  );

  // Get role-specific content
  const getRoleSpecificContent = () => {
    // SIMPLIFIED FOR CORE FEATURES - Always show job seeker focused tools
    return {
      title: 'AI Career Assistant',
      description: 'Accelerate your job search with AI-powered career tools',
      categories: [
        { id: 'all', label: 'All Tools', icon: <Sparkles className="h-4 w-4" /> },
        { id: 'job_seeking', label: 'Job Search', icon: <User className="h-4 w-4" /> },
        { id: 'general', label: 'Career Tools', icon: <Bot className="h-4 w-4" /> }
      ]
    };
    
    /* COMMENTED OUT FOR CORE FEATURES FOCUS
    if (userRole === 'job_seeker') {
      return {
        title: 'AI Career Assistant',
        description: 'Accelerate your job search with AI-powered career tools',
        categories: [
          { id: 'all', label: 'All Tools', icon: <Sparkles className="h-4 w-4" /> },
          { id: 'job_seeking', label: 'Job Search', icon: <User className="h-4 w-4" /> },
          { id: 'general', label: 'Career Tools', icon: <Bot className="h-4 w-4" /> }
        ]
      };
    } else if (userRole === 'employer') {
      return {
        title: 'AI Hiring Assistant',
        description: 'Streamline your hiring process with AI-powered recruitment tools',
        categories: [
          { id: 'all', label: 'All Tools', icon: <Sparkles className="h-4 w-4" /> },
          { id: 'job_posting', label: 'Recruitment', icon: <Briefcase className="h-4 w-4" /> },
          { id: 'general', label: 'Career Tools', icon: <Bot className="h-4 w-4" /> }
        ]
      };
    } else {
      return {
        title: 'AI Assistant Hub',
        description: 'Supercharge your career with AI-powered tools for job posting, job seeking, and professional growth',
        categories: [
          { id: 'all', label: 'All Tools', icon: <Sparkles className="h-4 w-4" /> },
          { id: 'job_posting', label: 'For Employers', icon: <Briefcase className="h-4 w-4" /> },
          { id: 'job_seeking', label: 'For Job Seekers', icon: <User className="h-4 w-4" /> },
          { id: 'general', label: 'Career Tools', icon: <Bot className="h-4 w-4" /> }
        ]
      };
    }
    */
  };

  const roleContent = getRoleSpecificContent();
  const categories = roleContent.categories;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{roleContent.title}</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {roleContent.description}
          </p>
        </div>

        {/* Quick Action */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick AI Assistant
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="Ask AI anything about your career, job search, or hiring..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={getCareerAdvice}
              disabled={loading || !quickPrompt.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Ask AI
            </button>
          </div>
        </div>

        {/* Generated Content */}
        {generatedContent && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                AI Generated Content
              </h3>
              <button
                onClick={() => setGeneratedContent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">{generatedContent.content}</div>
            </div>
            {generatedContent.metadata && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Additional Information:</h4>
                <div className="text-sm text-blue-800">
                  {typeof generatedContent.metadata === 'string' 
                    ? generatedContent.metadata 
                    : JSON.stringify(generatedContent.metadata, null, 2)
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category.icon}
              {category.label}
            </button>
          ))}
        </div>

        {/* AI Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredToolsByCategory.map(tool => (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`bg-white rounded-lg shadow-sm p-6 transition-all border border-gray-200 group ${
                tool.comingSoon 
                  ? 'opacity-60 cursor-not-allowed hover:shadow-sm' 
                  : 'hover:shadow-md cursor-pointer hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg transition-colors ${
                  tool.comingSoon 
                    ? 'bg-gray-50' 
                    : 'bg-blue-50 group-hover:bg-blue-100'
                }`}>
                  <div className={tool.comingSoon ? 'text-gray-400' : 'text-blue-600'}>
                    {tool.icon}
                  </div>
                </div>
                {tool.premium && (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Premium
                  </span>
                )}
                {tool.comingSoon && (
                  <span className="bg-gradient-to-r from-orange-400 to-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Coming Soon
                  </span>
                )}
              </div>
              
              <h3 className={`text-lg font-semibold mb-2 transition-colors ${
                tool.comingSoon 
                  ? 'text-gray-500' 
                  : 'text-gray-900 group-hover:text-blue-600'
              }`}>
                {tool.title}
              </h3>
              
              <p className={`mb-4 text-sm leading-relaxed ${
                tool.comingSoon ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {tool.description}
              </p>
              
              <div className={`flex items-center text-sm font-medium ${
                tool.comingSoon 
                  ? 'text-gray-400' 
                  : 'text-blue-600 group-hover:text-blue-700'
              }`}>
                <span>{tool.comingSoon ? 'Coming Soon' : 'Get Started'}</span>
                {!tool.comingSoon && (
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to accelerate your career?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Explore our comprehensive suite of AI tools designed to help you succeed in today's competitive job market.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/jobs"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Browse Jobs
              </Link>
              <Link
                to="/post-job"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors"
              >
                Post a Job
              </Link>
              <Link
                to="/resume-builder"
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-400 transition-colors"
              >
                Build Resume
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantHub;