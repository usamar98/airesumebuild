import React, { useState } from 'react';
import { 
  BriefcaseIcon, 
  ComputerDesktopIcon,
  HeartIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  ScaleIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  PaintBrushIcon,
  ChevronRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  roles: string[];
  keySkills: string[];
  sampleContent: {
    summary: string;
    experience: string[];
    achievements: string[];
  };
  sectionPriorities: string[];
  formatting: {
    style: string;
    emphasis: string;
    layout: string;
  };
  colorSchemes: {
    primary: string;
    secondary: string;
    accent: string;
    name: string;
  }[];
  templateMetadata: {
    font_family: string;
    font_size: number;
    bullet_style: string;
    spacing: string;
    category: string;
    style: string;
  };
}

interface IndustryTemplatesProps {
  onTemplateSelect: (template: IndustryTemplate) => void;
  selectedIndustry?: string;
}

const industryTemplates: IndustryTemplate[] = [
  {
    id: 'technology',
    name: 'Technology',
    description: 'Software development, IT, cybersecurity, data science',
    icon: ComputerDesktopIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    roles: ['Software Engineer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UX Designer', 'Cybersecurity Analyst'],
    keySkills: ['Programming Languages', 'Cloud Platforms', 'Agile/Scrum', 'Version Control', 'Database Management', 'API Development'],
    sampleContent: {
      summary: 'Innovative software engineer with 5+ years of experience developing scalable web applications and leading cross-functional teams to deliver high-quality solutions.',
      experience: [
        'Developed and maintained 15+ microservices using Node.js and Python, serving 100K+ daily active users',
        'Led migration to AWS cloud infrastructure, reducing operational costs by 30% and improving system reliability',
        'Implemented CI/CD pipelines using Jenkins and Docker, reducing deployment time from 2 hours to 15 minutes'
      ],
      achievements: [
        'Optimized database queries resulting in 40% faster application response times',
        'Mentored 8 junior developers and established coding standards adopted company-wide',
        'Built real-time analytics dashboard processing 1M+ events per day'
      ]
    },
    sectionPriorities: ['Contact', 'Summary', 'Technical Skills', 'Experience', 'Projects', 'Education', 'Certifications'],
    formatting: {
      style: 'Clean and technical',
      emphasis: 'Technical skills and quantified achievements',
      layout: 'Skills-focused with project highlights'
    },
    colorSchemes: [
      { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6', name: 'Tech Blue' },
      { primary: '#059669', secondary: '#047857', accent: '#10b981', name: 'Code Green' },
      { primary: '#7c3aed', secondary: '#6d28d9', accent: '#8b5cf6', name: 'Digital Purple' },
      { primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444', name: 'Innovation Red' }
    ],
    templateMetadata: {
      font_family: 'Inter',
      font_size: 11,
      bullet_style: 'square',
      spacing: 'compact',
      category: 'technology',
      style: 'modern'
    }
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical professionals, nursing, healthcare administration',
    icon: HeartIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    roles: ['Registered Nurse', 'Physician', 'Healthcare Administrator', 'Medical Technician', 'Physical Therapist', 'Pharmacist'],
    keySkills: ['Patient Care', 'Medical Procedures', 'Healthcare Regulations', 'Electronic Health Records', 'Clinical Assessment', 'Emergency Response'],
    sampleContent: {
      summary: 'Compassionate registered nurse with 7+ years of experience in critical care, dedicated to providing exceptional patient care and improving health outcomes.',
      experience: [
        'Provided direct patient care for 20+ ICU patients daily, maintaining 98% patient satisfaction scores',
        'Collaborated with multidisciplinary teams to develop and implement patient care plans',
        'Trained and supervised 12 nursing students during clinical rotations'
      ],
      achievements: [
        'Reduced medication errors by 25% through implementation of double-check protocols',
        'Achieved CCRN certification and maintained continuing education requirements',
        'Led quality improvement initiative that decreased patient readmission rates by 15%'
      ]
    },
    sectionPriorities: ['Contact', 'Summary', 'Licenses & Certifications', 'Experience', 'Education', 'Clinical Skills', 'Professional Development'],
    formatting: {
      style: 'Professional and trustworthy',
      emphasis: 'Certifications and patient outcomes',
      layout: 'Credential-focused with care achievements'
    },
    colorSchemes: [
      { primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444', name: 'Medical Red' },
      { primary: '#059669', secondary: '#047857', accent: '#10b981', name: 'Health Green' },
      { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6', name: 'Trust Blue' },
      { primary: '#7c2d12', secondary: '#92400e', accent: '#d97706', name: 'Warm Care' }
    ],
    templateMetadata: {
      font_family: 'Georgia',
      font_size: 11,
      bullet_style: 'circle',
      spacing: 'standard',
      category: 'healthcare',
      style: 'professional'
    }
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Banking, investment, accounting, financial analysis',
    icon: CurrencyDollarIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    roles: ['Financial Analyst', 'Investment Banker', 'Accountant', 'Risk Manager', 'Portfolio Manager', 'Financial Advisor'],
    keySkills: ['Financial Modeling', 'Risk Assessment', 'Regulatory Compliance', 'Excel/VBA', 'Bloomberg Terminal', 'Financial Reporting'],
    sampleContent: {
      summary: 'Results-driven financial analyst with 6+ years of experience in investment banking and portfolio management, specializing in equity research and risk assessment.',
      experience: [
        'Analyzed 50+ equity investments totaling $500M+ in market capitalization for institutional clients',
        'Developed financial models and valuation frameworks that improved investment decision accuracy by 20%',
        'Managed client portfolios worth $100M+ while maintaining risk-adjusted returns above benchmark'
      ],
      achievements: [
        'Generated $15M+ in revenue through successful IPO and M&A advisory services',
        'Achieved CFA Level II certification and maintained Series 7 and 63 licenses',
        'Published 25+ research reports that influenced $200M+ in investment decisions'
      ]
    },
    sectionPriorities: ['Contact', 'Summary', 'Professional Experience', 'Certifications', 'Education', 'Technical Skills', 'Achievements'],
    formatting: {
      style: 'Conservative and results-oriented',
      emphasis: 'Quantified financial results and certifications',
      layout: 'Achievement-focused with numerical impact'
    },
    colorSchemes: [
      { primary: '#059669', secondary: '#047857', accent: '#10b981', name: 'Finance Green' },
      { primary: '#1f2937', secondary: '#374151', accent: '#6b7280', name: 'Corporate Gray' },
      { primary: '#1e40af', secondary: '#1e3a8a', accent: '#3b82f6', name: 'Banking Blue' },
      { primary: '#7c2d12', secondary: '#92400e', accent: '#d97706', name: 'Gold Standard' }
    ],
    templateMetadata: {
      font_family: 'Times New Roman',
      font_size: 11,
      bullet_style: 'dash',
      spacing: 'standard',
      category: 'finance',
      style: 'conservative'
    }
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Digital marketing, brand management, content creation',
    icon: MegaphoneIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    roles: ['Digital Marketing Manager', 'Content Creator', 'Brand Manager', 'SEO Specialist', 'Social Media Manager', 'Marketing Analyst'],
    keySkills: ['Digital Marketing', 'Content Strategy', 'SEO/SEM', 'Social Media', 'Analytics', 'Brand Management'],
    sampleContent: {
      summary: 'Creative digital marketing professional with 5+ years of experience driving brand awareness and customer acquisition through innovative campaigns and data-driven strategies.',
      experience: [
        'Developed and executed integrated marketing campaigns that increased brand awareness by 45%',
        'Managed $2M+ annual marketing budget across digital and traditional channels',
        'Led content marketing strategy resulting in 300% increase in organic website traffic'
      ],
      achievements: [
        'Generated 150% increase in qualified leads through targeted digital campaigns',
        'Built social media following from 10K to 100K+ across all platforms',
        'Launched successful product campaign that exceeded sales targets by 25%'
      ]
    },
    sectionPriorities: ['Contact', 'Summary', 'Experience', 'Key Achievements', 'Skills', 'Education', 'Portfolio'],
    formatting: {
      style: 'Creative and engaging',
      emphasis: 'Campaign results and creative achievements',
      layout: 'Impact-focused with visual elements'
    },
    colorSchemes: [
      { primary: '#7c3aed', secondary: '#6d28d9', accent: '#8b5cf6', name: 'Creative Purple' },
      { primary: '#ec4899', secondary: '#db2777', accent: '#f472b6', name: 'Brand Pink' },
      { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24', name: 'Energy Orange' },
      { primary: '#06b6d4', secondary: '#0891b2', accent: '#22d3ee', name: 'Digital Cyan' }
    ],
    templateMetadata: {
      font_family: 'Helvetica',
      font_size: 11,
      bullet_style: 'arrow',
      spacing: 'relaxed',
      category: 'marketing',
      style: 'creative'
    }
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Teaching, administration, curriculum development',
    icon: AcademicCapIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    roles: ['Teacher', 'Principal', 'Curriculum Developer', 'Education Administrator', 'Instructional Designer', 'Academic Advisor'],
    keySkills: ['Curriculum Development', 'Classroom Management', 'Educational Technology', 'Assessment Design', 'Student Engagement', 'Professional Development'],
    sampleContent: {
      summary: 'Dedicated educator with 8+ years of experience in secondary education, passionate about creating engaging learning environments and improving student outcomes.',
      experience: [
        'Taught 150+ students annually across multiple grade levels, maintaining 95% student satisfaction rates',
        'Developed innovative curriculum that improved standardized test scores by 20%',
        'Mentored 15+ new teachers and led professional development workshops'
      ],
      achievements: [
        'Received Teacher of the Year award for outstanding student engagement and achievement',
        'Implemented technology integration program adopted district-wide',
        'Increased student college readiness scores by 30% through targeted intervention programs'
      ]
    },
    sectionPriorities: ['Contact', 'Summary', 'Teaching Experience', 'Education', 'Certifications', 'Professional Development', 'Skills'],
    formatting: {
      style: 'Professional and approachable',
      emphasis: 'Student outcomes and educational impact',
      layout: 'Experience-focused with achievement highlights'
    },
    colorSchemes: [
      { primary: '#4f46e5', secondary: '#4338ca', accent: '#6366f1', name: 'Academic Indigo' },
      { primary: '#059669', secondary: '#047857', accent: '#10b981', name: 'Growth Green' },
      { primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444', name: 'Apple Red' },
      { primary: '#7c2d12', secondary: '#92400e', accent: '#d97706', name: 'Wisdom Bronze' }
    ],
    templateMetadata: {
      font_family: 'Calibri',
      font_size: 11,
      bullet_style: 'circle',
      spacing: 'standard',
      category: 'education',
      style: 'approachable'
    }
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Law practice, paralegal, legal research, compliance',
    icon: ScaleIcon,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    roles: ['Attorney', 'Paralegal', 'Legal Counsel', 'Compliance Officer', 'Legal Researcher', 'Contract Manager'],
    keySkills: ['Legal Research', 'Contract Negotiation', 'Litigation Support', 'Regulatory Compliance', 'Legal Writing', 'Case Management'],
    sampleContent: {
      summary: 'Experienced corporate attorney with 10+ years of practice in commercial law, specializing in contract negotiation and regulatory compliance.',
      experience: [
        'Negotiated 200+ commercial contracts worth $50M+ in total value for Fortune 500 clients',
        'Led legal team of 8 attorneys in complex litigation matters with 90% success rate',
        'Provided regulatory compliance guidance resulting in zero violations over 5 years'
      ],
      achievements: [
        'Successfully defended client in $10M+ commercial dispute, saving company significant costs',
        'Admitted to practice in 3 states and maintained active bar memberships',
        'Published 15+ articles in legal journals on corporate governance and compliance'
      ]
    },
    sectionPriorities: ['Contact', 'Summary', 'Bar Admissions', 'Experience', 'Education', 'Publications', 'Professional Associations'],
    formatting: {
      style: 'Traditional and authoritative',
      emphasis: 'Legal credentials and case outcomes',
      layout: 'Credential-heavy with professional achievements'
    },
    colorSchemes: [
      { primary: '#374151', secondary: '#1f2937', accent: '#6b7280', name: 'Legal Gray' },
      { primary: '#1e40af', secondary: '#1e3a8a', accent: '#3b82f6', name: 'Justice Blue' },
      { primary: '#7c2d12', secondary: '#92400e', accent: '#d97706', name: 'Scales Gold' },
      { primary: '#581c87', secondary: '#6b21a8', accent: '#8b5cf6', name: 'Royal Purple' }
    ],
    templateMetadata: {
      font_family: 'Times New Roman',
      font_size: 12,
      bullet_style: 'none',
      spacing: 'standard',
      category: 'legal',
      style: 'traditional'
    }
  },
  {
    id: 'engineering',
    name: 'Engineering',
    description: 'Mechanical, civil, electrical, chemical engineering',
    icon: WrenchScrewdriverIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    roles: ['Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer', 'Project Engineer', 'Design Engineer', 'Quality Engineer'],
    keySkills: ['CAD Software', 'Project Management', 'Technical Analysis', 'Quality Control', 'Safety Compliance', 'Problem Solving'],
    sampleContent: {
      summary: 'Innovative mechanical engineer with 7+ years of experience in product design and manufacturing optimization, specializing in automotive and aerospace applications.',
      experience: [
        'Designed and developed 25+ mechanical systems for automotive clients, reducing production costs by 15%',
        'Led cross-functional teams of 12+ engineers on $5M+ product development projects',
        'Implemented lean manufacturing processes that improved efficiency by 30%'
      ],
      achievements: [
        'Obtained 3 patents for innovative mechanical design solutions',
        'Achieved Professional Engineer (PE) license and Six Sigma Green Belt certification',
        'Reduced product defect rates by 40% through improved quality control processes'
      ]
    },
    sectionPriorities: ['Contact', 'Summary', 'Professional Experience', 'Technical Skills', 'Education', 'Licenses & Certifications', 'Patents'],
    formatting: {
      style: 'Technical and precise',
      emphasis: 'Technical achievements and certifications',
      layout: 'Skills-focused with project outcomes'
    },
    colorSchemes: [
      { primary: '#ea580c', secondary: '#c2410c', accent: '#fb923c', name: 'Engineering Orange' },
      { primary: '#1f2937', secondary: '#111827', accent: '#6b7280', name: 'Industrial Gray' },
      { primary: '#0f766e', secondary: '#134e4a', accent: '#14b8a6', name: 'Tech Teal' },
      { primary: '#7c2d12', secondary: '#92400e', accent: '#f59e0b', name: 'Safety Yellow' }
    ],
    templateMetadata: {
      font_family: 'Arial',
      font_size: 11,
      bullet_style: 'square',
      spacing: 'compact',
      category: 'engineering',
      style: 'technical'
    }
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Design, media, arts, entertainment, content creation',
    icon: PaintBrushIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    roles: ['Graphic Designer', 'Art Director', 'Content Creator', 'Photographer', 'Video Editor', 'Creative Director'],
    keySkills: ['Adobe Creative Suite', 'Brand Design', 'Visual Communication', 'Creative Strategy', 'Typography', 'Digital Media'],
    sampleContent: {
      summary: 'Creative graphic designer with 6+ years of experience creating compelling visual content for global brands, specializing in digital marketing and brand identity.',
      experience: [
        'Designed visual content for 50+ brands, increasing client engagement rates by 60%',
        'Led rebranding projects for 10+ companies, resulting in average 25% increase in brand recognition',
        'Managed creative team of 6 designers and coordinated with marketing departments'
      ],
      achievements: [
        'Won 5 design awards including Gold ADDY for outstanding creative excellence',
        'Created viral social media campaign that reached 2M+ users and generated 500K+ engagements',
        'Developed brand guidelines adopted by 20+ international offices'
      ]
    },
    sectionPriorities: ['Contact', 'Summary', 'Portfolio', 'Experience', 'Skills', 'Awards', 'Education'],
    formatting: {
      style: 'Creative and visually appealing',
      emphasis: 'Portfolio and creative achievements',
      layout: 'Visual-focused with creative highlights'
    },
    colorSchemes: [
      { primary: '#ec4899', secondary: '#be185d', accent: '#f472b6', name: 'Creative Pink' },
      { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa', name: 'Artistic Purple' },
      { primary: '#06b6d4', secondary: '#0891b2', accent: '#67e8f9', name: 'Design Cyan' },
      { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24', name: 'Vibrant Orange' }
    ],
    templateMetadata: {
      font_family: 'Helvetica',
      font_size: 11,
      bullet_style: 'circle',
      spacing: 'relaxed',
      category: 'creative',
      style: 'modern'
    }
  }
];

export default function IndustryTemplates({ onTemplateSelect, selectedIndustry }: IndustryTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(selectedIndustry || null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedColorSchemes, setSelectedColorSchemes] = useState<{[key: string]: number}>({});

  const handleTemplateClick = (template: IndustryTemplate) => {
    setSelectedTemplate(template.id);
    setExpandedTemplate(expandedTemplate === template.id ? null : template.id);
  };

  const handleColorSchemeSelect = (templateId: string, colorSchemeIndex: number) => {
    setSelectedColorSchemes(prev => ({
      ...prev,
      [templateId]: colorSchemeIndex
    }));
  };

  const handleSelectTemplate = (template: IndustryTemplate) => {
    // Include selected color scheme in the template
    const colorSchemeIndex = selectedColorSchemes[template.id] || 0;
    const templateWithColorScheme = {
      ...template,
      selectedColorScheme: template.colorSchemes[colorSchemeIndex]
    };
    onTemplateSelect(templateWithColorScheme);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Industry-Specific Templates
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose a template tailored to your industry with specialized formatting, 
          relevant keywords, and role-specific content suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {industryTemplates.map((template) => {
          const IconComponent = template.icon;
          const isExpanded = expandedTemplate === template.id;
          const isSelected = selectedTemplate === template.id;

          return (
            <div
              key={template.id}
              className={`border rounded-lg transition-all duration-200 hover:shadow-lg ${
                isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
              }`}
            >
              <div
                className={`p-6 cursor-pointer ${
                  isSelected ? 'bg-blue-50' : 'bg-white'
                }`}
                onClick={() => handleTemplateClick(template)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${template.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${template.color}`} />
                  </div>
                  <ChevronRightIcon 
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`} 
                  />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.roles.slice(0, 3).map((role, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {role}
                    </span>
                  ))}
                  {template.roles.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      +{template.roles.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-gray-50 p-6 space-y-4">
                  {/* Key Skills */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.keySkills.map((skill, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full ${template.bgColor} ${template.color}`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sample Content Preview */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sample Content</h4>
                    <div className="bg-white p-3 rounded border text-sm">
                      <p className="text-gray-700 italic mb-2">
                        "{template.sampleContent.summary}"
                      </p>
                      <div className="space-y-1">
                        {template.sampleContent.experience.slice(0, 2).map((exp, index) => (
                          <p key={index} className="text-gray-600 text-xs">
                            • {exp}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Formatting Style */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Template Style</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Style:</span>
                        <span className="text-gray-900">{template.formatting.style}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Emphasis:</span>
                        <span className="text-gray-900">{template.formatting.emphasis}</span>
                      </div>
                    </div>
                  </div>

                  {/* Color Schemes */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Color Schemes</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {template.colorSchemes.map((colorScheme, index) => {
                        const isSelectedColorScheme = (selectedColorSchemes[template.id] || 0) === index;
                        return (
                          <button
                            key={index}
                            onClick={() => handleColorSchemeSelect(template.id, index)}
                            className={`p-2 rounded-lg border transition-all ${
                              isSelectedColorScheme 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: colorScheme.primary }}
                                ></div>
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: colorScheme.secondary }}
                                ></div>
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: colorScheme.accent }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {colorScheme.name}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelectTemplate(template)}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Use This Template'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Industry Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mt-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Industry-Optimized Templates
          </h3>
          <p className="text-gray-600 mb-4">
            Our templates are designed based on industry best practices and hiring manager preferences
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">8+</div>
              <div className="text-sm text-gray-600">Industries Covered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">40+</div>
              <div className="text-sm text-gray-600">Role-Specific Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">95%</div>
              <div className="text-sm text-gray-600">ATS Compatibility</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}