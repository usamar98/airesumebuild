// Demo Data Generator for ApplicantDashboard Testing
// This file generates realistic test data for manual testing of all dashboard features

export interface DemoApplication {
  id: string;
  job_title: string;
  company: string;
  status: 'pending' | 'interview' | 'rejected' | 'accepted';
  applied_date: string;
  location: string;
  salary_range: string;
  job_type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  response_date?: string;
  interview_date?: string;
  notes?: string;
}

export interface DemoJobMatch {
  id: string;
  job_title: string;
  company: string;
  match_score: number;
  location: string;
  salary_range: string;
  key_skills: string[];
  missing_skills: string[];
  posted_date: string;
  job_type: string;
  description: string;
  requirements: string[];
  benefits: string[];
}

export interface DemoSavedJob {
  id: string;
  job_title: string;
  company: string;
  location: string;
  salary_range: string;
  saved_date: string;
  job_type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  job_url: string;
}

export interface DemoActivityItem {
  id: string;
  type: 'application' | 'profile_update' | 'job_saved' | 'interview_scheduled' | 'message_received';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    company?: string;
    location?: string;
    salary?: string;
    job_title?: string;
  };
}

export interface DemoApplicationTrend {
  month: string;
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
}

export interface DemoSkillGap {
  skill: string;
  current_level: number;
  market_demand: number;
  gap_score: number;
  learning_resources: string[];
  job_count: number;
}

export interface DemoIndustryInsight {
  industry: string;
  growth_rate: number;
  avg_salary: string;
  job_openings: number;
  top_skills: string[];
  trending_roles: string[];
}

export interface DemoCareerMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'education' | 'certification' | 'promotion' | 'project' | 'achievement';
  status: 'completed' | 'in_progress' | 'planned';
}

export interface DemoOptimizationSuggestion {
  id: string;
  category: 'profile' | 'skills' | 'experience' | 'education' | 'portfolio';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

// Generate realistic demo applications
export const generateDemoApplications = (): DemoApplication[] => [
  {
    id: '1',
    job_title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    status: 'interview',
    applied_date: '2024-01-15',
    location: 'San Francisco, CA',
    salary_range: '$120,000 - $150,000',
    job_type: 'Full-time',
    description: 'Looking for an experienced frontend developer to join our growing team. You will be responsible for building scalable web applications using React and TypeScript.',
    requirements: ['React', 'TypeScript', 'Node.js', 'CSS', 'Git'],
    benefits: ['Health Insurance', '401k', 'Remote Work', 'Stock Options'],
    response_date: '2024-01-18',
    interview_date: '2024-01-25',
    notes: 'Technical interview scheduled with the engineering team'
  },
  {
    id: '2',
    job_title: 'React Developer',
    company: 'StartupXYZ',
    status: 'pending',
    applied_date: '2024-01-20',
    location: 'New York, NY',
    salary_range: '$90,000 - $120,000',
    job_type: 'Full-time',
    description: 'Join our innovative startup as a React developer. Work on cutting-edge projects with a dynamic team.',
    requirements: ['React', 'JavaScript', 'CSS', 'Redux', 'Jest'],
    benefits: ['Flexible Hours', 'Stock Options', 'Learning Budget']
  },
  {
    id: '3',
    job_title: 'Full Stack Engineer',
    company: 'InnovateTech',
    status: 'accepted',
    applied_date: '2024-01-05',
    location: 'Remote',
    salary_range: '$110,000 - $140,000',
    job_type: 'Full-time',
    description: 'Remote full stack position working with modern technologies. Build end-to-end solutions for our clients.',
    requirements: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
    benefits: ['Remote Work', 'Health Insurance', 'Unlimited PTO'],
    response_date: '2024-01-08',
    interview_date: '2024-01-12',
    notes: 'Offer accepted! Starting February 1st'
  },
  {
    id: '4',
    job_title: 'Frontend Engineer',
    company: 'DesignCorp',
    status: 'rejected',
    applied_date: '2024-01-10',
    location: 'Los Angeles, CA',
    salary_range: '$95,000 - $125,000',
    job_type: 'Full-time',
    description: 'Frontend engineer role focusing on user experience and modern web technologies.',
    requirements: ['React', 'CSS', 'JavaScript', 'Figma', 'Webpack'],
    benefits: ['Health Insurance', 'Dental', 'Vision', 'Gym Membership'],
    response_date: '2024-01-14',
    notes: 'Position filled by internal candidate'
  },
  {
    id: '5',
    job_title: 'UI/UX Developer',
    company: 'CreativeStudio',
    status: 'pending',
    applied_date: '2024-01-22',
    location: 'Austin, TX',
    salary_range: '$85,000 - $110,000',
    job_type: 'Full-time',
    description: 'Hybrid role combining UI development with UX design. Perfect for creative developers.',
    requirements: ['React', 'CSS', 'JavaScript', 'Adobe Creative Suite', 'Figma'],
    benefits: ['Creative Environment', 'Flexible Schedule', 'Professional Development']
  }
];

// Generate job matches with realistic scores
export const generateDemoJobMatches = (): DemoJobMatch[] => [
  {
    id: '1',
    job_title: 'Senior React Developer',
    company: 'TechGiant Corp',
    match_score: 95,
    location: 'Seattle, WA',
    salary_range: '$130,000 - $160,000',
    key_skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    missing_skills: ['GraphQL'],
    posted_date: '2024-01-23',
    job_type: 'Full-time',
    description: 'Lead React developer position at a Fortune 500 company. Work on large-scale applications.',
    requirements: ['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL'],
    benefits: ['Excellent Benefits', 'Stock Options', 'Remote Work', '401k Match']
  },
  {
    id: '2',
    job_title: 'Frontend Architect',
    company: 'InnovateNow',
    match_score: 88,
    location: 'Remote',
    salary_range: '$140,000 - $170,000',
    key_skills: ['React', 'TypeScript', 'System Design'],
    missing_skills: ['Micro-frontends', 'Kubernetes'],
    posted_date: '2024-01-22',
    job_type: 'Full-time',
    description: 'Senior architect role designing frontend systems for enterprise applications.',
    requirements: ['React', 'TypeScript', 'System Design', 'Micro-frontends', 'Kubernetes'],
    benefits: ['Remote First', 'High Compensation', 'Learning Budget', 'Conference Attendance']
  },
  {
    id: '3',
    job_title: 'Full Stack Developer',
    company: 'StartupHub',
    match_score: 82,
    location: 'San Francisco, CA',
    salary_range: '$100,000 - $130,000',
    key_skills: ['React', 'Node.js', 'JavaScript'],
    missing_skills: ['Python', 'Django'],
    posted_date: '2024-01-21',
    job_type: 'Full-time',
    description: 'Join a fast-growing startup as a full stack developer. Wear many hats and grow with the company.',
    requirements: ['React', 'Node.js', 'JavaScript', 'Python', 'Django'],
    benefits: ['Equity', 'Flexible Hours', 'Startup Environment', 'Growth Opportunities']
  },
  {
    id: '4',
    job_title: 'React Native Developer',
    company: 'MobileFirst',
    match_score: 75,
    location: 'Chicago, IL',
    salary_range: '$95,000 - $125,000',
    key_skills: ['React', 'JavaScript', 'Mobile Development'],
    missing_skills: ['React Native', 'iOS', 'Android'],
    posted_date: '2024-01-20',
    job_type: 'Full-time',
    description: 'Mobile app developer role focusing on React Native applications.',
    requirements: ['React', 'JavaScript', 'React Native', 'iOS', 'Android'],
    benefits: ['Mobile Focus', 'Innovation', 'Team Collaboration', 'Professional Growth']
  }
];

// Generate saved jobs
export const generateDemoSavedJobs = (): DemoSavedJob[] => [
  {
    id: '1',
    job_title: 'Lead Frontend Developer',
    company: 'FutureTech',
    location: 'Boston, MA',
    salary_range: '$125,000 - $155,000',
    saved_date: '2024-01-24',
    job_type: 'Full-time',
    description: 'Lead a team of frontend developers in building next-generation web applications.',
    requirements: ['React', 'TypeScript', 'Leadership', 'Mentoring'],
    benefits: ['Leadership Role', 'Team Management', 'High Impact', 'Career Growth'],
    job_url: 'https://futuretech.com/careers/lead-frontend'
  },
  {
    id: '2',
    job_title: 'Senior JavaScript Engineer',
    company: 'WebSolutions',
    location: 'Denver, CO',
    salary_range: '$105,000 - $135,000',
    saved_date: '2024-01-23',
    job_type: 'Full-time',
    description: 'Senior JavaScript engineer role with focus on modern web technologies.',
    requirements: ['JavaScript', 'React', 'Vue.js', 'Node.js'],
    benefits: ['Modern Stack', 'Collaborative Team', 'Work-Life Balance'],
    job_url: 'https://websolutions.com/jobs/senior-js-engineer'
  },
  {
    id: '3',
    job_title: 'Frontend Consultant',
    company: 'ConsultingPro',
    location: 'Remote',
    salary_range: '$80 - $120 /hour',
    saved_date: '2024-01-22',
    job_type: 'Contract',
    description: 'Freelance frontend consulting opportunities with various clients.',
    requirements: ['React', 'TypeScript', 'Consulting Experience'],
    benefits: ['Flexible Schedule', 'High Hourly Rate', 'Diverse Projects'],
    job_url: 'https://consultingpro.com/frontend-consultant'
  }
];

// Generate activity timeline
export const generateDemoActivity = (): DemoActivityItem[] => [
  {
    id: '1',
    type: 'application',
    title: 'Applied to Senior React Developer',
    description: 'Submitted application with updated resume',
    timestamp: '2024-01-24T10:30:00Z',
    metadata: {
      company: 'TechGiant Corp',
      location: 'Seattle, WA',
      salary: '$130,000 - $160,000',
      job_title: 'Senior React Developer'
    }
  },
  {
    id: '2',
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    description: 'Technical interview with TechCorp Inc.',
    timestamp: '2024-01-23T14:15:00Z',
    metadata: {
      company: 'TechCorp Inc.',
      job_title: 'Senior Frontend Developer'
    }
  },
  {
    id: '3',
    type: 'job_saved',
    title: 'Saved Job',
    description: 'Saved Lead Frontend Developer position',
    timestamp: '2024-01-23T09:45:00Z',
    metadata: {
      company: 'FutureTech',
      location: 'Boston, MA',
      job_title: 'Lead Frontend Developer'
    }
  },
  {
    id: '4',
    type: 'profile_update',
    title: 'Profile Updated',
    description: 'Added new TypeScript certification',
    timestamp: '2024-01-22T16:20:00Z'
  },
  {
    id: '5',
    type: 'message_received',
    title: 'Message from Recruiter',
    description: 'InnovateTech recruiter interested in your profile',
    timestamp: '2024-01-22T11:30:00Z',
    metadata: {
      company: 'InnovateTech'
    }
  },
  {
    id: '6',
    type: 'application',
    title: 'Applied to UI/UX Developer',
    description: 'Submitted application with portfolio',
    timestamp: '2024-01-22T08:15:00Z',
    metadata: {
      company: 'CreativeStudio',
      location: 'Austin, TX',
      salary: '$85,000 - $110,000',
      job_title: 'UI/UX Developer'
    }
  }
];

// Generate application trends
export const generateDemoApplicationTrends = (): DemoApplicationTrend[] => [
  { month: 'Sep 2023', applications: 8, responses: 3, interviews: 1, offers: 0 },
  { month: 'Oct 2023', applications: 12, responses: 5, interviews: 2, offers: 1 },
  { month: 'Nov 2023', applications: 15, responses: 7, interviews: 3, offers: 1 },
  { month: 'Dec 2023', applications: 10, responses: 4, interviews: 2, offers: 0 },
  { month: 'Jan 2024', applications: 18, responses: 8, interviews: 4, offers: 2 }
];

// Generate skill gaps
export const generateDemoSkillGaps = (): DemoSkillGap[] => [
  {
    skill: 'GraphQL',
    current_level: 2,
    market_demand: 8,
    gap_score: 6,
    learning_resources: ['GraphQL.org Tutorial', 'Apollo Client Docs', 'Udemy GraphQL Course'],
    job_count: 245
  },
  {
    skill: 'Docker',
    current_level: 3,
    market_demand: 9,
    gap_score: 6,
    learning_resources: ['Docker Official Tutorial', 'Kubernetes Basics', 'DevOps Bootcamp'],
    job_count: 312
  },
  {
    skill: 'AWS',
    current_level: 4,
    market_demand: 9,
    gap_score: 5,
    learning_resources: ['AWS Free Tier', 'Cloud Practitioner Cert', 'Solutions Architect Path'],
    job_count: 428
  },
  {
    skill: 'Python',
    current_level: 2,
    market_demand: 7,
    gap_score: 5,
    learning_resources: ['Python.org Tutorial', 'Django Documentation', 'FastAPI Course'],
    job_count: 189
  }
];

// Generate industry insights
export const generateDemoIndustryInsights = (): DemoIndustryInsight[] => [
  {
    industry: 'Technology',
    growth_rate: 12.5,
    avg_salary: '$125,000',
    job_openings: 15420,
    top_skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker'],
    trending_roles: ['Full Stack Developer', 'DevOps Engineer', 'Cloud Architect']
  },
  {
    industry: 'Fintech',
    growth_rate: 18.3,
    avg_salary: '$135,000',
    job_openings: 8750,
    top_skills: ['React', 'Python', 'Blockchain', 'Security', 'APIs'],
    trending_roles: ['Blockchain Developer', 'Security Engineer', 'API Developer']
  },
  {
    industry: 'Healthcare Tech',
    growth_rate: 22.1,
    avg_salary: '$118,000',
    job_openings: 5630,
    top_skills: ['React', 'HIPAA Compliance', 'Data Privacy', 'APIs', 'Mobile'],
    trending_roles: ['Healthcare Software Developer', 'Telemedicine Engineer', 'Health Data Analyst']
  }
];

// Generate career milestones
export const generateDemoCareerProgression = (): DemoCareerMilestone[] => [
  {
    id: '1',
    title: 'AWS Certified Developer',
    description: 'Obtained AWS Certified Developer - Associate certification',
    date: '2024-01-15',
    type: 'certification',
    status: 'completed'
  },
  {
    id: '2',
    title: 'Senior Developer Promotion',
    description: 'Promoted to Senior Frontend Developer at current company',
    date: '2023-11-01',
    type: 'promotion',
    status: 'completed'
  },
  {
    id: '3',
    title: 'React Native Certification',
    description: 'Complete React Native certification course',
    date: '2024-03-01',
    type: 'certification',
    status: 'planned'
  },
  {
    id: '4',
    title: 'Open Source Contribution',
    description: 'Contribute to major React library (100+ stars)',
    date: '2024-02-15',
    type: 'achievement',
    status: 'in_progress'
  },
  {
    id: '5',
    title: 'Tech Lead Role',
    description: 'Transition to Technical Lead position',
    date: '2024-06-01',
    type: 'promotion',
    status: 'planned'
  }
];

// Generate optimization suggestions
export const generateDemoOptimizationSuggestions = (): DemoOptimizationSuggestion[] => [
  {
    id: '1',
    category: 'skills',
    title: 'Add GraphQL to your skillset',
    description: 'GraphQL is in high demand and appears in 60% of React job postings. Adding this skill could increase your match rate by 25%.',
    impact: 'high',
    effort: 'medium',
    priority: 1
  },
  {
    id: '2',
    category: 'portfolio',
    title: 'Showcase more full-stack projects',
    description: 'Add 2-3 full-stack projects to demonstrate end-to-end development capabilities.',
    impact: 'high',
    effort: 'high',
    priority: 2
  },
  {
    id: '3',
    category: 'profile',
    title: 'Update your bio with recent achievements',
    description: 'Mention your recent AWS certification and leadership experience to stand out.',
    impact: 'medium',
    effort: 'low',
    priority: 3
  },
  {
    id: '4',
    category: 'experience',
    title: 'Quantify your achievements',
    description: 'Add specific metrics to your work experience (e.g., "Improved page load time by 40%").',
    impact: 'medium',
    effort: 'low',
    priority: 4
  },
  {
    id: '5',
    category: 'education',
    title: 'Add relevant online courses',
    description: 'Include completed courses from platforms like Coursera, Udemy, or Pluralsight.',
    impact: 'low',
    effort: 'low',
    priority: 5
  }
];

// Main demo data generator function
export const generateAllDemoData = () => ({
  applications: generateDemoApplications(),
  jobMatches: generateDemoJobMatches(),
  savedJobs: generateDemoSavedJobs(),
  activity: generateDemoActivity(),
  applicationTrends: generateDemoApplicationTrends(),
  skillGaps: generateDemoSkillGaps(),
  industryInsights: generateDemoIndustryInsights(),
  careerProgression: generateDemoCareerProgression(),
  optimizationSuggestions: generateDemoOptimizationSuggestions(),
  
  // Dashboard stats
  dashboardStats: {
    totalApplications: 23,
    responseRate: 42,
    interviewRate: 18,
    profileViews: 156,
    savedJobs: 8,
    newMessages: 3
  },
  
  // User profile
  userProfile: {
    id: 'demo-user-id',
    full_name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Passionate frontend developer with 5+ years of experience building scalable web applications. Specialized in React, TypeScript, and modern web technologies. Recently AWS certified and looking to transition into a senior or lead role.',
    skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'CSS', 'HTML', 'Git', 'AWS', 'Jest', 'Redux'],
    experience_level: 'Senior',
    portfolio_url: 'https://alexjohnson.dev',
    linkedin_url: 'https://linkedin.com/in/alexjohnson',
    github_url: 'https://github.com/alexjohnson',
    website_url: 'https://alexjohnson.com',
    profile_completion: 92,
    work_experience: [
      {
        id: '1',
        company: 'TechCorp Inc.',
        position: 'Senior Frontend Developer',
        start_date: '2022-01-01',
        end_date: null,
        description: 'Lead frontend development for customer-facing applications. Improved page load times by 40% and increased user engagement by 25%. Mentor junior developers and conduct code reviews.',
        is_current: true
      },
      {
        id: '2',
        company: 'StartupXYZ',
        position: 'Frontend Developer',
        start_date: '2020-06-01',
        end_date: '2021-12-31',
        description: 'Built responsive web applications using React and TypeScript. Collaborated with design team to implement pixel-perfect UIs. Reduced bundle size by 30% through optimization.',
        is_current: false
      }
    ],
    education: [
      {
        id: '1',
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        start_date: '2016-09-01',
        end_date: '2020-05-01',
        gpa: '3.7'
      }
    ]
  },
  
  // Notification preferences
  notificationPreferences: {
    email_notifications: true,
    push_notifications: true,
    job_alerts: true,
    application_updates: true,
    marketing_emails: false,
    frequency: 'daily',
    job_alert_frequency: 'immediate',
    application_update_frequency: 'immediate',
    marketing_frequency: 'weekly'
  }
});

// Utility function to populate localStorage with demo data
export const loadDemoDataToLocalStorage = () => {
  const demoData = generateAllDemoData();
  
  // Store each data type in localStorage for the dashboard to use
  localStorage.setItem('demo_applications', JSON.stringify(demoData.applications));
  localStorage.setItem('demo_job_matches', JSON.stringify(demoData.jobMatches));
  localStorage.setItem('demo_saved_jobs', JSON.stringify(demoData.savedJobs));
  localStorage.setItem('demo_activity', JSON.stringify(demoData.activity));
  localStorage.setItem('demo_application_trends', JSON.stringify(demoData.applicationTrends));
  localStorage.setItem('demo_skill_gaps', JSON.stringify(demoData.skillGaps));
  localStorage.setItem('demo_industry_insights', JSON.stringify(demoData.industryInsights));
  localStorage.setItem('demo_career_progression', JSON.stringify(demoData.careerProgression));
  localStorage.setItem('demo_optimization_suggestions', JSON.stringify(demoData.optimizationSuggestions));
  localStorage.setItem('demo_dashboard_stats', JSON.stringify(demoData.dashboardStats));
  localStorage.setItem('demo_user_profile', JSON.stringify(demoData.userProfile));
  localStorage.setItem('demo_notification_preferences', JSON.stringify(demoData.notificationPreferences));
  
  console.log('Demo data loaded to localStorage successfully!');
  return demoData;
};

// Utility function to clear demo data
export const clearDemoData = () => {
  const demoKeys = [
    'demo_applications',
    'demo_job_matches', 
    'demo_saved_jobs',
    'demo_activity',
    'demo_application_trends',
    'demo_skill_gaps',
    'demo_industry_insights',
    'demo_career_progression',
    'demo_optimization_suggestions',
    'demo_dashboard_stats',
    'demo_user_profile',
    'demo_notification_preferences'
  ];
  
  demoKeys.forEach(key => localStorage.removeItem(key));
  console.log('Demo data cleared from localStorage');
};