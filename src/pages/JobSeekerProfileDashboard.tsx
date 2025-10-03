import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { apiCall } from '../utils/api';
import { toast } from 'sonner';
import {
  UserIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  StarIcon,
  ChartBarIcon,
  CameraIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  TrophyIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  LinkIcon,
  DocumentArrowUpIcon,
  ChevronRightIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BeakerIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// Interfaces
interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  resume_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  availability?: 'immediate' | 'two_weeks' | 'one_month' | 'flexible';
  work_authorization?: string;
  remote_preference?: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  profile_completion?: number;
  created_at: string;
  updated_at: string;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string;
  location?: string;
  achievements?: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  gpa?: number;
  achievements?: string[];
}

interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'technical' | 'soft' | 'language' | 'certification';
  verified: boolean;
  endorsements?: number;
}

interface Portfolio {
  id: string;
  title: string;
  description: string;
  url?: string;
  image_url?: string;
  technologies: string[];
  category: 'web' | 'mobile' | 'desktop' | 'design' | 'other';
  featured: boolean;
}

interface SkillGap {
  skill: string;
  importance: number;
  current_level: number;
  target_level: number;
  learning_resources: string[];
}

interface CareerGoal {
  id: string;
  title: string;
  description: string;
  target_date: string;
  progress: number;
  milestones: string[];
}

import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { apiCall } from '../utils/api';
import { toast } from 'sonner';
import { isFeatureEnabled } from '../config/featureFlags';
import ComingSoon from '../components/ComingSoon';

const JobSeekerProfileDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [careerGoals, setCareerGoals] = useState<CareerGoal[]>([]);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Mock data for demonstration
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Mock profile data
        const mockProfile: UserProfile = {
          id: user?.id || '1',
          full_name: 'Sarah Johnson',
          email: user?.email || 'sarah.johnson@email.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          bio: 'Passionate full-stack developer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies.',
          avatar_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20confident%20female%20software%20developer%20with%20modern%20office%20background&image_size=square',
          resume_url: '/resume.pdf',
          portfolio_url: 'https://sarahjohnson.dev',
          linkedin_url: 'https://linkedin.com/in/sarahjohnson',
          github_url: 'https://github.com/sarahjohnson',
          website_url: 'https://sarahjohnson.dev',
          desired_salary_min: 120000,
          desired_salary_max: 160000,
          availability: 'two_weeks',
          work_authorization: 'US Citizen',
          remote_preference: 'hybrid',
          profile_completion: 85,
          created_at: '2023-01-15',
          updated_at: '2024-01-15'
        };

        const mockWorkExperience: WorkExperience[] = [
          {
            id: '1',
            company: 'TechCorp Inc.',
            position: 'Senior Full Stack Developer',
            start_date: '2022-03',
            current: true,
            description: 'Lead development of customer-facing web applications using React and Node.js. Managed a team of 3 junior developers.',
            location: 'San Francisco, CA',
            achievements: ['Increased application performance by 40%', 'Led migration to microservices architecture', 'Mentored 5 junior developers']
          },
          {
            id: '2',
            company: 'StartupXYZ',
            position: 'Full Stack Developer',
            start_date: '2020-01',
            end_date: '2022-02',
            current: false,
            description: 'Developed and maintained multiple web applications for various clients using modern JavaScript frameworks.',
            location: 'Remote',
            achievements: ['Built 8 production applications', 'Reduced deployment time by 60%', 'Implemented CI/CD pipelines']
          }
        ];

        const mockEducation: Education[] = [
          {
            id: '1',
            institution: 'University of California, Berkeley',
            degree: 'Bachelor of Science',
            field_of_study: 'Computer Science',
            start_date: '2016-09',
            end_date: '2020-05',
            current: false,
            gpa: 3.8,
            achievements: ['Magna Cum Laude', 'Dean\'s List 6 semesters', 'Computer Science Honor Society']
          }
        ];

        const mockSkills: Skill[] = [
          { id: '1', name: 'React', level: 'expert', category: 'technical', verified: true, endorsements: 15 },
          { id: '2', name: 'Node.js', level: 'advanced', category: 'technical', verified: true, endorsements: 12 },
          { id: '3', name: 'TypeScript', level: 'advanced', category: 'technical', verified: false, endorsements: 8 },
          { id: '4', name: 'Leadership', level: 'intermediate', category: 'soft', verified: false, endorsements: 6 },
          { id: '5', name: 'AWS', level: 'intermediate', category: 'technical', verified: true, endorsements: 10 }
        ];

        const mockPortfolio: Portfolio[] = [
          {
            id: '1',
            title: 'E-commerce Platform',
            description: 'Full-stack e-commerce solution with React frontend and Node.js backend',
            url: 'https://github.com/sarahjohnson/ecommerce',
            image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20ecommerce%20website%20interface%20with%20clean%20design&image_size=landscape_16_9',
            technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
            category: 'web',
            featured: true
          },
          {
            id: '2',
            title: 'Task Management App',
            description: 'Collaborative task management application with real-time updates',
            url: 'https://github.com/sarahjohnson/taskmanager',
            image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=task%20management%20dashboard%20interface%20with%20kanban%20boards&image_size=landscape_16_9',
            technologies: ['Vue.js', 'Express', 'Socket.io', 'PostgreSQL'],
            category: 'web',
            featured: true
          }
        ];

        const mockSkillGaps: SkillGap[] = [
          {
            skill: 'Machine Learning',
            importance: 8,
            current_level: 2,
            target_level: 6,
            learning_resources: ['Coursera ML Course', 'Kaggle Competitions', 'Python for ML Book']
          },
          {
            skill: 'DevOps',
            importance: 7,
            current_level: 4,
            target_level: 7,
            learning_resources: ['Docker Documentation', 'Kubernetes Course', 'AWS DevOps Certification']
          }
        ];

        const mockCareerGoals: CareerGoal[] = [
          {
            id: '1',
            title: 'Become a Tech Lead',
            description: 'Lead a team of 5+ developers and drive technical decisions',
            target_date: '2024-12-31',
            progress: 65,
            milestones: ['Complete leadership training', 'Mentor 2 junior developers', 'Lead major project']
          },
          {
            id: '2',
            title: 'Master Cloud Architecture',
            description: 'Become proficient in designing scalable cloud solutions',
            target_date: '2024-06-30',
            progress: 40,
            milestones: ['AWS Solutions Architect Certification', 'Design microservices architecture', 'Implement serverless solutions']
          }
        ];

        setProfile(mockProfile);
        setWorkExperience(mockWorkExperience);
        setEducation(mockEducation);
        setSkills(mockSkills);
        setPortfolio(mockPortfolio);
        setSkillGaps(mockSkillGaps);
        setCareerGoals(mockCareerGoals);
        setEditForm(mockProfile);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      // In a real app, this would make an API call to update the profile
      setProfile({ ...profile!, ...editForm });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const getProfileCompletionColor = (completion: number) => {
    if (completion >= 80) return 'text-green-600';
    if (completion >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Chart data
  const skillsChartData = {
    labels: skills.map(skill => skill.name),
    datasets: [{
      label: 'Skill Level',
      data: skills.map(skill => {
        switch (skill.level) {
          case 'expert': return 4;
          case 'advanced': return 3;
          case 'intermediate': return 2;
          default: return 1;
        }
      }),
      backgroundColor: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
    }]
  };

  const skillGapChartData = {
    labels: skillGaps.map(gap => gap.skill),
    datasets: [
      {
        label: 'Current Level',
        data: skillGaps.map(gap => gap.current_level),
        backgroundColor: '#EF4444'
      },
      {
        label: 'Target Level',
        data: skillGaps.map(gap => gap.target_level),
        backgroundColor: '#10B981'
      }
    ]
  };

  const careerProgressData = {
    labels: careerGoals.map(goal => goal.title),
    datasets: [{
      label: 'Progress (%)',
      data: careerGoals.map(goal => goal.progress),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'experience', name: 'Experience', icon: BriefcaseIcon },
    { id: 'education', name: 'Education', icon: AcademicCapIcon },
    { id: 'skills', name: 'Skills', icon: StarIcon },
    { id: 'portfolio', name: 'Portfolio', icon: DocumentTextIcon },
    { id: 'optimization', name: 'Optimization', icon: ChartBarIcon },
    { id: 'career', name: 'Career Goals', icon: TrophyIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Coming Soon Overlay */}
      {!isFeatureEnabled('jobSeekerProfile') && (
        <ComingSoon
          title="Profile Management Coming Soon"
          description="We're working on an enhanced profile management system with advanced features for job seekers."
          variant="overlay"
        />
      )}
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your professional profile and career development
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`text-sm font-medium ${getProfileCompletionColor(profile?.profile_completion || 0)}`}>
                  {profile?.profile_completion}% Complete
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profile?.profile_completion || 0}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              {isEditing && (
                <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                  <CameraIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.full_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 bg-transparent focus:outline-none w-full"
                    placeholder="Full Name"
                  />
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    className="w-full text-gray-600 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Professional Bio"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Location"
                    />
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h2>
                  <p className="mt-2 text-gray-600">{profile?.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="flex items-center gap-1">
                        <PhoneIcon className="h-4 w-4" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{profile?.email}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile?.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        LinkedIn
                      </a>
                    )}
                    {profile?.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        GitHub
                      </a>
                    )}
                    {profile?.website_url && (
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{workExperience.length}</div>
                    <div className="text-sm text-gray-500">Work Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{skills.length}</div>
                    <div className="text-sm text-gray-500">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{portfolio.length}</div>
                    <div className="text-sm text-gray-500">Portfolio Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{profile?.profile_completion}%</div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Resume updated</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <StarIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New skill added: TypeScript</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrophyIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Career goal milestone reached</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Profile Completion */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Completion</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Basic Info</span>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Work Experience</span>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Skills</span>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Portfolio</span>
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Certifications</span>
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Upload Resume</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <SparklesIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Optimize Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RocketLaunchIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Find Jobs</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Skills List */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">My Skills</h3>
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Skill
                  </button>
                </div>
                <div className="space-y-3">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{skill.name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSkillLevelColor(skill.level)}`}>
                          {skill.level}
                        </span>
                        {skill.verified && (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{skill.endorsements} endorsements</span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Skills Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Overview</h3>
                <div className="h-64">
                  <Bar data={skillsChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Skill Recommendations */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Skills</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">Docker</span>
                      <p className="text-sm text-gray-600">High demand in your field</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Add
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">GraphQL</span>
                      <p className="text-sm text-gray-600">Trending technology</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Skill Gap Analysis */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Gap Analysis</h3>
                <div className="h-64 mb-4">
                  <Bar data={skillGapChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
                <div className="space-y-3">
                  {skillGaps.map((gap, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{gap.skill}</span>
                        <span className="text-sm text-gray-500">Importance: {gap.importance}/10</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Current: {gap.current_level}/10 → Target: {gap.target_level}/10
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {gap.learning_resources.map((resource, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {resource}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Profile Optimization Tips */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Tips</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Add more portfolio projects</p>
                      <p className="text-sm text-gray-600">Showcase 3-5 diverse projects to stand out</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <BeakerIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Get skill endorsements</p>
                      <p className="text-sm text-gray-600">Ask colleagues to endorse your key skills</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <BookOpenIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Add certifications</p>
                      <p className="text-sm text-gray-600">Include relevant certifications to boost credibility</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ATS Score */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ATS Compatibility Score</h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-green-600">78</div>
                  <div className="text-sm text-gray-500">Out of 100</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Keywords</span>
                    <span className="text-green-600">Good</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Format</span>
                    <span className="text-green-600">Excellent</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Contact Info</span>
                    <span className="text-yellow-600">Needs Work</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Skills Section</span>
                    <span className="text-green-600">Good</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'career' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Career Goals */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Career Goals</h3>
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Goal
                  </button>
                </div>
                <div className="space-y-4">
                  {careerGoals.map((goal) => (
                    <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        <span className="text-sm text-gray-500">{goal.progress}%</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Target: {goal.target_date}</span>
                        <button className="text-blue-600 hover:text-blue-700">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Career Progress Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Tracking</h3>
                <div className="h-64">
                  <Line data={careerProgressData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Career Insights */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Insights</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrophyIcon className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900">Strength</span>
                    </div>
                    <p className="text-sm text-gray-600">Strong technical skills in modern web technologies</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <ClockIcon className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-gray-900">Opportunity</span>
                    </div>
                    <p className="text-sm text-gray-600">Leadership roles are in high demand for your skill set</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <RocketLaunchIcon className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-900">Next Step</span>
                    </div>
                    <p className="text-sm text-gray-600">Consider pursuing cloud architecture certifications</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tab contents would go here */}
        {activeTab === 'experience' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Experience
              </button>
            </div>
            <div className="space-y-6">
              {workExperience.map((exp) => (
                <div key={exp.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{exp.position}</h4>
                      <p className="text-blue-600 font-medium">{exp.company}</p>
                      <p className="text-sm text-gray-500">{exp.location}</p>
                      <p className="text-sm text-gray-500">
                        {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-gray-600">{exp.description}</p>
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Key Achievements:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Education
              </button>
            </div>
            <div className="space-y-6">
              {education.map((edu) => (
                <div key={edu.id} className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{edu.degree}</h4>
                      <p className="text-green-600 font-medium">{edu.institution}</p>
                      <p className="text-sm text-gray-500">{edu.field_of_study}</p>
                      <p className="text-sm text-gray-500">
                        {edu.start_date} - {edu.current ? 'Present' : edu.end_date}
                      </p>
                      {edu.gpa && (
                        <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>
                      )}
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {edu.achievements && edu.achievements.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Achievements:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {edu.achievements.map((achievement, idx) => (
                          <li key={idx}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{item.title}</h4>
                    {item.featured && (
                      <StarIcon className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.technologies.map((tech, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 capitalize">{item.category}</span>
                    <div className="flex gap-2">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center">
              <PlusIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Add Portfolio Item</h4>
              <p className="text-gray-500 text-sm">Showcase your best work</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSeekerProfileDashboard;