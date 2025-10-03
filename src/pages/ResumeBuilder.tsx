import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { ResumeData, PersonalInfo, WorkExperience, Education, Certification, Project, VolunteerExperience, Award, Language, Reference } from '../types';
import PersonalInfoForm from '../components/PersonalInfoForm';
import WorkExperienceForm from '../components/WorkExperienceForm';
import SkillsForm from '../components/SkillsForm';
import EducationForm from '../components/EducationForm';
import CertificationsForm from '../components/CertificationsForm';
import ProjectsForm from '../components/ProjectsForm';
import VolunteerExperienceForm from '../components/VolunteerExperienceForm';
import AwardsForm from '../components/AwardsForm';
import LanguagesForm from '../components/LanguagesForm';
import ReferencesForm from '../components/ReferencesForm';
import AdditionalSectionsForm from '../components/AdditionalSectionsForm';
import PDFPreview from '../components/PDFPreview';
import LivePreview from '../components/LivePreview';
import ATSOptimizer from '../components/ATSOptimizer';
import KeywordOptimizer from '../components/KeywordOptimizer';
import AchievementQuantifier from '../components/AchievementQuantifier';

interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  font_family: string;
  font_size: number;
  primary_color: string;
  secondary_color: string;
  section_order: string[];
  bullet_style: string;
  spacing: string;
  category: string;
  style: string;
}

export default function ResumeBuilder() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [previewMode, setPreviewMode] = useState<'live' | 'ats' | 'keywords' | 'achievements'>('live');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'Personal Information', 'Professional Summary', 'Work Experience', 'Education', 'Skills', 
    'Certifications', 'Projects', 'Volunteer Experience', 'Awards & Achievements', 
    'Languages', 'References', 'Hobbies & Interests', 'Publications', 'Patents',
    'Speaking Engagements', 'Professional Memberships'
  ]);
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      fullName: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe',
      portfolio: 'johndoe.dev',
      address: 'New York, NY',
      dateOfBirth: '1990-01-01',
      nationality: 'American',
      languages: ['English', 'Spanish'],
      professionalSummary: 'Experienced software developer with 5+ years of expertise in full-stack development.'
    },
    workExperience: [{
      id: '1',
      jobTitle: 'Senior Developer',
      company: 'Tech Corp',
      companySize: '500-1000',
      industry: 'Technology',
      startDate: '2020-01',
      endDate: '2024-01',
      achievements: ['Led development of web applications', 'Improved system performance by 40%', 'Mentored junior developers'],
      technologies: ['JavaScript', 'React', 'Node.js'],
      teamSize: '5-10',
      location: 'New York, NY'
    }],
    skills: ['JavaScript', 'React', 'Node.js'],
    education: [{
      id: '1',
      degree: 'Bachelor of Computer Science',
      institution: 'University of Technology',
      location: 'Boston, MA',
      startDate: '2016-09',
      endDate: '2020-05',
      gpa: '3.8',
      relevantCoursework: ['Data Structures', 'Algorithms', 'Software Engineering'],
      honors: ['Dean\'s List', 'Magna Cum Laude']
    }],
    certifications: [{
      id: '1',
      name: 'AWS Certified Developer',
      issuingOrganization: 'Amazon Web Services',
      issueDate: '2023-06',
      expirationDate: '2026-06'
    }],
    projects: [{
      id: '1',
      name: 'E-commerce Platform',
      description: 'Built a full-stack e-commerce solution',
      technologies: ['React', 'Node.js', 'MongoDB'],
      highlights: ['Implemented secure payment processing', 'Built responsive user interface', 'Optimized database queries for performance'],
      startDate: '2023-01',
      endDate: '2023-06',
      githubUrl: 'github.com/johndoe/ecommerce',
      liveUrl: 'ecommerce-demo.johndoe.dev'
    }],
    volunteerExperience: [{
      id: '1',
      role: 'Volunteer Developer',
      organization: 'Code for Good',
      location: 'New York, NY',
      startDate: '2022-01',
      endDate: '2023-01',
      description: 'Developed websites for non-profit organizations',
      achievements: ['Built 3 websites for local nonprofits', 'Trained 5 volunteers in web development'],
      hoursPerWeek: 10
    }],
    awards: [{
      id: '1',
      name: 'Employee of the Year',
      organization: 'Tech Corp',
      date: '2023-12',
      description: 'Recognized for outstanding performance',
      category: 'professional'
    }],
    languageSkills: [{
      id: '1',
      name: 'English',
      proficiency: 'native'
    }, {
      id: '2',
      name: 'Spanish',
      proficiency: 'intermediate',
      certification: 'DELE B2'
    }],
    references: [{
      id: '1',
      name: 'Jane Smith',
      title: 'Senior Manager',
      company: 'Tech Corp',
      email: 'jane.smith@techcorp.com',
      phone: '+1 (555) 987-6543',
      relationship: 'Direct Supervisor'
    }],
    publications: [{
      id: '1',
      title: 'Modern Web Development Practices',
      authors: ['John Doe', 'Jane Smith'],
      publication: 'Tech Journal',
      journal: 'Tech Journal',
      date: '2023-08',
      year: 2023,
      doi: '10.1234/example'
    }],
    patents: [],
    speakingEngagements: [],
    professionalMemberships: [],
    hobbies: ['Photography', 'Hiking', 'Reading'],
    availableOnRequest: false
  });

  useEffect(() => {
    // Load selected template from localStorage
    const loadSelectedTemplate = async () => {
      const templateId = localStorage.getItem('selectedTemplate');
      const industryTemplate = localStorage.getItem('selectedIndustryTemplate');
      
      // Priority: Industry template over regular template
      if (industryTemplate) {
        try {
          const template = JSON.parse(industryTemplate);
          // Convert industry template to TemplateMetadata format
           const selectedColorScheme = template.selectedColorScheme || template.colorSchemes?.[0];
           const templateMetadata: TemplateMetadata = {
             id: template.id,
             name: template.name,
             description: template.description,
             font_family: template.templateMetadata?.font_family || 'Inter',
             font_size: template.templateMetadata?.font_size || 11,
             primary_color: selectedColorScheme?.primary || '#2563eb',
             secondary_color: selectedColorScheme?.secondary || '#1e40af',
             section_order: template.sectionPriorities || [
               'Personal Information', 'Professional Summary', 'Work Experience', 'Education', 'Skills', 
               'Certifications', 'Projects', 'Volunteer Experience', 'Awards & Achievements', 
               'Languages', 'References', 'Hobbies & Interests', 'Publications', 'Patents',
               'Speaking Engagements', 'Professional Memberships'
             ],
             bullet_style: template.templateMetadata?.bullet_style || 'circle',
             spacing: template.templateMetadata?.spacing || 'standard',
             category: template.templateMetadata?.category || 'general',
             style: template.templateMetadata?.style || 'modern'
           };
          setSelectedTemplate(templateMetadata);
          // Only set section order from template if no saved section order exists
          const savedSectionOrder = localStorage.getItem('sectionOrder');
          if (!savedSectionOrder) {
            setSectionOrder(templateMetadata.section_order);
            localStorage.setItem('sectionOrder', JSON.stringify(templateMetadata.section_order));
          }
        } catch (error) {
          console.error('Failed to parse industry template:', error);
        }
      } else if (templateId) {
        try {
          const response = await fetch(`/templates/generated/${templateId}.json`);
          if (response.ok) {
            const template = await response.json();
            setSelectedTemplate(template);
          }
        } catch (error) {
          console.error('Failed to load template:', error);
        }
      }
    };
    
    // Load resume data from localStorage
    const loadResumeData = () => {
      // First try to load from 'resumeData' (current save key)
      let savedData = localStorage.getItem('resumeData');
      
      // If not found, try 'updatedResumeData' (legacy key)
      if (!savedData) {
        savedData = localStorage.getItem('updatedResumeData');
        if (savedData) {
          // Clear the legacy data after loading
          localStorage.removeItem('updatedResumeData');
        }
      }
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setResumeData(parsedData);
        } catch (error) {
          console.error('Failed to parse resume data:', error);
        }
      }
    };
    
    loadSelectedTemplate();
    loadResumeData();
    
    // Load saved section order
    const savedSectionOrder = localStorage.getItem('sectionOrder');
    if (savedSectionOrder) {
      try {
        const parsedSectionOrder = JSON.parse(savedSectionOrder);
        setSectionOrder(parsedSectionOrder);
      } catch (error) {
        console.error('Failed to parse saved section order:', error);
      }
    } else {
      // Save default section order if none exists
      const defaultOrder = [
        'Personal Information', 'Professional Summary', 'Work Experience', 'Education', 'Skills', 
        'Certifications', 'Projects', 'Volunteer Experience', 'Awards & Achievements', 
        'Languages', 'References', 'Hobbies & Interests', 'Publications', 'Patents',
        'Speaking Engagements', 'Professional Memberships'
      ];
      localStorage.setItem('sectionOrder', JSON.stringify(defaultOrder));
    }
  }, []);

  const steps = [
    { id: 1, name: t('resumeBuilder.steps.personalInfo'), description: t('resumeBuilder.steps.personalInfoDesc') },
    { id: 2, name: t('resumeBuilder.steps.workExperience'), description: t('resumeBuilder.steps.workExperienceDesc') },
    { id: 3, name: t('resumeBuilder.steps.education'), description: t('resumeBuilder.steps.educationDesc') },
    { id: 4, name: t('resumeBuilder.steps.skills'), description: t('resumeBuilder.steps.skillsDesc') },
    { id: 5, name: t('resumeBuilder.steps.certifications'), description: t('resumeBuilder.steps.certificationsDesc') },
    { id: 6, name: t('resumeBuilder.steps.projects'), description: t('resumeBuilder.steps.projectsDesc') },
    { id: 7, name: t('resumeBuilder.steps.volunteerWork'), description: t('resumeBuilder.steps.volunteerWorkDesc') },
    { id: 8, name: t('resumeBuilder.steps.awards'), description: t('resumeBuilder.steps.awardsDesc') },
    { id: 9, name: t('resumeBuilder.steps.languages'), description: t('resumeBuilder.steps.languagesDesc') },
    { id: 10, name: t('resumeBuilder.steps.references'), description: t('resumeBuilder.steps.referencesDesc') },
    { id: 11, name: t('resumeBuilder.steps.additional'), description: t('resumeBuilder.steps.additionalDesc') },
    { id: 12, name: t('resumeBuilder.steps.preview'), description: t('resumeBuilder.steps.previewDesc') },
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updatePersonalInfo = (info: PersonalInfo) => {
    updateResumeData('personalInfo', info);
  };

  const updateWorkExperience = (experience: WorkExperience[]) => {
    updateResumeData('workExperience', experience);
  };

  const updateSkills = (skills: string[]) => {
    updateResumeData('skills', skills);
  };

  const updateEducation = (education: Education[]) => {
    updateResumeData('education', education);
  };

  const updateCertifications = (certifications: Certification[]) => {
    updateResumeData('certifications', certifications);
  };

  const updateProjects = (projects: Project[]) => {
    updateResumeData('projects', projects);
  };

  const updateVolunteerExperience = (volunteerExperience: VolunteerExperience[]) => {
    updateResumeData('volunteerExperience', volunteerExperience);
  };

  const updateAwards = (awards: Award[]) => {
    updateResumeData('awards', awards);
  };

  const updateResumeData = (section: keyof ResumeData, data: any) => {
    setResumeData(prev => {
      const updated = {
        ...prev,
        [section]: data
      };
      
      // Preserve selectedColorScheme if it exists
      if (prev.selectedColorScheme) {
        updated.selectedColorScheme = prev.selectedColorScheme;
      }
      
      // Handle languageSkills updates
      if (section === 'languageSkills') {
        updated.languageSkills = data;
      }
      
      // Save to localStorage
      localStorage.setItem('resumeData', JSON.stringify(updated));
      
      return updated;
    });
  };

  const updateLanguageSkills = (languageSkills: Language[]) => {
    updateResumeData('languageSkills', languageSkills);
  };

  const updateReferences = (references: Reference[]) => {
    updateResumeData('references', references);
  };

  const updateAdditionalSections = (field: string, value: any) => {
    updateResumeData(field as keyof ResumeData, value);
  };

  const handleSectionOrderChange = (newOrder: string[]) => {
    setSectionOrder(newOrder);
    // Save section order to localStorage
    localStorage.setItem('sectionOrder', JSON.stringify(newOrder));
  };

  const handleSectionDelete = (sectionName: string) => {
    // Remove the section from the section order
    setSectionOrder(prev => prev.filter(section => section !== sectionName));
    
    // Clear the corresponding data based on section name
    switch (sectionName) {
      case 'Work Experience':
        updateResumeData('workExperience', []);
        break;
      case 'Education':
        updateResumeData('education', []);
        break;
      case 'Skills':
        updateResumeData('skills', []);
        break;
      case 'Certifications':
        updateResumeData('certifications', []);
        break;
      case 'Projects':
        updateResumeData('projects', []);
        break;
      case 'Volunteer Experience':
        updateResumeData('volunteerExperience', []);
        break;
      case 'Awards':
        updateResumeData('awards', []);
        break;
      case 'Languages':
        updateResumeData('languageSkills', []);
        break;
      case 'References':
        updateResumeData('references', []);
        updateResumeData('availableOnRequest', false);
        break;
      case 'Additional Sections':
        updateResumeData('publications', []);
        updateResumeData('patents', []);
        updateResumeData('speakingEngagements', []);
        updateResumeData('professionalMemberships', []);
        updateResumeData('hobbies', []);
        break;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <PersonalInfoForm 
              data={resumeData.personalInfo} 
              onChange={updatePersonalInfo} 
            />
          </div>
        );
      case 2:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
            <WorkExperienceForm 
              data={resumeData.workExperience || []} 
              onChange={updateWorkExperience} 
            />
          </div>
        );
      case 3:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Education</h2>
            <EducationForm 
              data={resumeData.education || []} 
              onChange={updateEducation} 
            />
          </div>
        );
      case 4:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Skills</h2>
            <SkillsForm 
              data={resumeData.skills} 
              onChange={updateSkills} 
            />
          </div>
        );
      case 5:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Certifications & Licenses</h2>
            <CertificationsForm 
              data={resumeData.certifications || []} 
              onChange={updateCertifications} 
            />
          </div>
        );
      case 6:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Projects</h2>
            <ProjectsForm 
              data={resumeData.projects || []} 
              onChange={updateProjects} 
            />
          </div>
        );
      case 7:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Volunteer Experience</h2>
            <VolunteerExperienceForm 
              data={resumeData.volunteerExperience || []} 
              onChange={updateVolunteerExperience} 
            />
          </div>
        );
      case 8:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Awards & Achievements</h2>
            <AwardsForm 
              data={resumeData.awards || []} 
              onChange={updateAwards} 
            />
          </div>
        );
      case 9:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Languages</h2>
            <LanguagesForm 
              data={resumeData.languageSkills || []} 
              onChange={updateLanguageSkills} 
            />
          </div>
        );
      case 10:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">References</h2>
            <ReferencesForm 
              data={resumeData.references || []} 
              availableOnRequest={resumeData.availableOnRequest || false}
              onChange={updateReferences}
              onAvailableOnRequestChange={(value) => updateAdditionalSections('availableOnRequest', value)}
            />
          </div>
        );
      case 11:
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Additional Sections</h2>
            <AdditionalSectionsForm 
              publications={resumeData.publications || []}
              patents={resumeData.patents || []}
              speakingEngagements={resumeData.speakingEngagements || []}
              professionalMemberships={resumeData.professionalMemberships || []}
              hobbies={resumeData.hobbies || []}
              onPublicationsChange={(value) => updateAdditionalSections('publications', value)}
              onPatentsChange={(value) => updateAdditionalSections('patents', value)}
              onSpeakingEngagementsChange={(value) => updateAdditionalSections('speakingEngagements', value)}
              onProfessionalMembershipsChange={(value) => updateAdditionalSections('professionalMemberships', value)}
              onHobbiesChange={(value) => updateAdditionalSections('hobbies', value)}
            />
          </div>
        );
      case 12:
        // Debug: Log the data being passed to PDFPreview
        console.log('ResumeBuilder - Data being passed to PDFPreview:', {
          personalInfo: resumeData.personalInfo,
          workExperience: resumeData.workExperience?.length || 0,
          skills: resumeData.skills?.length || 0,
          education: resumeData.education?.length || 0,
          certifications: resumeData.certifications?.length || 0,
          projects: resumeData.projects?.length || 0,
          volunteerExperience: resumeData.volunteerExperience?.length || 0,
          awards: resumeData.awards?.length || 0,
          languageSkills: resumeData.languageSkills?.length || 0,
          references: resumeData.references?.length || 0,
          publications: resumeData.publications?.length || 0,
          patents: resumeData.patents?.length || 0,
          speakingEngagements: resumeData.speakingEngagements?.length || 0,
          professionalMemberships: resumeData.professionalMemberships?.length || 0,
          hobbies: resumeData.hobbies?.length || 0
        });
        console.log('ResumeBuilder - Section order:', sectionOrder);
        console.log('ResumeBuilder - Template:', selectedTemplate);
        return (
          <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-semibold mb-4">Preview & Download</h2>
            <PDFPreview data={resumeData} sectionOrder={sectionOrder} template={selectedTemplate || undefined} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                {t('navigation.home')}
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-semibold text-gray-900">{t('navigation.resumeBuilder')}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/upwork-proposal" 
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md border border-gray-300 hover:border-blue-300"
              >
                <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                Generate Upwork Proposal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-x-auto">
            <nav className="flex space-x-4 py-4 min-w-max" aria-label="Progress">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = currentStep > step.id;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : isCompleted 
                        ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{step.name}</p>
                      <p className="text-xs opacity-75">{step.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content - Split Screen Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side - Form Content */}
        <div className="w-full lg:w-1/2 lg:border-r border-gray-200 p-4 lg:p-6 overflow-auto order-1 lg:order-1">
          <div className="h-full max-w-2xl">
            {renderStepContent()}
          </div>
        </div>
        
        {/* Right Side - Preview */}
        <div className="w-full lg:w-1/2 p-4 lg:p-6 overflow-auto order-2 lg:order-2">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {previewMode === 'live' ? 'Live Preview' : 
                   previewMode === 'ats' ? 'ATS Scanner' : 
                   previewMode === 'keywords' ? 'Keyword Optimizer' : 'Achievement Quantifier'}
                </h2>
                <p className="text-sm text-gray-600">
                  {previewMode === 'live' 
                    ? 'See your resume update in real-time' 
                    : previewMode === 'ats'
                    ? 'Optimize your resume for ATS systems'
                    : previewMode === 'keywords'
                    ? 'Analyze and optimize keywords for better job matching'
                    : 'Transform vague accomplishments into quantified, impactful statements'
                  }
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPreviewMode('live')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    previewMode === 'live'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('resumeBuilder.livePreview')}
                </button>
                <button
                  onClick={() => setPreviewMode('ats')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    previewMode === 'ats'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('resumeBuilder.atsScanner')}
                </button>
                <button
                  onClick={() => setPreviewMode('keywords')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    previewMode === 'keywords'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('resumeBuilder.keywordOptimizer')}
                </button>
                <button
                  onClick={() => setPreviewMode('achievements')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    previewMode === 'achievements'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('resumeBuilder.achievementQuantifier')}
                </button>
              </div>
            </div>
          </div>
          <div className="min-h-[400px] lg:min-h-0">
            {previewMode === 'live' ? (
              <LivePreview 
                data={resumeData} 
                template={selectedTemplate || undefined}
                onSectionOrderChange={handleSectionOrderChange}
                onSectionDelete={handleSectionDelete}
              />
            ) : previewMode === 'ats' ? (
              <ATSOptimizer 
                resumeData={resumeData} 
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
              />
            ) : previewMode === 'keywords' ? (
              <KeywordOptimizer 
                resumeData={resumeData} 
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
              />
            ) : (
              <AchievementQuantifier 
                resumeData={resumeData}
                onResumeDataChange={setResumeData}
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>{t('common.previous')}</span>
            </button>
            
            <button
              onClick={nextStep}
              disabled={currentStep === steps.length}
              className={`flex items-center space-x-2 px-6 py-2 rounded-md ${
                currentStep === steps.length
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <span>{currentStep === steps.length ? t('common.complete') : t('common.next')}</span>
              {currentStep !== steps.length && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}