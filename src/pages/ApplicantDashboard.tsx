import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, Heart, FileText, Search, Filter, Calendar, MapPin, DollarSign, Building2, ExternalLink, Eye, Download, Edit, Trash2, Clock, CheckCircle, XCircle, BarChart3, TrendingUp, Award, Target, Bell, Settings, Plus, Star, BookOpen, Briefcase as BriefcaseIcon, GraduationCap, Twitter, Github, Linkedin, Globe, ChevronRight, Activity, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { apiCall, API_ENDPOINTS } from '../config/api';

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  applied_at: string;
  cover_letter: string;
  resume_url?: string;
  job_location?: string;
  job_type?: string;
  salary_range?: string;
}

interface SavedJob {
  id: string;
  job_id: string;
  title: string;
  company_name?: string;
  client_name?: string;
  location?: string;
  budget?: string;
  posted_date: string;
  saved_at: string;
  is_posted_job: boolean;
  source_url?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  experience_level?: string;
  resume_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  website_url?: string;
  work_experience?: WorkExperience[];
  education?: Education[];
  profile_visibility?: 'public' | 'private';
  notification_preferences?: NotificationPreferences;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  gpa?: string;
}

interface NotificationPreferences {
  email_notifications: boolean;
  job_alerts: boolean;
  application_updates: boolean;
  marketing_emails: boolean;
}

interface Skill {
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface ActivityItem {
  id: string;
  type: 'application' | 'saved_job' | 'profile_update' | 'job_view';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface DashboardStats {
  total_applications: number;
  pending_applications: number;
  shortlisted_applications: number;
  saved_jobs: number;
}

interface JobMatch {
  job_id: string;
  job_title: string;
  company_name: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  salary_range?: string;
  location?: string;
  job_type?: string;
  posted_date: string;
}

interface ApplicationTrend {
  date: string;
  applications: number;
  responses: number;
  success_rate: number;
}

interface SkillGap {
  skill: string;
  demand_score: number;
  user_proficiency: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  market_demand: 'low' | 'medium' | 'high' | 'critical';
  learning_resources?: string[];
}

interface IndustryInsight {
  industry: string;
  applications_count: number;
  success_rate: number;
  avg_salary: number;
  trending_skills: string[];
  growth_rate: number;
}

interface ProfileOptimization {
  overall_score: number;
  suggestions: OptimizationSuggestion[];
  missing_sections: string[];
  strength_areas: string[];
}

interface OptimizationSuggestion {
  id: string;
  type: 'profile' | 'skills' | 'experience' | 'education' | 'portfolio';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action_url?: string;
}

interface CareerProgression {
  current_level: string;
  next_level: string;
  progress_percentage: number;
  required_skills: string[];
  estimated_timeline: string;
  salary_projection: {
    current: number;
    target: number;
    increase_percentage: number;
  };
}

const ApplicantDashboard: React.FC = () => {
  const { user, token } = useSupabaseAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'saved' | 'profile'>('overview');
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'company'>('date');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [editingWorkExperience, setEditingWorkExperience] = useState(false);
  const [editingEducation, setEditingEducation] = useState(false);
  const [workExperienceForm, setWorkExperienceForm] = useState<Partial<WorkExperience>>({});
  const [educationForm, setEducationForm] = useState<Partial<Education>>({});
  
  // Professional features state
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [applicationTrends, setApplicationTrends] = useState<ApplicationTrend[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [industryInsights, setIndustryInsights] = useState<IndustryInsight[]>([]);
  const [profileOptimization, setProfileOptimization] = useState<ProfileOptimization | null>(null);
  const [careerProgression, setCareerProgression] = useState<CareerProgression | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>({
    email_notifications: true,
    job_alerts: true,
    application_updates: true,
    marketing_emails: false
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (profile) {
      calculateProfileCompletion();
      fetchAdvancedAnalytics();
    }
  }, [profile]);

  const calculateProfileCompletion = () => {
    if (!profile) return;
    
    const fields = [
      profile.full_name,
      profile.email,
      profile.phone,
      profile.location,
      profile.bio,
      profile.experience_level,
      profile.skills?.length > 0,
      profile.portfolio_url,
      profile.linkedin_url,
      profile.work_experience?.length > 0,
      profile.education?.length > 0
    ];
    
    const completedFields = fields.filter(field => field).length;
    const completion = Math.round((completedFields / fields.length) * 100);
    setProfileCompletion(completion);
  };

  const getProfileStrength = () => {
    if (profileCompletion >= 90) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (profileCompletion >= 70) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (profileCompletion >= 50) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Needs Work', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getApplicationAnalytics = () => {
    if (applications.length === 0) return { responseRate: 0, avgResponseTime: 0 };
    
    const respondedApplications = applications.filter(app => app.status !== 'pending');
    const responseRate = Math.round((respondedApplications.length / applications.length) * 100);
    
    // Mock average response time calculation
    const avgResponseTime = 5; // days
    
    return { responseRate, avgResponseTime };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await apiCall(API_ENDPOINTS.APPLICANT.STATS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
      // Fetch applications
      const applicationsResponse = await apiCall(API_ENDPOINTS.APPLICANT.APPLICATIONS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData);
      }
      
      // Fetch saved jobs
      const savedJobsResponse = await apiCall(API_ENDPOINTS.APPLICANT.SAVED_JOBS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (savedJobsResponse.ok) {
        const savedJobsData = await savedJobsResponse.json();
        setSavedJobs(savedJobsData);
      }
      
      // Fetch profile
      const profileResponse = await apiCall(API_ENDPOINTS.APPLICANT.PROFILE, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
        setProfileForm(profileData);
      }

      // Generate recent activities from applications and saved jobs
      const activities: ActivityItem[] = [];
      
      // Add recent applications
      if (applicationsResponse.ok) {
        const recentApps = (await applicationsResponse.json()).slice(0, 3);
        recentApps.forEach((app: Application) => {
          activities.push({
            id: `app-${app.id}`,
            type: 'application',
            title: `Applied to ${app.job_title}`,
            description: `at ${app.company_name}`,
            timestamp: app.applied_at,
            metadata: app
          });
        });
      }

      // Add recent saved jobs
      if (savedJobsResponse.ok) {
        const recentSaved = (await savedJobsResponse.json()).slice(0, 2);
        recentSaved.forEach((job: SavedJob) => {
          activities.push({
            id: `saved-${job.id}`,
            type: 'saved_job',
            title: `Saved ${job.title}`,
            description: `from ${job.company_name || job.client_name}`,
            timestamp: job.saved_at,
            metadata: job
          });
        });
      }

      // Sort activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return;
    }
    
    try {
      const response = await apiCall(`/api/applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to withdraw application');
      }
      
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      setSelectedApplications(prev => prev.filter(id => id !== applicationId));
      toast.success('Application withdrawn successfully');
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Failed to withdraw application');
    }
  };

  const withdrawSelectedApplications = async () => {
    if (selectedApplications.length === 0) return;
    
    if (!confirm(`Are you sure you want to withdraw ${selectedApplications.length} applications?`)) {
      return;
    }

    try {
      const promises = selectedApplications.map(id => 
        apiCall(`/api/applications/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(promises);
      
      setApplications(prev => prev.filter(app => !selectedApplications.includes(app.id)));
      setSelectedApplications([]);
      toast.success(`${selectedApplications.length} applications withdrawn successfully`);
    } catch (error) {
      console.error('Error withdrawing applications:', error);
      toast.error('Failed to withdraw some applications');
    }
  };

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const selectAllApplications = () => {
    const pendingApplications = filteredApplications
      .filter(app => app.status === 'pending')
      .map(app => app.id);
    setSelectedApplications(pendingApplications);
  };

  const clearSelection = () => {
    setSelectedApplications([]);
  };

  const removeSavedJob = async (savedJobId: string) => {
    try {
      const response = await apiCall(`/api/saved-jobs/${savedJobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove saved job');
      }
      
      setSavedJobs(prev => prev.filter(job => job.id !== savedJobId));
      toast.success('Job removed from saved list');
    } catch (error) {
      console.error('Error removing saved job:', error);
      toast.error('Failed to remove saved job');
    }
  };

  // Professional Features Functions
  const calculateJobMatchScore = (job: any, userProfile: UserProfile): number => {
    if (!userProfile.skills || userProfile.skills.length === 0) return 0;
    
    // Mock job requirements - in real app, this would come from job data
    const jobRequiredSkills = job.required_skills || ['JavaScript', 'React', 'Node.js'];
    const jobPreferredSkills = job.preferred_skills || ['TypeScript', 'AWS', 'Docker'];
    
    const userSkills = userProfile.skills.map(skill => skill.toLowerCase());
    const requiredMatches = jobRequiredSkills.filter((skill: string) => 
      userSkills.includes(skill.toLowerCase())
    ).length;
    const preferredMatches = jobPreferredSkills.filter((skill: string) => 
      userSkills.includes(skill.toLowerCase())
    ).length;
    
    const requiredScore = (requiredMatches / jobRequiredSkills.length) * 70;
    const preferredScore = (preferredMatches / jobPreferredSkills.length) * 30;
    
    return Math.min(100, Math.round(requiredScore + preferredScore));
  };

  const generateJobMatches = async () => {
    if (!profile) return;
    
    try {
      // Mock job data - in real app, this would fetch from API
      const mockJobs = [
        {
          id: '1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp Inc.',
          required_skills: ['React', 'TypeScript', 'JavaScript'],
          preferred_skills: ['Next.js', 'GraphQL', 'AWS'],
          salary_range: '$80,000 - $120,000',
          location: 'San Francisco, CA',
          job_type: 'Full-time',
          posted_date: '2024-01-15'
        },
        {
          id: '2',
          title: 'Full Stack Developer',
          company: 'StartupXYZ',
          required_skills: ['JavaScript', 'Node.js', 'React'],
          preferred_skills: ['MongoDB', 'Docker', 'Kubernetes'],
          salary_range: '$70,000 - $100,000',
          location: 'Remote',
          job_type: 'Full-time',
          posted_date: '2024-01-14'
        },
        {
          id: '3',
          title: 'React Developer',
          company: 'Digital Agency',
          required_skills: ['React', 'JavaScript', 'CSS'],
          preferred_skills: ['Redux', 'Sass', 'Webpack'],
          salary_range: '$60,000 - $85,000',
          location: 'New York, NY',
          job_type: 'Contract',
          posted_date: '2024-01-13'
        }
      ];

      const matches: JobMatch[] = mockJobs.map(job => {
        const matchScore = calculateJobMatchScore(job, profile);
        const userSkills = profile.skills || [];
        const requiredSkills = job.required_skills || [];
        const preferredSkills = job.preferred_skills || [];
        
        const matchingSkills = [...requiredSkills, ...preferredSkills].filter(skill =>
          userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
        );
        
        const missingSkills = requiredSkills.filter(skill =>
          !userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
        );

        return {
          job_id: job.id,
          job_title: job.title,
          company_name: job.company,
          match_score: matchScore,
          matching_skills: matchingSkills,
          missing_skills: missingSkills,
          salary_range: job.salary_range,
          location: job.location,
          job_type: job.job_type,
          posted_date: job.posted_date
        };
      }).sort((a, b) => b.match_score - a.match_score);

      setJobMatches(matches);
    } catch (error) {
      console.error('Error generating job matches:', error);
    }
  };

  const generateApplicationTrends = () => {
    // Mock trend data - in real app, this would be calculated from actual application data
    const trends: ApplicationTrend[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const applicationsCount = Math.floor(Math.random() * 5);
      const responsesCount = Math.floor(applicationsCount * (0.3 + Math.random() * 0.4));
      
      trends.push({
        date: date.toISOString().split('T')[0],
        applications: applicationsCount,
        responses: responsesCount,
        success_rate: applicationsCount > 0 ? (responsesCount / applicationsCount) * 100 : 0
      });
    }
    
    setApplicationTrends(trends);
  };

  const generateSkillGaps = () => {
    if (!profile?.skills) return;
    
    // Mock skill gap analysis
    const marketSkills = [
      { name: 'TypeScript', demand: 'critical', userHas: false },
      { name: 'AWS', demand: 'high', userHas: false },
      { name: 'Docker', demand: 'high', userHas: false },
      { name: 'Kubernetes', demand: 'medium', userHas: false },
      { name: 'GraphQL', demand: 'medium', userHas: false },
      { name: 'Next.js', demand: 'high', userHas: false },
      { name: 'Python', demand: 'high', userHas: false },
      { name: 'Machine Learning', demand: 'critical', userHas: false }
    ];

    const userSkills = profile.skills.map(skill => skill.toLowerCase());
    
    const gaps: SkillGap[] = marketSkills
      .filter(skill => !userSkills.includes(skill.name.toLowerCase()))
      .map(skill => ({
        skill: skill.name,
        demand_score: skill.demand === 'critical' ? 95 : skill.demand === 'high' ? 80 : 60,
        user_proficiency: 'none',
        market_demand: skill.demand as 'low' | 'medium' | 'high' | 'critical',
        learning_resources: [
          `${skill.name} Documentation`,
          `${skill.name} Online Course`,
          `${skill.name} Certification`
        ]
      }))
      .sort((a, b) => b.demand_score - a.demand_score);

    setSkillGaps(gaps.slice(0, 6)); // Show top 6 skill gaps
  };

  const generateIndustryInsights = () => {
    // Mock industry insights
    const insights: IndustryInsight[] = [
      {
        industry: 'Technology',
        applications_count: applications.filter(app => 
          app.company_name.toLowerCase().includes('tech') || 
          app.job_title.toLowerCase().includes('developer')
        ).length,
        success_rate: 25,
        avg_salary: 95000,
        trending_skills: ['React', 'TypeScript', 'AWS', 'Docker'],
        growth_rate: 15.2
      },
      {
        industry: 'Finance',
        applications_count: applications.filter(app => 
          app.company_name.toLowerCase().includes('bank') || 
          app.job_title.toLowerCase().includes('fintech')
        ).length,
        success_rate: 18,
        avg_salary: 110000,
        trending_skills: ['Python', 'SQL', 'Blockchain', 'Risk Management'],
        growth_rate: 8.7
      },
      {
        industry: 'Healthcare',
        applications_count: applications.filter(app => 
          app.company_name.toLowerCase().includes('health') || 
          app.job_title.toLowerCase().includes('medical')
        ).length,
        success_rate: 22,
        avg_salary: 85000,
        trending_skills: ['HIPAA', 'Electronic Health Records', 'Telemedicine'],
        growth_rate: 12.1
      }
    ];

    setIndustryInsights(insights);
  };

  const generateProfileOptimization = () => {
    if (!profile) return;

    const suggestions: OptimizationSuggestion[] = [];
    const missingSection: string[] = [];
    const strengthAreas: string[] = [];

    // Check profile completeness
    if (!profile.bio || profile.bio.length < 50) {
      suggestions.push({
        id: 'bio',
        type: 'profile',
        title: 'Add a compelling bio',
        description: 'A well-written bio increases profile views by 40%',
        priority: 'high'
      });
      missingSection.push('Professional Bio');
    } else {
      strengthAreas.push('Professional Bio');
    }

    if (!profile.work_experience || profile.work_experience.length === 0) {
      suggestions.push({
        id: 'experience',
        type: 'experience',
        title: 'Add work experience',
        description: 'Profiles with work experience get 3x more views',
        priority: 'critical'
      });
      missingSection.push('Work Experience');
    } else {
      strengthAreas.push('Work Experience');
    }

    if (!profile.education || profile.education.length === 0) {
      suggestions.push({
        id: 'education',
        type: 'education',
        title: 'Add education details',
        description: 'Education information helps employers understand your background',
        priority: 'medium'
      });
      missingSection.push('Education');
    } else {
      strengthAreas.push('Education');
    }

    if (!profile.skills || profile.skills.length < 5) {
      suggestions.push({
        id: 'skills',
        type: 'skills',
        title: 'Add more skills',
        description: 'Profiles with 5+ skills get 2x more job matches',
        priority: 'high'
      });
    } else {
      strengthAreas.push('Skills');
    }

    if (!profile.portfolio_url && !profile.github_url) {
      suggestions.push({
        id: 'portfolio',
        type: 'portfolio',
        title: 'Add portfolio or GitHub',
        description: 'Showcase your work to stand out from other candidates',
        priority: 'high'
      });
      missingSection.push('Portfolio/GitHub');
    } else {
      strengthAreas.push('Portfolio/GitHub');
    }

    const completedSections = strengthAreas.length;
    const totalSections = completedSections + missingSection.length;
    const overallScore = Math.round((completedSections / totalSections) * 100);

    setProfileOptimization({
      overall_score: overallScore,
      suggestions,
      missing_sections: missingSection,
      strength_areas: strengthAreas
    });
  };

  const generateCareerProgression = () => {
    if (!profile?.experience_level) return;

    const progressionMap: Record<string, CareerProgression> = {
      'entry': {
        current_level: 'Entry Level',
        next_level: 'Mid Level',
        progress_percentage: 35,
        required_skills: ['Advanced JavaScript', 'Framework Expertise', 'Testing'],
        estimated_timeline: '1-2 years',
        salary_projection: {
          current: 65000,
          target: 85000,
          increase_percentage: 31
        }
      },
      'mid': {
        current_level: 'Mid Level',
        next_level: 'Senior Level',
        progress_percentage: 60,
        required_skills: ['System Design', 'Leadership', 'Mentoring'],
        estimated_timeline: '2-3 years',
        salary_projection: {
          current: 85000,
          target: 120000,
          increase_percentage: 41
        }
      },
      'senior': {
        current_level: 'Senior Level',
        next_level: 'Lead/Principal',
        progress_percentage: 75,
        required_skills: ['Architecture', 'Team Management', 'Strategic Planning'],
        estimated_timeline: '3-5 years',
        salary_projection: {
          current: 120000,
          target: 160000,
          increase_percentage: 33
        }
      },
      'lead': {
        current_level: 'Lead/Principal',
        next_level: 'Engineering Manager',
        progress_percentage: 85,
        required_skills: ['People Management', 'Business Strategy', 'Cross-team Collaboration'],
        estimated_timeline: '2-4 years',
        salary_projection: {
          current: 160000,
          target: 200000,
          increase_percentage: 25
        }
      }
    };

    const progression = progressionMap[profile.experience_level];
    if (progression) {
      setCareerProgression(progression);
    }
  };

  const fetchAdvancedAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      // Generate all analytics data
      await generateJobMatches();
      generateApplicationTrends();
      generateSkillGaps();
      generateIndustryInsights();
      generateProfileOptimization();
      generateCareerProgression();
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const updateNotificationSettings = async (settings: NotificationPreferences) => {
    try {
      const response = await apiCall('/api/user-profiles/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      setNotificationSettings(settings);
      toast.success('Notification settings updated successfully');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const updateProfile = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.APPLICANT.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'shortlisted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'hired': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.company_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'company':
          return a.company_name.localeCompare(b.company_name);
        default:
          return 0;
      }
    });

  const filteredSavedJobs = savedJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.company_name && job.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (job.client_name && job.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your applications and manage your profile</p>
          </div>
          <Link
            to="/jobs"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Search className="h-5 w-5" />
            Browse Jobs
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_applications}</p>
                </div>
                <Briefcase className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pending_applications}</p>
                </div>
                <Clock className="h-12 w-12 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shortlisted</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.shortlisted_applications}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saved Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.saved_jobs}</p>
                </div>
                <Heart className="h-12 w-12 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </div>
              </button>

              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Applications
                  {applications.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                      {applications.length}
                    </span>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'saved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Saved Jobs
                  {savedJobs.length > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                      {savedJobs.length}
                    </span>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                  <div className={`w-2 h-2 rounded-full ${
                    profileCompletion >= 80 ? 'bg-green-500' : 
                    profileCompletion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              </button>
            </nav>
          </div>

          {/* Filters */}
          {activeTab !== 'profile' && activeTab !== 'overview' && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={activeTab === 'applications' ? 'Search applications...' : 'Search saved jobs...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {activeTab === 'applications' && (
                  <>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'company')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="status">Sort by Status</option>
                      <option value="company">Sort by Company</option>
                    </select>
                  </>
                )}
              </div>
              
              {activeTab === 'applications' && selectedApplications.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedApplications.length} application{selectedApplications.length > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearSelection}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear
                    </button>
                    <button
                      onClick={withdrawSelectedApplications}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Withdraw Selected
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'applications' && filteredApplications.filter(app => app.status === 'pending').length > 0 && selectedApplications.length === 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={selectAllApplications}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Select all pending applications
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {activeTab === 'overview' ? (
              <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'there'}! 👋
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Here's what's happening with your job search
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                          <div className="text-sm text-gray-600">Applications</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{savedJobs.length}</div>
                          <div className="text-sm text-gray-600">Saved Jobs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{profileCompletion}%</div>
                          <div className="text-sm text-gray-600">Profile</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link
                    to="/jobs"
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Search className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Browse Jobs</div>
                        <div className="text-sm text-gray-600">Find new opportunities</div>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Complete Profile</div>
                        <div className="text-sm text-gray-600">{profileCompletion}% complete</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('applications')}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">View Applications</div>
                        <div className="text-sm text-gray-600">{applications.length} total</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('saved')}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                        <Heart className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Saved Jobs</div>
                        <div className="text-sm text-gray-600">{savedJobs.length} saved</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Key Metrics and Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Application Status Breakdown */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Application Status
                    </h3>
                    {applications.length > 0 ? (
                      <div className="space-y-3">
                        {['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'].map(status => {
                          const count = applications.filter(app => app.status === status).length;
                          const percentage = Math.round((count / applications.length) * 100);
                          return (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  status === 'pending' ? 'bg-yellow-500' :
                                  status === 'reviewed' ? 'bg-blue-500' :
                                  status === 'shortlisted' ? 'bg-green-500' :
                                  status === 'rejected' ? 'bg-red-500' :
                                  'bg-purple-500'
                                }`} />
                                <span className="text-sm font-medium capitalize">{status}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{count}</span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      status === 'pending' ? 'bg-yellow-500' :
                                      status === 'reviewed' ? 'bg-blue-500' :
                                      status === 'shortlisted' ? 'bg-green-500' :
                                      status === 'rejected' ? 'bg-red-500' :
                                      'bg-purple-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No applications yet</p>
                        <Link
                          to="/jobs"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Start applying to jobs
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Profile Completion */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Profile Strength
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Completion</span>
                        <span className="text-sm text-gray-600">{profileCompletion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            profileCompletion >= 80 ? 'bg-green-500' :
                            profileCompletion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${profileCompletion}%` }}
                        />
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getProfileStrength().bgColor} ${getProfileStrength().color}`}>
                        <Award className="h-4 w-4 mr-1" />
                        {getProfileStrength().level}
                      </div>
                      
                      {profileCompletion < 100 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800 font-medium mb-2">Improve your profile:</p>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {!profile?.phone && <li>• Add phone number</li>}
                            {!profile?.bio && <li>• Write a bio</li>}
                            {!profile?.skills?.length && <li>• Add skills</li>}
                            {!profile?.work_experience?.length && <li>• Add work experience</li>}
                            {!profile?.education?.length && <li>• Add education</li>}
                          </ul>
                          <button
                            onClick={() => setActiveTab('profile')}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            Complete now <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Activity Timeline */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      Activity Timeline
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Last 30 days</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">Applications</span>
                        <div className="w-2 h-2 bg-red-500 rounded-full ml-2"></div>
                        <span className="text-xs text-gray-500">Saved</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                        <span className="text-xs text-gray-500">Profile</span>
                      </div>
                    </div>
                  </div>
                  
                  {recentActivities.length > 0 ? (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      <div className="space-y-6">
                        {recentActivities.map((activity, index) => {
                          const isToday = new Date(activity.timestamp).toDateString() === new Date().toDateString();
                          const isThisWeek = new Date(activity.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                          
                          return (
                            <div key={activity.id} className="relative flex items-start gap-4">
                              {/* Timeline dot */}
                              <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-md ${
                                activity.type === 'application' ? 'bg-blue-500' :
                                activity.type === 'saved_job' ? 'bg-red-500' :
                                activity.type === 'job_view' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}>
                                {activity.type === 'application' ? (
                                  <Briefcase className="h-5 w-5 text-white" />
                                ) : activity.type === 'saved_job' ? (
                                  <Heart className="h-5 w-5 text-white" />
                                ) : activity.type === 'job_view' ? (
                                  <Eye className="h-5 w-5 text-white" />
                                ) : (
                                  <User className="h-5 w-5 text-white" />
                                )}
                              </div>
                              
                              {/* Activity content */}
                              <div className="flex-1 min-w-0">
                                <div className={`bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors ${
                                  isToday ? 'ring-2 ring-blue-200' : ''
                                }`}>
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-semibold text-gray-900">{activity.title}</h4>
                                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        isToday ? 'bg-blue-100 text-blue-700' :
                                        isThisWeek ? 'bg-green-100 text-green-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {isToday ? 'Today' : 
                                         isThisWeek ? 'This week' : 
                                         new Date(activity.timestamp).toLocaleDateString()}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {new Date(activity.timestamp).toLocaleTimeString([], { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Activity metadata */}
                                  {activity.metadata && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {activity.metadata.company && (
                                          <div className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            {activity.metadata.company}
                                          </div>
                                        )}
                                        {activity.metadata.location && (
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {activity.metadata.location}
                                          </div>
                                        )}
                                        {activity.metadata.salary && (
                                          <div className="flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" />
                                            {activity.metadata.salary}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Activity summary */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {recentActivities.filter(a => a.type === 'application').length}
                            </div>
                            <div className="text-xs text-gray-600">Applications</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-red-600">
                              {recentActivities.filter(a => a.type === 'saved_job').length}
                            </div>
                            <div className="text-xs text-gray-600">Jobs Saved</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {recentActivities.filter(a => a.type === 'profile_update').length}
                            </div>
                            <div className="text-xs text-gray-600">Profile Updates</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="relative">
                        <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Plus className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h4>
                      <p className="text-gray-600 mb-4">Start your job search journey to see your activity timeline</p>
                      <div className="flex justify-center gap-3">
                        <Link
                          to="/jobs"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Browse Jobs
                        </Link>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          Complete Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Match Scores */}
                {jobMatches.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Job Matches for You
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jobMatches.slice(0, 4).map(match => (
                        <div key={match.job_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{match.job_title}</h4>
                              <p className="text-sm text-gray-600">{match.company_name}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${
                                match.match_score >= 80 ? 'text-green-600' :
                                match.match_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {match.match_score}%
                              </div>
                              <div className="text-xs text-gray-500">Match</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {match.matching_skills.length > 0 && (
                              <div>
                                <div className="text-xs text-green-600 font-medium mb-1">Matching Skills:</div>
                                <div className="flex flex-wrap gap-1">
                                  {match.matching_skills.slice(0, 3).map(skill => (
                                    <span key={skill} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                      {skill}
                                    </span>
                                  ))}
                                  {match.matching_skills.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                      +{match.matching_skills.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {match.missing_skills.length > 0 && (
                              <div>
                                <div className="text-xs text-orange-600 font-medium mb-1">Skills to Learn:</div>
                                <div className="flex flex-wrap gap-1">
                                  {match.missing_skills.slice(0, 2).map(skill => (
                                    <span key={skill} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                                      {skill}
                                    </span>
                                  ))}
                                  {match.missing_skills.length > 2 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                      +{match.missing_skills.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              {match.location} • {match.salary_range}
                            </div>
                            <Link
                              to={`/jobs/${match.job_id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Job
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                    {jobMatches.length > 4 && (
                      <div className="text-center mt-4">
                        <Link
                          to="/jobs"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View all {jobMatches.length} matches
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Advanced Analytics Grid */}
                {!loadingAnalytics && (applicationTrends.length > 0 || skillGaps.length > 0 || industryInsights.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Application Trends */}
                    {applicationTrends.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          Application Trends
                        </h3>
                        <div className="space-y-3">
                          {applicationTrends.slice(0, 5).map((trend, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">{trend.date}</div>
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <span className="font-medium">{trend.applications}</span> apps
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">{trend.responses}</span> responses
                                </div>
                                <div className={`text-sm font-medium ${
                                  trend.success_rate >= 20 ? 'text-green-600' :
                                  trend.success_rate >= 10 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {trend.success_rate}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skill Gap Analysis */}
                    {skillGaps.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-purple-600" />
                          Skill Gap Analysis
                        </h3>
                        <div className="space-y-3">
                          {skillGaps.slice(0, 5).map((gap, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{gap.skill}</div>
                                <div className="text-xs text-gray-500">
                                  Your level: {gap.user_proficiency}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-medium ${
                                  gap.market_demand === 'critical' ? 'text-red-600' :
                                  gap.market_demand === 'high' ? 'text-orange-600' :
                                  gap.market_demand === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {gap.market_demand} demand
                                </div>
                                <div className="text-xs text-gray-500">
                                  Score: {gap.demand_score}/100
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Industry Insights */}
                {industryInsights.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                      Industry Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {industryInsights.map((insight, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">{insight.industry}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Applications:</span>
                              <span className="font-medium">{insight.applications_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Success Rate:</span>
                              <span className={`font-medium ${
                                insight.success_rate >= 20 ? 'text-green-600' :
                                insight.success_rate >= 10 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {insight.success_rate}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Salary:</span>
                              <span className="font-medium">${insight.avg_salary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Growth:</span>
                              <span className={`font-medium ${
                                insight.growth_rate > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {insight.growth_rate > 0 ? '+' : ''}{insight.growth_rate}%
                              </span>
                            </div>
                          </div>
                          {insight.trending_skills.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs text-gray-600 mb-1">Trending Skills:</div>
                              <div className="flex flex-wrap gap-1">
                                {insight.trending_skills.slice(0, 3).map(skill => (
                                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Career Progression */}
                {careerProgression && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Career Progression
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Current Level</div>
                            <div className="text-lg font-medium text-gray-900">{careerProgression.current_level}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Next Level</div>
                            <div className="text-lg font-medium text-blue-600">{careerProgression.next_level}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-2">Progress to Next Level</div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${careerProgression.progress_percentage}%` }}
                              />
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{careerProgression.progress_percentage}% complete</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Estimated Timeline</div>
                            <div className="text-lg font-medium text-gray-900">{careerProgression.estimated_timeline}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Salary Projection</div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-sm">Current:</span>
                                <span className="font-medium">${careerProgression.salary_projection.current.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Target:</span>
                                <span className="font-medium text-green-600">${careerProgression.salary_projection.target.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Increase:</span>
                                <span className="font-medium text-green-600">+{careerProgression.salary_projection.increase_percentage}%</span>
                              </div>
                            </div>
                          </div>
                          {careerProgression.required_skills.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-600 mb-2">Skills Needed</div>
                              <div className="flex flex-wrap gap-1">
                                {careerProgression.required_skills.map(skill => (
                                  <span key={skill} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Optimization */}
                {profileOptimization && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-600" />
                      Profile Optimization
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-blue-600">{profileOptimization.overall_score}/100</div>
                          <div className="text-sm text-gray-600">Optimization Score</div>
                        </div>
                        
                        {profileOptimization.strength_areas.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-medium text-green-600 mb-2">Strengths</div>
                            <div className="space-y-1">
                              {profileOptimization.strength_areas.map(area => (
                                <div key={area} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  {area}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {profileOptimization.missing_sections.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-red-600 mb-2">Missing Sections</div>
                            <div className="space-y-1">
                              {profileOptimization.missing_sections.map(section => (
                                <div key={section} className="flex items-center gap-2 text-sm">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  {section}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-3">Optimization Suggestions</div>
                        <div className="space-y-3">
                          {profileOptimization.suggestions.slice(0, 4).map(suggestion => (
                            <div key={suggestion.id} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-sm font-medium text-gray-900">{suggestion.title}</div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  suggestion.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                  suggestion.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {suggestion.priority}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">{suggestion.description}</div>
                              {suggestion.action_url && (
                                <button
                                  onClick={() => setActiveTab('profile')}
                                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                                >
                                  Take Action
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Application Analytics */}
                {applications.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      Application Analytics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{getApplicationAnalytics().responseRate}%</div>
                        <div className="text-sm text-gray-600">Response Rate</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {applications.filter(app => app.status !== 'pending').length} of {applications.length} responded
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{getApplicationAnalytics().avgResponseTime}</div>
                        <div className="text-sm text-gray-600">Avg Response Time (days)</div>
                        <div className="text-xs text-gray-500 mt-1">Based on recent applications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {Math.round((applications.filter(app => app.status === 'shortlisted' || app.status === 'hired').length / applications.length) * 100) || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                        <div className="text-xs text-gray-500 mt-1">Shortlisted or hired</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'applications' ? (
              <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                    <p className="text-gray-600 mb-4">Start applying to jobs to see your applications here.</p>
                    <Link
                      to="/jobs"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Browse Jobs
                    </Link>
                  </div>
                ) : (
                  filteredApplications.map(application => (
                    <div key={application.id} className={`border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${selectedApplications.includes(application.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-4">
                        {activeTab === 'applications' && (
                          <div className="flex items-center pt-1">
                            <input
                              type="checkbox"
                              checked={selectedApplications.includes(application.id)}
                              onChange={() => toggleApplicationSelection(application.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{application.job_title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(application.status)}`}>
                              {getStatusIcon(application.status)}
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {application.company_name}
                            </div>
                            {application.job_location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {application.job_location}
                              </div>
                            )}
                            {application.salary_range && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {application.salary_range}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Applied {new Date(application.applied_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                            {application.cover_letter}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/job/${application.job_id}`}
                            className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                            title="View Job Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          
                          {application.resume_url && (
                            <a
                              href={application.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50"
                              title="View Resume"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          
                          {application.status === 'pending' && (
                            <button
                              onClick={() => withdrawApplication(application.id)}
                              className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                              title="Withdraw Application"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'saved' ? (
              <div className="space-y-4">
                {filteredSavedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs found</h3>
                    <p className="text-gray-600 mb-4">Save jobs you're interested in to view them here.</p>
                    <Link
                      to="/jobs"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Browse Jobs
                    </Link>
                  </div>
                ) : (
                  filteredSavedJobs.map(job => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {job.company_name || job.client_name}
                            </div>
                            {job.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </div>
                            )}
                            {job.budget && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {job.budget}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Saved {new Date(job.saved_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {job.is_posted_job ? (
                            <>
                              <Link
                                to={`/job/${job.job_id}`}
                                className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                                title="View Job Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                to={`/apply/${job.job_id}`}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                              >
                                Apply
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                to={`/job-details/${job.job_id}`}
                                className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                                title="View Job Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              {job.source_url && (
                                <a
                                  href={job.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50"
                                  title="View on Original Site"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </>
                          )}
                          
                          <button
                            onClick={() => removeSavedJob(job.id)}
                            className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                            title="Remove from Saved"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="max-w-4xl">
                {profile ? (
                  <div className="space-y-8">
                    {/* Profile Header with Completion */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{profile.full_name}</h3>
                          <p className="text-gray-600">{profile.experience_level || 'Experience level not set'}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">Profile Strength:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProfileStrength(profileCompletion).color}`}>
                              {getProfileStrength(profileCompletion).label}
                            </span>
                          </div>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${profileCompletion}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 mt-1">{profileCompletion}% Complete</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setEditingProfile(!editingProfile)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            {editingProfile ? 'Cancel Edit' : 'Edit Profile'}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Visibility:</span>
                            <select
                              value={profile.profile_visibility || 'public'}
                              onChange={(e) => {
                                // Handle visibility change
                                toast.success('Profile visibility updated');
                              }}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                            </select>
                          </div>
                        </div>
                        
                        {profileCompletion < 100 && (
                          <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                            <span className="font-medium">Tip:</span> Complete your profile to attract more employers
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {editingProfile ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                              type="text"
                              value={profileForm.full_name || ''}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="tel"
                              value={profileForm.phone || ''}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                              type="text"
                              value={profileForm.location || ''}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                            <select
                              value={profileForm.experience_level || ''}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, experience_level: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select level</option>
                              <option value="entry">Entry Level</option>
                              <option value="mid">Mid Level</option>
                              <option value="senior">Senior Level</option>
                              <option value="lead">Lead/Principal</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                          <textarea
                            value={profileForm.bio || ''}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                          <input
                            type="text"
                            value={profileForm.skills?.join(', ') || ''}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="JavaScript, React, Node.js, etc."
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
                            <input
                              type="url"
                              value={profileForm.portfolio_url || ''}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://yourportfolio.com"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                            <input
                              type="url"
                              value={profileForm.linkedin_url || ''}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://linkedin.com/in/yourprofile"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                            <input
                              type="url"
                              value={profileForm.github_url || ''}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, github_url: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://github.com/yourusername"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                            <input
                              type="url"
                              value={profileForm.website_url || ''}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, website_url: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://yourwebsite.com"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          <button
                            onClick={updateProfile}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingProfile(false);
                              setProfileForm(profile);
                            }}
                            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h4>
                            <div className="space-y-2">
                              <p><span className="font-medium">Name:</span> {profile.full_name}</p>
                              <p><span className="font-medium">Email:</span> {profile.email}</p>
                              {profile.phone && <p><span className="font-medium">Phone:</span> {profile.phone}</p>}
                              {profile.location && <p><span className="font-medium">Location:</span> {profile.location}</p>}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Professional Information</h4>
                            <div className="space-y-2">
                              {profile.experience_level && (
                                <p><span className="font-medium">Experience:</span> {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)} Level</p>
                              )}
                              {profile.resume_url && (
                                <p>
                                  <span className="font-medium">Resume:</span>
                                  <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 ml-2">
                                    View Resume
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {profile.bio && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Bio</h4>
                            <p className="text-gray-600">{profile.bio}</p>
                          </div>
                        )}
                        
                        {profile.skills && profile.skills.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {profile.skills.map((skill, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-4">
                          {profile.portfolio_url && (
                            <a
                              href={profile.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Globe className="h-4 w-4" />
                              Portfolio
                            </a>
                          )}
                          {profile.linkedin_url && (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Linkedin className="h-4 w-4" />
                              LinkedIn
                            </a>
                          )}
                          {profile.github_url && (
                            <a
                              href={profile.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Github className="h-4 w-4" />
                              GitHub
                            </a>
                          )}
                          {profile.website_url && (
                            <a
                              href={profile.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Globe className="h-4 w-4" />
                              Website
                            </a>
                          )}
                        </div>
                        
                        {/* Notification Preferences Section */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <Bell className="h-6 w-6 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                            </div>
                            <Settings className="h-5 w-5 text-gray-400" />
                          </div>
                          
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Email Notifications */}
                              <div className="space-y-4">
                                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  Email Notifications
                                </h4>
                                
                                <div className="space-y-3 pl-4">
                                  <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">General email notifications</span>
                                    <input
                                      type="checkbox"
                                      checked={notificationSettings.email_notifications}
                                      onChange={(e) => updateNotificationSettings('email_notifications', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </label>
                                  
                                  <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Job alerts and recommendations</span>
                                    <input
                                      type="checkbox"
                                      checked={notificationSettings.job_alerts}
                                      onChange={(e) => updateNotificationSettings('job_alerts', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </label>
                                  
                                  <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Application status updates</span>
                                    <input
                                      type="checkbox"
                                      checked={notificationSettings.application_updates}
                                      onChange={(e) => updateNotificationSettings('application_updates', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </label>
                                  
                                  <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Marketing and promotional emails</span>
                                    <input
                                      type="checkbox"
                                      checked={notificationSettings.marketing_emails}
                                      onChange={(e) => updateNotificationSettings('marketing_emails', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </label>
                                </div>
                              </div>
                              
                              {/* Push Notifications */}
                              <div className="space-y-4">
                                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Push Notifications
                                </h4>
                                
                                <div className="space-y-3 pl-4">
                                  <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">New job matches</span>
                                    <input
                                      type="checkbox"
                                      checked={notificationSettings.push_job_matches || false}
                                      onChange={(e) => updateNotificationSettings('push_job_matches', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </label>
                                  
                                  <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Application deadlines</span>
                                    <input
                                      type="checkbox"
                                      checked={notificationSettings.push_deadlines || false}
                                      onChange={(e) => updateNotificationSettings('push_deadlines', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </label>
                                  
                                  <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Profile views by employers</span>
                                    <input
                                      type="checkbox"
                                      checked={notificationSettings.push_profile_views || false}
                                      onChange={(e) => updateNotificationSettings('push_profile_views', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </label>
                                  
                                  <label className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Weekly activity summary</span>
                                    <input
                                      type="checkbox"
                                      checked={notificationSettings.push_weekly_summary || false}
                                      onChange={(e) => updateNotificationSettings('push_weekly_summary', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                            
                            {/* Frequency Settings */}
                            <div className="border-t pt-6">
                              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                Notification Frequency
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Job Alerts</label>
                                  <select
                                    value={notificationSettings.job_alert_frequency || 'daily'}
                                    onChange={(e) => updateNotificationSettings('job_alert_frequency', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="immediate">Immediate</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="never">Never</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Application Updates</label>
                                  <select
                                    value={notificationSettings.application_update_frequency || 'immediate'}
                                    onChange={(e) => updateNotificationSettings('application_update_frequency', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="immediate">Immediate</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="never">Never</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Marketing Emails</label>
                                  <select
                                    value={notificationSettings.marketing_frequency || 'weekly'}
                                    onChange={(e) => updateNotificationSettings('marketing_frequency', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="never">Never</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            
                            {/* Quick Actions */}
                            <div className="border-t pt-6">
                              <div className="flex flex-wrap gap-3">
                                <button
                                  onClick={() => {
                                    const allOn = {
                                      email_notifications: true,
                                      job_alerts: true,
                                      application_updates: true,
                                      marketing_emails: false,
                                      push_job_matches: true,
                                      push_deadlines: true,
                                      push_profile_views: true,
                                      push_weekly_summary: true,
                                      job_alert_frequency: 'daily',
                                      application_update_frequency: 'immediate',
                                      marketing_frequency: 'never'
                                    };
                                    setNotificationSettings(allOn);
                                    toast.success('Enabled recommended notifications');
                                  }}
                                  className="text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  Enable Recommended
                                </button>
                                
                                <button
                                  onClick={() => {
                                    const allOff = {
                                      email_notifications: false,
                                      job_alerts: false,
                                      application_updates: true, // Keep this for important updates
                                      marketing_emails: false,
                                      push_job_matches: false,
                                      push_deadlines: false,
                                      push_profile_views: false,
                                      push_weekly_summary: false,
                                      job_alert_frequency: 'never',
                                      application_update_frequency: 'immediate',
                                      marketing_frequency: 'never'
                                    };
                                    setNotificationSettings(allOff);
                                    toast.success('Disabled most notifications');
                                  }}
                                  className="text-sm bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  Minimal Notifications
                                </button>
                                
                                <button
                                  onClick={() => {
                                    // Reset to default
                                    const defaults = {
                                      email_notifications: true,
                                      job_alerts: true,
                                      application_updates: true,
                                      marketing_emails: false,
                                      push_job_matches: false,
                                      push_deadlines: false,
                                      push_profile_views: false,
                                      push_weekly_summary: false,
                                      job_alert_frequency: 'daily',
                                      application_update_frequency: 'immediate',
                                      marketing_frequency: 'never'
                                    };
                                    setNotificationSettings(defaults);
                                    toast.success('Reset to default settings');
                                  }}
                                  className="text-sm bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  Reset to Defaults
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Complete your profile</h3>
                    <p className="text-gray-600 mb-4">Add your information to help employers find you.</p>
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Profile
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;