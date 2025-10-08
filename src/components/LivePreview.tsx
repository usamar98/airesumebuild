import { ResumeData } from '../types';
import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

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

interface LivePreviewProps {
  data: ResumeData;
  template?: TemplateMetadata;
  onSectionOrderChange?: (newOrder: string[]) => void;
  onSectionDelete?: (sectionName: string) => void;
}

export default function LivePreview({ data, template, onSectionOrderChange, onSectionDelete }: LivePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'Personal Info', 'Work Experience', 'Education', 'Skills', 
    'Certifications', 'Projects', 'Volunteer Experience', 'Awards', 
    'Languages', 'References', 'Hobbies & Interests', 
    'Publications', 'Additional Sections'
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );



  // Professional Summary Section
  const ProfessionalSummarySection = () => (
    data.personalInfo.professionalSummary ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          PROFESSIONAL SUMMARY
        </h2>
        <div 
          style={{
            color: '#374151',
            fontSize: styles.fontSize,
            lineHeight: '1.6'
          }}
          dangerouslySetInnerHTML={{ __html: data.personalInfo.professionalSummary }}
        />
      </div>
    ) : null
  );

  // Personal Information Section
  const PersonalInfoSection = () => (
    <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
      <h2 
        className="text-lg font-semibold mb-3 pb-1 border-b"
        style={{
          color: styles.primaryColor,
          fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
          marginBottom: `${12 * styles.spacing}px`,
          paddingBottom: `${4 * styles.spacing}px`
        }}
      >
        PERSONAL INFORMATION
      </h2>
      <div className="space-y-2">
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.personalInfo.github && (
            <p style={{ color: '#374151', fontSize: styles.fontSize }}>
              <strong>GitHub:</strong> {data.personalInfo.github}
            </p>
          )}
          {data.personalInfo.portfolio && (
            <p style={{ color: '#374151', fontSize: styles.fontSize }}>
              <strong>Portfolio:</strong> {data.personalInfo.portfolio}
            </p>
          )}
          {data.personalInfo.dateOfBirth && (
            <p style={{ color: '#374151', fontSize: styles.fontSize }}>
              <strong>Date of Birth:</strong> {data.personalInfo.dateOfBirth}
            </p>
          )}
          {data.personalInfo.nationality && (
            <p style={{ color: '#374151', fontSize: styles.fontSize }}>
              <strong>Nationality:</strong> {data.personalInfo.nationality}
            </p>
          )}
        </div>
        
        {/* Languages */}
        {data.personalInfo.languages && data.personalInfo.languages.filter(lang => lang.trim() !== '').length > 0 && (
          <div style={{ marginTop: `${8 * styles.spacing}px` }}>
            <h4 
              className="font-medium mb-2"
              style={{
                color: '#1F2937',
                fontSize: styles.fontSize,
                marginBottom: `${4 * styles.spacing}px`
              }}
            >
              Languages:
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.personalInfo.languages
                .filter(lang => lang.trim() !== '')
                .map((language, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm"
                    style={{
                      fontSize: `${parseInt(styles.fontSize) * 0.9}px`,
                    }}
                  >
                    {language}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (template) {
      setSelectedTemplate(template);
      // Always include all sections, but use template order when available
      const allSections = [
        'Professional Summary', 'Personal Info', 'Work Experience', 'Education', 
        'Skills', 'Certifications', 'Projects', 'Volunteer Experience', 
        'Awards', 'Languages', 'References', 
        'Hobbies & Interests', 'Publications', 'Additional Sections'
      ];
      
      if (template.section_order && template.section_order.length > 0) {
        // Start with essential sections, then add template order, ensuring no duplicates
        const essentialSections = ['Professional Summary', 'Personal Info'];
        const templateOrderFiltered = template.section_order.filter(section => 
          !essentialSections.includes(section)
        );
        const combinedSections = [...essentialSections, ...templateOrderFiltered];
        const uniqueTemplateSections = [...new Set(combinedSections)];
        const missingSections = allSections.filter(section => !uniqueTemplateSections.includes(section));
        setSectionOrder([...uniqueTemplateSections, ...missingSections]);
      } else {
        setSectionOrder(allSections);
      }
    } else {
      setSectionOrder([
        'Professional Summary', 'Personal Info', 'Work Experience', 'Education', 
        'Skills', 'Certifications', 'Projects', 'Volunteer Experience', 
        'Awards', 'Languages', 'References', 
        'Hobbies & Interests', 'Publications', 'Additional Sections'
      ]);
    }
  }, [template]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Notify parent component of the change
        if (onSectionOrderChange) {
          onSectionOrderChange(newOrder.filter(section => section !== 'Personal Info' && section !== 'Professional Summary'));
        }
        
        return newOrder;
      });
    }
  };

  const handleSectionDelete = (sectionName: string) => {
    // Don't allow deletion of essential sections
    if (sectionName === 'Personal Info' || sectionName === 'Professional Summary') {
      return;
    }
    
    setSectionOrder((items) => {
      const newOrder = items.filter(section => section !== sectionName);
      
      // Notify parent component of the change
      if (onSectionDelete) {
        onSectionDelete(sectionName);
      }
      
      return newOrder;
    });
  };

  // Get dynamic styles based on template and uploaded color scheme
  const getStyles = () => {
    const fontFamily = selectedTemplate?.font_family || 'Inter, system-ui, sans-serif';
    const fontSize = selectedTemplate?.font_size || 14;
    
    // Prioritize uploaded color scheme over template colors
    let primaryColor = selectedTemplate?.primary_color || '#3B82F6';
    let secondaryColor = selectedTemplate?.secondary_color || '#6B7280';
    
    // Check if there's a selectedColorScheme from uploaded resume
    if (data.selectedColorScheme) {
      primaryColor = data.selectedColorScheme.primary;
      secondaryColor = data.selectedColorScheme.secondary;
    }
    
    const spacing = selectedTemplate?.spacing === 'compact' ? 0.8 : selectedTemplate?.spacing === 'loose' ? 1.2 : 1;
    
    return {
      fontFamily,
      fontSize: `${fontSize}px`,
      primaryColor,
      secondaryColor,
      spacing
    };
  };

  const getBulletChar = (bulletStyle: string) => {
    switch (bulletStyle) {
      case 'circle': return '●';
      case 'square': return '■';
      case 'dash': return '–';
      default: return '•';
    }
  };

  const styles = getStyles();
  const bulletChar = getBulletChar(selectedTemplate?.bullet_style || 'bullet');

  // Sortable Section Component
  const SortableSection = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const canDelete = id !== 'Personal Info' && id !== 'Professional Summary';

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group"
      >
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-2 opacity-60 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical className="h-5 w-5 text-gray-500" />
        </div>
        {canDelete && (
          <button
            onClick={() => handleSectionDelete(id)}
            className="absolute -right-1 top-2 opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 z-10 shadow-sm"
            title={`Delete ${id} section`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {children}
      </div>
    );
  };

  // Section components
  const WorkExperienceSection = () => (
    data.workExperience.length > 0 ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          WORK EXPERIENCE
        </h2>
        <div className="space-y-4">
          {data.workExperience.map((exp, index) => (
            <div key={exp.id || index} style={{ marginBottom: `${16 * styles.spacing}px` }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 
                    className="font-medium"
                    style={{
                      color: '#1F2937',
                      fontSize: `${parseInt(styles.fontSize) * 1.1}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {exp.jobTitle || 'Job Title'}
                  </h3>
                  <p 
                    style={{
                      color: '#4B5563',
                      fontSize: styles.fontSize,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {exp.company || 'Company Name'}
                    {exp.location && ` • ${exp.location}`}
                  </p>
                  {(exp.industry || exp.companySize) && (
                    <p 
                      style={{
                        color: '#6B7280',
                        fontSize: `${parseInt(styles.fontSize) * 0.9}px`,
                        marginBottom: `${2 * styles.spacing}px`
                      }}
                    >
                      {exp.industry && exp.companySize ? `${exp.industry} • ${exp.companySize}` : exp.industry || exp.companySize}
                    </p>
                  )}
                </div>
                <div 
                  className="text-sm"
                  style={{
                    color: styles.secondaryColor,
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  {exp.startDate || 'Start'} - {exp.endDate || 'Present'}
                </div>
              </div>
              
              {/* Technologies */}
              {exp.technologies && exp.technologies.filter(tech => tech.trim() !== '').length > 0 && (
                <div style={{ marginBottom: `${8 * styles.spacing}px` }}>
                  <div className="flex flex-wrap gap-1">
                    {exp.technologies
                      .filter(tech => tech.trim() !== '')
                      .map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          style={{
                            fontSize: `${parseInt(styles.fontSize) * 0.8}px`,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Team Size */}
              {exp.teamSize && (
                <p 
                  style={{
                    color: '#6B7280',
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`,
                    marginBottom: `${4 * styles.spacing}px`
                  }}
                >
                  Team: {exp.teamSize}
                </p>
              )}
              
              {exp.achievements.filter(achievement => achievement.trim() !== '').length > 0 && (
                <ul className="space-y-1" style={{ marginLeft: `${12 * styles.spacing}px` }}>
                  {exp.achievements
                    .filter(achievement => achievement.trim() !== '')
                    .map((achievement, achievementIndex) => (
                      <li 
                        key={achievementIndex}
                        style={{
                          color: '#374151',
                          fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                          marginBottom: `${3 * styles.spacing}px`
                        }}
                      >
                        <span style={{ marginRight: '8px' }}>{bulletChar}</span>
                        <span dangerouslySetInnerHTML={{ __html: achievement }} />
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    ) : null
  );

  const SkillsSection = () => (
    data.skills.length > 0 ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          SKILLS
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.skills.map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-800 rounded"
              style={{
                fontSize: `${parseInt(styles.fontSize) * 0.9}px`,
                marginBottom: `${2 * styles.spacing}px`
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    ) : null
  );

  // Education Section
  const EducationSection = () => (
    data.education && data.education.length > 0 ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          EDUCATION
        </h2>
        <div className="space-y-4">
          {data.education.map((edu, index) => (
            <div key={edu.id || index} style={{ marginBottom: `${16 * styles.spacing}px` }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 
                    className="font-medium"
                    style={{
                      color: '#1F2937',
                      fontSize: `${parseInt(styles.fontSize) * 1.1}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {edu.degree || 'Degree'}
                  </h3>
                  <p 
                    style={{
                      color: '#4B5563',
                      fontSize: styles.fontSize,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {edu.institution || 'Institution'}
                    {edu.location && ` • ${edu.location}`}
                  </p>
                  {edu.gpa && (
                    <p 
                      style={{
                        color: '#6B7280',
                        fontSize: `${parseInt(styles.fontSize) * 0.9}px`,
                        marginBottom: `${2 * styles.spacing}px`
                      }}
                    >
                      GPA: {edu.gpa}
                    </p>
                  )}
                </div>
                <div 
                  className="text-sm"
                  style={{
                    color: styles.secondaryColor,
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  {edu.startDate || 'Start'} - {edu.endDate || 'Present'}
                </div>
              </div>
              
              {edu.relevantCoursework && edu.relevantCoursework.filter(course => course.trim() !== '').length > 0 && (
                <div style={{ marginBottom: `${8 * styles.spacing}px` }}>
                  <h4 
                    className="font-medium mb-2"
                    style={{
                      color: '#1F2937',
                      fontSize: styles.fontSize,
                      marginBottom: `${4 * styles.spacing}px`
                    }}
                  >
                    Relevant Coursework:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {edu.relevantCoursework
                      .filter(course => course.trim() !== '')
                      .map((course, courseIndex) => (
                        <span
                          key={courseIndex}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          style={{
                            fontSize: `${parseInt(styles.fontSize) * 0.8}px`,
                          }}
                        >
                          {course}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              
              {edu.honors && edu.honors.filter(honor => honor.trim() !== '').length > 0 && (
                <div style={{ marginBottom: `${8 * styles.spacing}px` }}>
                  <h4 
                    className="font-medium mb-2"
                    style={{
                      color: '#1F2937',
                      fontSize: styles.fontSize,
                      marginBottom: `${4 * styles.spacing}px`
                    }}
                  >
                    Honors & Awards:
                  </h4>
                  <ul className="space-y-1" style={{ marginLeft: `${12 * styles.spacing}px` }}>
                    {edu.honors
                      .filter(honor => honor.trim() !== '')
                      .map((honor, honorIndex) => (
                        <li 
                          key={honorIndex}
                          style={{
                            color: '#374151',
                            fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                            marginBottom: `${3 * styles.spacing}px`
                          }}
                        >
                          <span style={{ marginRight: '8px' }}>{bulletChar}</span>
                          <span>{honor}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              
              {edu.thesis && (
                <div style={{ marginBottom: `${8 * styles.spacing}px` }}>
                  <h4 
                    className="font-medium mb-2"
                    style={{
                      color: '#1F2937',
                      fontSize: styles.fontSize,
                      marginBottom: `${4 * styles.spacing}px`
                    }}
                  >
                    Thesis/Capstone:
                  </h4>
                  <div 
                    style={{
                      color: '#374151',
                      fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                      lineHeight: '1.6'
                    }}
                    dangerouslySetInnerHTML={{ __html: edu.thesis }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ) : null
  );

  // Certifications Section
  const CertificationsSection = () => {
    console.log('CertificationsSection called, data.certifications:', data.certifications);
    return data.certifications && data.certifications.length > 0 ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          CERTIFICATIONS & LICENSES
        </h2>
        <div className="space-y-3">
          {data.certifications.map((cert, index) => (
            <div key={cert.id || index} style={{ marginBottom: `${12 * styles.spacing}px` }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 
                    className="font-medium"
                    style={{
                      color: '#1F2937',
                      fontSize: `${parseInt(styles.fontSize) * 1.05}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {cert.name || 'Certification Name'}
                  </h3>
                  <p 
                    style={{
                      color: '#4B5563',
                      fontSize: styles.fontSize,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {cert.issuingOrganization || 'Issuing Organization'}
                  </p>
                  {cert.credentialId && (
                    <p 
                      style={{
                        color: '#6B7280',
                        fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                      }}
                    >
                      Credential ID: {cert.credentialId}
                    </p>
                  )}
                </div>
                <div 
                  className="text-sm text-right"
                  style={{
                    color: styles.secondaryColor,
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  <div>{cert.issueDate || 'Issue Date'}</div>
                  {cert.expirationDate && (
                    <div>Expires: {cert.expirationDate}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null;
  };

  // Projects Section
  const ProjectsSection = () => {
    return data.projects && data.projects.length > 0 ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          PROJECTS
        </h2>
        <div className="space-y-4">
          {data.projects.map((project, index) => (
            <div key={project.id || index} style={{ marginBottom: `${16 * styles.spacing}px` }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 
                    className="font-medium"
                    style={{
                      color: '#1F2937',
                      fontSize: `${parseInt(styles.fontSize) * 1.1}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {project.name || 'Project Name'}
                  </h3>
                  {(project.githubUrl || project.liveUrl) && (
                    <div style={{ marginBottom: `${4 * styles.spacing}px` }}>
                      {project.githubUrl && (
                        <span 
                          style={{
                            color: '#6B7280',
                            fontSize: `${parseInt(styles.fontSize) * 0.9}px`,
                            marginRight: '12px'
                          }}
                        >
                          GitHub: {project.githubUrl}
                        </span>
                      )}
                      {project.liveUrl && (
                        <span 
                          style={{
                            color: '#6B7280',
                            fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                          }}
                        >
                          Live: {project.liveUrl}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div 
                  className="text-sm"
                  style={{
                    color: styles.secondaryColor,
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  {project.startDate || 'Start'} - {project.endDate || 'Present'}
                </div>
              </div>
              
              {project.technologies && project.technologies.filter(tech => tech.trim() !== '').length > 0 && (
                <div style={{ marginBottom: `${8 * styles.spacing}px` }}>
                  <div className="flex flex-wrap gap-1">
                    {project.technologies
                      .filter(tech => tech.trim() !== '')
                      .map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                          style={{
                            fontSize: `${parseInt(styles.fontSize) * 0.8}px`,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              
              {project.description && (
                <div 
                  style={{
                    color: '#374151',
                    fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                    lineHeight: '1.6',
                    marginBottom: `${8 * styles.spacing}px`
                  }}
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              )}
              
              {project.highlights && project.highlights.filter(highlight => highlight.trim() !== '').length > 0 && (
                <ul className="space-y-1" style={{ marginLeft: `${12 * styles.spacing}px` }}>
                  {project.highlights
                    .filter(highlight => highlight.trim() !== '')
                    .map((highlight, highlightIndex) => (
                      <li 
                        key={highlightIndex}
                        style={{
                          color: '#374151',
                          fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                          marginBottom: `${3 * styles.spacing}px`
                        }}
                      >
                        <span style={{ marginRight: '8px' }}>{bulletChar}</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    ) : null;
  };

  // Volunteer Experience Section
  const VolunteerExperienceSection = () => {
    console.log('VolunteerExperienceSection called, data.volunteerExperience:', data.volunteerExperience);
    return data.volunteerExperience && data.volunteerExperience.length > 0 ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          VOLUNTEER EXPERIENCE
        </h2>
        <div className="space-y-4">
          {data.volunteerExperience.map((volunteer, index) => (
            <div key={volunteer.id || index} style={{ marginBottom: `${16 * styles.spacing}px` }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 
                    className="font-medium"
                    style={{
                      color: '#1F2937',
                      fontSize: `${parseInt(styles.fontSize) * 1.1}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {volunteer.role || 'Volunteer Role'}
                  </h3>
                  <p 
                    style={{
                      color: '#4B5563',
                      fontSize: styles.fontSize,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {volunteer.organization || 'Organization'}
                    {volunteer.location && ` • ${volunteer.location}`}
                  </p>
                  {volunteer.hoursPerWeek && (
                    <p 
                      style={{
                        color: '#6B7280',
                        fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                      }}
                    >
                      {volunteer.hoursPerWeek} hours/week
                    </p>
                  )}
                </div>
                <div 
                  className="text-sm"
                  style={{
                    color: styles.secondaryColor,
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  {volunteer.startDate || 'Start'} - {volunteer.endDate || 'Present'}
                </div>
              </div>
              
              {volunteer.description && (
                <div 
                  style={{
                    color: '#374151',
                    fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                    lineHeight: '1.6',
                    marginBottom: `${8 * styles.spacing}px`
                  }}
                  dangerouslySetInnerHTML={{ __html: volunteer.description }}
                />
              )}
              
              {volunteer.impact && (
                <div 
                  style={{
                    color: '#374151',
                    fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                    lineHeight: '1.6'
                  }}
                  dangerouslySetInnerHTML={{ __html: volunteer.impact }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    ) : null;
  };

  // Awards Section
  const AwardsSection = () => {
    console.log('AwardsSection called, data.awards:', data.awards);
    return data.awards && data.awards.length > 0 ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          AWARDS & ACHIEVEMENTS
        </h2>
        <div className="space-y-3">
          {data.awards.map((award, index) => (
            <div key={award.id || index} style={{ marginBottom: `${12 * styles.spacing}px` }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 
                    className="font-medium"
                    style={{
                      color: '#1F2937',
                      fontSize: `${parseInt(styles.fontSize) * 1.05}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {award.name || 'Award Name'}
                  </h3>
                  <p 
                    style={{
                      color: '#4B5563',
                      fontSize: styles.fontSize,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {award.organization || 'Organization'}
                  </p>
                  {award.category && (
                    <p 
                      style={{
                        color: '#6B7280',
                        fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                      }}
                    >
                      Category: {award.category}
                    </p>
                  )}
                </div>
                <div 
                  className="text-sm"
                  style={{
                    color: styles.secondaryColor,
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  {award.date || 'Date'}
                </div>
              </div>
              
              {award.description && (
                <div 
                  style={{
                    color: '#374151',
                    fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                    lineHeight: '1.6',
                    marginTop: `${8 * styles.spacing}px`
                  }}
                  dangerouslySetInnerHTML={{ __html: award.description }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    ) : null;
  };

  // Languages Section
  const LanguagesSection = () => {
    console.log('LanguagesSection called, data.languageSkills:', data.languageSkills);
    return data.languageSkills && data.languageSkills.length > 0 ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          LANGUAGES
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {data.languageSkills.map((language, index) => (
            <div key={language.id || index} style={{ marginBottom: `${8 * styles.spacing}px` }}>
              <div className="flex justify-between items-center">
                <span 
                  className="font-medium"
                  style={{
                    color: '#1F2937',
                    fontSize: styles.fontSize
                  }}
                >
                  {language.name || 'Language'}
                </span>
                <span 
                  style={{
                    color: '#6B7280',
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  {language.proficiency || 'Proficiency'}
                </span>
              </div>
              {language.certification && (
                <p 
                  style={{
                    color: '#6B7280',
                    fontSize: `${parseInt(styles.fontSize) * 0.85}px`,
                    marginTop: `${2 * styles.spacing}px`
                  }}
                >
                  Certified: {language.certification}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    ) : null;
  };

  // References Section
  const ReferencesSection = () => {
    console.log('ReferencesSection called, data.references:', data.references);
    return data.references && data.references.length > 0 ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          REFERENCES
        </h2>
        {data.availableOnRequest ? (
          <p 
            style={{
              color: '#374151',
              fontSize: styles.fontSize,
              fontStyle: 'italic'
            }}
          >
            Available upon request
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.references.map((reference, index) => (
              <div key={reference.id || index} style={{ marginBottom: `${12 * styles.spacing}px` }}>
                <h3 
                  className="font-medium"
                  style={{
                    color: '#1F2937',
                    fontSize: `${parseInt(styles.fontSize) * 1.05}px`,
                    marginBottom: `${2 * styles.spacing}px`
                  }}
                >
                  {reference.name || 'Reference Name'}
                </h3>
                <p 
                  style={{
                    color: '#4B5563',
                    fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                    marginBottom: `${2 * styles.spacing}px`
                  }}
                >
                  {reference.title || 'Title'}
                </p>
                <p 
                  style={{
                    color: '#4B5563',
                    fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                    marginBottom: `${2 * styles.spacing}px`
                  }}
                >
                  {reference.company || 'Company'}
                </p>
                <p 
                  style={{
                    color: '#6B7280',
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`,
                    marginBottom: `${1 * styles.spacing}px`
                  }}
                >
                  {reference.email || 'Email'}
                </p>
                <p 
                  style={{
                    color: '#6B7280',
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  {reference.phone || 'Phone'}
                </p>
                {reference.relationship && (
                  <p 
                    style={{
                      color: '#6B7280',
                      fontSize: `${parseInt(styles.fontSize) * 0.85}px`,
                      marginTop: `${4 * styles.spacing}px`,
                      fontStyle: 'italic'
                    }}
                  >
                    Relationship: {reference.relationship}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ) : null;
  };

  // Additional Sections
  const AdditionalSectionsSection = () => {
    const hasPublications = data.publications && data.publications.length > 0;
    const hasPatents = data.patents && data.patents.length > 0;
    const hasSpeaking = data.speakingEngagements && data.speakingEngagements.length > 0;
    const hasMemberships = data.professionalMemberships && data.professionalMemberships.length > 0;
    const hasHobbies = data.hobbies && Array.isArray(data.hobbies) && data.hobbies.length > 0;
    
    const hasAnyAdditionalContent = hasPublications || hasPatents || hasSpeaking || hasMemberships || hasHobbies;
    
    return hasAnyAdditionalContent && (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        {/* Publications */}
        {hasPublications && (
          <div style={{ marginBottom: `${20 * styles.spacing}px` }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 border-b"
              style={{
                color: styles.primaryColor,
                fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
                marginBottom: `${12 * styles.spacing}px`,
                paddingBottom: `${4 * styles.spacing}px`
              }}
            >
              PUBLICATIONS
            </h2>
            <div className="space-y-3">
              {data.publications.map((publication, index) => (
                <div key={publication.id || index} style={{ marginBottom: `${12 * styles.spacing}px` }}>
                  <h3 
                    className="font-medium"
                    style={{
                      color: '#1F2937',
                      fontSize: `${parseInt(styles.fontSize) * 1.05}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {publication.title || 'Publication Title'}
                  </h3>
                  <p 
                    style={{
                      color: '#4B5563',
                      fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {publication.journal || 'Journal'} • {publication.date || 'Date'}
                  </p>
                  {publication.doi && (
                    <p 
                      style={{
                        color: '#6B7280',
                        fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                      }}
                    >
                      DOI: {publication.doi}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Patents */}
        {hasPatents && (
          <div style={{ marginBottom: `${20 * styles.spacing}px` }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 border-b"
              style={{
                color: styles.primaryColor,
                fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
                marginBottom: `${12 * styles.spacing}px`,
                paddingBottom: `${4 * styles.spacing}px`
              }}
            >
              PATENTS
            </h2>
            <div className="space-y-3">
              {data.patents.map((patent, index) => (
                <div key={patent.id || index} style={{ marginBottom: `${12 * styles.spacing}px` }}>
                  <h3 
                    className="font-medium"
                    style={{
                      color: '#1F2937',
                      fontSize: `${parseInt(styles.fontSize) * 1.05}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {patent.title || 'Patent Title'}
                  </h3>
                  <p 
                    style={{
                      color: '#4B5563',
                      fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    Patent #{patent.patentNumber || 'Number'} • {patent.date || 'Date'}
                  </p>
                  <p 
                    style={{
                      color: '#6B7280',
                      fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                    }}
                  >
                    Status: {patent.status || 'Status'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Speaking Engagements */}
        {hasSpeaking && (
          <div style={{ marginBottom: `${20 * styles.spacing}px` }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 border-b"
              style={{
                color: styles.primaryColor,
                fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
                marginBottom: `${12 * styles.spacing}px`,
                paddingBottom: `${4 * styles.spacing}px`
              }}
            >
              SPEAKING ENGAGEMENTS
            </h2>
            <div className="space-y-3">
              {data.speakingEngagements.map((speaking, index) => (
                <div key={speaking.id || index} style={{ marginBottom: `${12 * styles.spacing}px` }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 
                        className="font-medium"
                        style={{
                          color: '#1F2937',
                          fontSize: `${parseInt(styles.fontSize) * 1.05}px`,
                          marginBottom: `${2 * styles.spacing}px`
                        }}
                      >
                        {speaking.title || 'Speaking Title'}
                      </h3>
                      <p 
                        style={{
                          color: '#4B5563',
                          fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                          marginBottom: `${2 * styles.spacing}px`
                        }}
                      >
                        {speaking.event || 'Event'}
                        {speaking.location && ` • ${speaking.location}`}
                      </p>
                    </div>
                    <div 
                      style={{
                        color: styles.secondaryColor,
                        fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                      }}
                    >
                      {speaking.date || 'Date'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Professional Memberships */}
        {hasMemberships && (
          <div style={{ marginBottom: `${20 * styles.spacing}px` }}>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 border-b"
              style={{
                color: styles.primaryColor,
                fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
                marginBottom: `${12 * styles.spacing}px`,
                paddingBottom: `${4 * styles.spacing}px`
              }}
            >
              PROFESSIONAL MEMBERSHIPS
            </h2>
            <div className="space-y-2">
              {data.professionalMemberships.map((membership, index) => (
                <div key={membership.id || index} style={{ marginBottom: `${8 * styles.spacing}px` }}>
                  <div className="flex justify-between items-center">
                    <span 
                      className="font-medium"
                      style={{
                        color: '#1F2937',
                        fontSize: styles.fontSize
                      }}
                    >
                      {membership.organization || 'Organization'}
                    </span>
                    <span 
                      style={{
                        color: '#6B7280',
                        fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                      }}
                    >
                      {membership.role || 'Member'}
                    </span>
                  </div>
                  {membership.startDate && (
                    <p 
                      style={{
                        color: '#6B7280',
                        fontSize: `${parseInt(styles.fontSize) * 0.85}px`,
                        marginTop: `${2 * styles.spacing}px`
                      }}
                    >
                      Since {membership.startDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Hobbies & Interests */}
        {hasHobbies && (
          <div>
            <h2 
              className="text-lg font-semibold mb-3 pb-1 border-b"
              style={{
                color: styles.primaryColor,
                fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
                marginBottom: `${12 * styles.spacing}px`,
                paddingBottom: `${4 * styles.spacing}px`
              }}
            >
              HOBBIES & INTERESTS
            </h2>
            <p 
              style={{
                color: '#374151',
                fontSize: styles.fontSize,
                lineHeight: '1.6'
              }}
            >
              {Array.isArray(data.hobbies) ? data.hobbies.join(', ') : data.hobbies}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Individual section components for better organization
  const SpeakingEngagementsSection = () => {
    const hasSpeaking = data.speakingEngagements && data.speakingEngagements.length > 0;
    return hasSpeaking ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          SPEAKING ENGAGEMENTS
        </h2>
        <div className="space-y-3">
          {data.speakingEngagements.map((speaking, index) => (
            <div key={speaking.id || index} style={{ marginBottom: `${12 * styles.spacing}px` }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 
                    className="font-medium"
                    style={{
                      color: '#1F2937',
                      fontSize: `${parseInt(styles.fontSize) * 1.05}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {speaking.title || 'Speaking Title'}
                  </h3>
                  <p 
                    style={{
                      color: '#4B5563',
                      fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                      marginBottom: `${2 * styles.spacing}px`
                    }}
                  >
                    {speaking.event || 'Event'}
                    {speaking.location && ` • ${speaking.location}`}
                  </p>
                </div>
                <div 
                  style={{
                    color: styles.secondaryColor,
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  {speaking.date || 'Date'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null;
  };

  const ProfessionalMembershipsSection = () => {
    const hasMemberships = data.professionalMemberships && data.professionalMemberships.length > 0;
    return hasMemberships ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          PROFESSIONAL MEMBERSHIPS
        </h2>
        <div className="space-y-2">
          {data.professionalMemberships.map((membership, index) => (
            <div key={membership.id || index} style={{ marginBottom: `${8 * styles.spacing}px` }}>
              <div className="flex justify-between items-center">
                <span 
                  className="font-medium"
                  style={{
                    color: '#1F2937',
                    fontSize: styles.fontSize
                  }}
                >
                  {membership.organization || 'Organization'}
                </span>
                <span 
                  style={{
                    color: '#6B7280',
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  {membership.role || 'Member'}
                </span>
              </div>
              {membership.startDate && (
                <p 
                  style={{
                    color: '#6B7280',
                    fontSize: `${parseInt(styles.fontSize) * 0.85}px`,
                    marginTop: `${2 * styles.spacing}px`
                  }}
                >
                  Since {membership.startDate}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    ) : null;
  };

  const PublicationsSection = () => {
    const hasPublications = data.publications && data.publications.length > 0;
    return hasPublications ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          PUBLICATIONS
        </h2>
        <div className="space-y-3">
          {data.publications.map((publication, index) => (
            <div key={publication.id || index} style={{ marginBottom: `${12 * styles.spacing}px` }}>
              <h3 
                className="font-medium"
                style={{
                  color: '#1F2937',
                  fontSize: `${parseInt(styles.fontSize) * 1.05}px`,
                  marginBottom: `${2 * styles.spacing}px`
                }}
              >
                {publication.title || 'Publication Title'}
              </h3>
              <p 
                style={{
                  color: '#4B5563',
                  fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                  marginBottom: `${2 * styles.spacing}px`
                }}
              >
                {publication.journal || 'Journal'} • {publication.date || 'Date'}
              </p>
              {publication.doi && (
                <p 
                  style={{
                    color: '#6B7280',
                    fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                  }}
                >
                  DOI: {publication.doi}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    ) : null;
  };

  const PatentsSection = () => {
    const hasPatents = data.patents && data.patents.length > 0;
    return hasPatents ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          PATENTS
        </h2>
        <div className="space-y-3">
          {data.patents.map((patent, index) => (
            <div key={patent.id || index} style={{ marginBottom: `${12 * styles.spacing}px` }}>
              <h3 
                className="font-medium"
                style={{
                  color: '#1F2937',
                  fontSize: `${parseInt(styles.fontSize) * 1.05}px`,
                  marginBottom: `${2 * styles.spacing}px`
                }}
              >
                {patent.title || 'Patent Title'}
              </h3>
              <p 
                style={{
                  color: '#4B5563',
                  fontSize: `${parseInt(styles.fontSize) * 0.95}px`,
                  marginBottom: `${2 * styles.spacing}px`
                }}
              >
                Patent #{patent.patentNumber || 'Number'} • {patent.date || 'Date'}
              </p>
              <p 
                style={{
                  color: '#6B7280',
                  fontSize: `${parseInt(styles.fontSize) * 0.9}px`
                }}
              >
                Status: {patent.status || 'Status'}
              </p>
            </div>
          ))}
        </div>
      </div>
    ) : null;
  };

  const HobbiesSection = () => {
    const hasHobbies = data.hobbies && Array.isArray(data.hobbies) && data.hobbies.filter(hobby => hobby.trim() !== '').length > 0;
    return hasHobbies ? (
      <div className="mb-6" style={{ marginBottom: `${24 * styles.spacing}px` }}>
        <h2 
          className="text-lg font-semibold mb-3 pb-1 border-b"
          style={{
            color: styles.primaryColor,
            fontSize: `${parseInt(styles.fontSize) * 1.3}px`,
            marginBottom: `${12 * styles.spacing}px`,
            paddingBottom: `${4 * styles.spacing}px`
          }}
        >
          HOBBIES & INTERESTS
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.hobbies
            .filter(hobby => hobby.trim() !== '')
            .map((hobby, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                style={{
                  fontSize: `${parseInt(styles.fontSize) * 0.9}px`,
                  backgroundColor: `${styles.primaryColor}15`,
                  color: styles.primaryColor
                }}
              >
                {hobby}
              </span>
            ))}
        </div>
      </div>
    ) : null;
  };

  // Map section names to components - using unique mappings only
  const sectionComponents: { [key: string]: () => JSX.Element | null } = {
    'Professional Summary': ProfessionalSummarySection,
    'Personal Info': PersonalInfoSection,
    'Work Experience': WorkExperienceSection,
    'Skills': SkillsSection,
    'Education': EducationSection,
    'Certifications': CertificationsSection,
    'Projects': ProjectsSection,
    'Volunteer Experience': VolunteerExperienceSection,
    'Awards': AwardsSection,
    'Languages': LanguagesSection,
    'References': ReferencesSection,
    'Additional Sections': AdditionalSectionsSection,
    'Hobbies & Interests': HobbiesSection,
    'Speaking Engagements': SpeakingEngagementsSection,
    'Professional Memberships': ProfessionalMembershipsSection,
    'Publications': PublicationsSection,
    'Patents': PatentsSection,
  };

  // Debug: Log the data to see what sections have content
  console.log('LivePreview data:', {
    certifications: data.certifications?.length || 0,
    volunteerExperience: data.volunteerExperience?.length || 0,
    awards: data.awards?.length || 0,
    languageSkills: data.languageSkills?.length || 0,
    languages: data.languageSkills?.length || 0,
    references: data.references?.length || 0,
    publications: data.publications?.length || 0,
    patents: data.patents?.length || 0,
    hobbies: data.hobbies
  });
  
  // Debug: Log the current sectionOrder
  console.log('Current sectionOrder:', sectionOrder);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div 
        className="bg-white border border-gray-200 rounded-lg shadow-sm h-full overflow-auto"
        style={{ fontFamily: styles.fontFamily, paddingLeft: '3rem' }}
      >
        <div className="p-6">
          {/* Header Section */}
          <div 
            className="mb-6 pb-4 border-b-2"
            style={{
              borderColor: styles.primaryColor,
              marginBottom: `${24 * styles.spacing}px`,
              paddingBottom: `${16 * styles.spacing}px`
            }}
          >
            <div className="flex items-start justify-between w-full">
              {/* Name and Contact Info - Left Corner */}
              <div className="flex-1 text-left">
                <h1 
                  className="font-bold mb-3"
                  style={{
                    color: '#1F2937',
                    fontSize: `${parseInt(styles.fontSize) * 2.2}px`,
                    marginBottom: `${12 * styles.spacing}px`
                  }}
                >
                  {data.personalInfo.fullName || 'Your Name'}
                </h1>
                <div className="space-y-2">
              {data.personalInfo.email && (
                <div 
                  className="flex items-center mb-2"
                  style={{
                    color: '#374151',
                    fontSize: `${parseInt(styles.fontSize) * 1}px`,
                    marginBottom: `${4 * styles.spacing}px`
                  }}
                >
                  <span className="mr-2" style={{ fontWeight: '600', color: styles.primaryColor }}>Email:</span> 
                  <span>{data.personalInfo.email}</span>
                </div>
              )}
              {data.personalInfo.phone && (
                <div 
                  className="flex items-center mb-2"
                  style={{
                    color: '#374151',
                    fontSize: `${parseInt(styles.fontSize) * 1}px`,
                    marginBottom: `${4 * styles.spacing}px`
                  }}
                >
                  <span className="mr-2" style={{ fontWeight: '600', color: styles.primaryColor }}>Phone:</span> 
                  <span>{data.personalInfo.phone}</span>
                </div>
              )}
              {data.personalInfo.linkedin && (
                <div 
                  className="flex items-center mb-2"
                  style={{
                    color: '#374151',
                    fontSize: `${parseInt(styles.fontSize) * 1}px`,
                    marginBottom: `${4 * styles.spacing}px`
                  }}
                >
                  <span className="mr-2" style={{ fontWeight: '600', color: styles.primaryColor }}>LinkedIn:</span> 
                  <span>{data.personalInfo.linkedin}</span>
                </div>
              )}
              {data.personalInfo.address && (
                <div 
                  className="flex items-center mb-2"
                  style={{
                    color: '#374151',
                    fontSize: `${parseInt(styles.fontSize) * 1}px`,
                    marginBottom: `${4 * styles.spacing}px`
                  }}
                >
                  <span className="mr-2" style={{ fontWeight: '600', color: styles.primaryColor }}>Address:</span> 
                  <span>{data.personalInfo.address}</span>
                </div>
              )}
            </div>
              </div>
              
              {/* Profile Image - Right Corner */}
              <div className="flex-shrink-0 ml-8">
                {data.personalInfo.profileImage && (
                  <img
                    src={data.personalInfo.profileImage}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-2 shadow-lg"
                    style={{
                      borderColor: styles.primaryColor,
                      width: `${112 * styles.spacing}px`,
                      height: `${112 * styles.spacing}px`
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Draggable Sections */}
           <SortableContext
             items={sectionOrder}
             strategy={verticalListSortingStrategy}
           >
             {[...new Set(sectionOrder)].map((sectionName) => {
               const SectionComponent = sectionComponents[sectionName as keyof typeof sectionComponents];
               if (!SectionComponent) return null;
               
               // Let each section component handle its own data validation
               // Remove the hasData check here since components already check for data internally
               return (
                 <SortableSection key={sectionName} id={sectionName}>
                   <SectionComponent />
                 </SortableSection>
               );
             })}
           </SortableContext>

          {/* Empty state */}
          {!data.personalInfo.fullName && data.workExperience.length === 0 && data.skills.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Start filling out your resume information to see a live preview here.</p>
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}