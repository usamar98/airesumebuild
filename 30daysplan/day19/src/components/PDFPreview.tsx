import { useState, useEffect } from 'react';
import { ResumeData } from '@/types';
import { DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import { generatePDFBlob, TemplateMetadata } from '@/lib/pdfGenerator';
import { generateAlternativePDF } from '@/lib/jsPdfGenerator';

interface PDFPreviewProps {
  data: ResumeData;
  sectionOrder?: string[];
  template?: TemplateMetadata;
}

export default function PDFPreview({ data, sectionOrder, template }: PDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Expose functions to window for debugging
  useEffect(() => {
    console.log('🔧 PDFPreview component mounted, exposing debug functions...');
    (window as any).generatePDF = generatePDF;
    (window as any).generateAlternativePDF = generateAlternativePDF;
    console.log('🔧 Debug functions exposed to window:', {
      generatePDF: typeof (window as any).generatePDF,
      generateAlternativePDF: typeof (window as any).generateAlternativePDF
    });
    
    // Log component data for debugging
    console.log('🔧 PDFPreview data:', {
      personalInfoName: data?.personalInfo?.fullName,
      workExperienceCount: data?.workExperience?.length,
      educationCount: data?.education?.length,
      skillsCount: data?.skills?.length
    });
    
    return () => {
      delete (window as any).generatePDF;
      delete (window as any).generateAlternativePDF;
    };
  }, []);

  // Debug: Log data received by PDFPreview
  console.log('PDFPreview - Received data:', {
    personalInfo: data.personalInfo,
    workExperience: data.workExperience?.length || 0,
    skills: data.skills?.length || 0,
    education: data.education?.length || 0,
    certifications: data.certifications?.length || 0,
    projects: data.projects?.length || 0,
    volunteerExperience: data.volunteerExperience?.length || 0,
    awards: data.awards?.length || 0,
    languageSkills: data.languageSkills?.length || 0,
    references: data.references?.length || 0,
    publications: data.publications?.length || 0,
    patents: data.patents?.length || 0,
    speakingEngagements: data.speakingEngagements?.length || 0,
    professionalMemberships: data.professionalMemberships?.length || 0,
    hobbies: data.hobbies?.length || 0
  });
  console.log('PDFPreview - Received sectionOrder:', sectionOrder);
  console.log('PDFPreview - Received template:', template);

  const generatePDF = async () => {
    console.log('🔄 Starting PDF generation...');
    console.log('📊 Input data validation:', {
      hasData: !!data,
      personalInfo: {
        exists: !!data?.personalInfo,
        fullName: data?.personalInfo?.fullName,
        email: data?.personalInfo?.email
      },
      workExperience: {
        exists: !!data?.workExperience,
        count: data?.workExperience?.length || 0,
        firstItem: data?.workExperience?.[0]
      },
      education: {
        exists: !!data?.education,
        count: data?.education?.length || 0
      },
      skills: {
        exists: !!data?.skills,
        count: data?.skills?.length || 0
      },
      sectionOrder: {
        exists: !!sectionOrder,
        count: sectionOrder?.length || 0,
        sections: sectionOrder
      },
      template: {
        exists: !!template,
        id: template?.id,
        name: template?.name
      }
    });
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Debug: Log the data being passed to PDF generator
      console.log('PDFPreview - Data being passed to PDF generator:', {
        personalInfo: data.personalInfo,
        workExperience: data.workExperience,
        skills: data.skills,
        education: data.education,
        certifications: data.certifications,
        projects: data.projects,
        volunteerExperience: data.volunteerExperience,
        awards: data.awards,
        languageSkills: data.languageSkills,
        references: data.references,
        publications: data.publications,
        patents: data.patents,
        speakingEngagements: data.speakingEngagements,
        professionalMemberships: data.professionalMemberships,
        hobbies: data.hobbies,
        availableOnRequest: data.availableOnRequest
      });
      console.log('PDFPreview - Section order:', sectionOrder);
      console.log('PDFPreview - Template:', template);
      
      let blob: Blob;
      
      try {
        // Try the primary PDF generator first (@react-pdf/renderer)
        console.log('🔄 Attempting PDF generation with @react-pdf/renderer...');
        const startTime = performance.now();
        
        blob = await generatePDFBlob(data, template, sectionOrder);
        
        const endTime = performance.now();
        console.log(`✅ PDF generated successfully with @react-pdf/renderer in ${endTime - startTime}ms`);
        console.log('📄 PDF blob info:', {
          size: blob?.size || 'unknown',
          type: blob?.type
        });
      } catch (primaryError) {
        console.error('❌ Primary PDF generation failed:', {
          error: primaryError,
          name: primaryError?.name,
          message: primaryError?.message,
          stack: primaryError?.stack,
          constructor: primaryError?.constructor?.name
        });
        
        // Check if it's a DataView error from react-pdf/renderer
        const isReactPdfError = primaryError instanceof Error && 
          (primaryError.name === 'ReactPDFDataViewError' || 
           primaryError.message === 'REACT_PDF_DATAVIEW_ERROR' ||
           primaryError.message.includes('DataView') ||
           primaryError.message.includes('Offset'));
        
        console.log('🔍 Error analysis:', {
          isReactPdfError,
          errorName: primaryError?.name,
          errorMessage: primaryError?.message,
          willUseFallback: isReactPdfError
        });
        
        if (isReactPdfError) {
          console.log('🔧 Detected react-pdf DataView error, switching to jsPDF fallback...');
        }
        
        // Fallback to alternative jsPDF generator
        try {
          console.log('🔄 Trying jsPDF fallback...');
          blob = await generateAlternativePDF(data);
          console.log('✅ PDF generated successfully with jsPDF fallback');
        } catch (fallbackError) {
          console.error('❌ Both PDF generators failed:', { primaryError, fallbackError });
          throw new Error('PDF generation failed with both primary and fallback methods. Please try again or contact support.');
        }
      }
      
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      console.log('💾 PDF URL created successfully');
    } catch (error) {
      console.error('❌ Final error in generatePDF:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
      console.log('🏁 PDF generation process completed');
    }
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Expose generatePDF function to window object for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.generatePDF = generatePDF;
      console.log('🔧 Debug functions exposed to window object');
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.generatePDF = undefined;
      }
    };
  }, [generatePDF]);

  const isDataComplete = () => {
    const { personalInfo, workExperience, skills } = data;
    return (
      personalInfo.fullName.trim() !== '' &&
      personalInfo.email.trim() !== '' &&
      workExperience.length > 0 &&
      workExperience.every(exp => 
        exp.jobTitle.trim() !== '' && 
        exp.company.trim() !== '' && 
        exp.startDate.trim() !== '' &&
        exp.achievements.some(achievement => achievement.trim() !== '')
      ) &&
      skills.length > 0
    );
  };

  return (
    <div className="space-y-6">
      {/* Resume Preview */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Resume Preview</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review your resume before downloading
          </p>
        </div>
        
        <div className="p-6">
          {/* Personal Information */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {data.personalInfo.fullName || 'Your Name'}
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              {data.personalInfo.email && (
                <div>Email: {data.personalInfo.email}</div>
              )}
              {data.personalInfo.phone && (
                <div>Phone: {data.personalInfo.phone}</div>
              )}
              {data.personalInfo.linkedin && (
                <div>LinkedIn: {data.personalInfo.linkedin}</div>
              )}
              {data.personalInfo.address && (
                <div>Address: {data.personalInfo.address}</div>
              )}
            </div>
          </div>

          {/* Professional Summary */}
          {data.personalInfo.professionalSummary && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Professional Summary
              </h2>
              <div 
                className="text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: data.personalInfo.professionalSummary }}
              />
            </div>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {data.workExperience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Work Experience
              </h2>
              <div className="space-y-4">
                {data.workExperience.map((exp, index) => (
                  <div key={exp.id || index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{exp.jobTitle}</h3>
                        <p className="text-gray-700">{exp.company}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </div>
                    </div>
                    {exp.achievements.filter(achievement => achievement.trim() !== '').length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        {exp.achievements
                          .filter(achievement => achievement.trim() !== '')
                          .map((achievement, achievementIndex) => (
                            <li key={achievementIndex} dangerouslySetInnerHTML={{ __html: achievement }} />
                          ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Education
              </h2>
              <div className="space-y-4">
                {data.education.map((edu, index) => (
                  <div key={edu.id || index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                        <p className="text-gray-700">{edu.institution}</p>
                        {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {edu.startDate} - {edu.endDate || 'Present'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.certifications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Certifications
              </h2>
              <div className="space-y-2">
                {data.certifications.map((cert, index) => (
                  <div key={cert.id || index} className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{cert.name}</h3>
                      <p className="text-gray-700">{cert.issuingOrganization}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {cert.issueDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {data.projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Projects
              </h2>
              <div className="space-y-4">
                {data.projects.map((project, index) => (
                  <div key={project.id || index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        {project.liveUrl && (
                          <p className="text-sm text-blue-600">{project.liveUrl}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {project.startDate} - {project.endDate || 'Present'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{project.description}</p>
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech, techIndex) => (
                          <span key={techIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer Experience */}
          {data.volunteerExperience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Volunteer Experience
              </h2>
              <div className="space-y-4">
                {data.volunteerExperience.map((vol, index) => (
                  <div key={vol.id || index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{vol.role}</h3>
                        <p className="text-gray-700">{vol.organization}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {vol.startDate} - {vol.endDate || 'Present'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{vol.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {data.awards && data.awards.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Awards &amp; Achievements
              </h2>
              <div className="space-y-2">
                {data.awards.map((award, index) => (
                  <div key={award.id || index} className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{award.name}</h3>
                      <p className="text-gray-700">{award.organization}</p>
                      <p className="text-sm text-gray-600">{award.description}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {award.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languageSkills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Languages
              </h2>
              <div className="space-y-2">
                {data.languageSkills.map((lang, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{lang.name}</span>
                    <span className="text-sm text-gray-600">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References */}
          {data.references.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                References
              </h2>
              <div className="space-y-4">
                {data.references.map((ref, index) => (
                  <div key={ref.id || index}>
                    <h3 className="font-medium text-gray-900">{ref.name}</h3>
                    <p className="text-gray-700">{ref.title}</p>
                    <p className="text-gray-700">{ref.company}</p>
                    <div className="text-sm text-gray-600">
                      {ref.email && <div>Email: {ref.email}</div>}
                      {ref.phone && <div>Phone: {ref.phone}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.availableOnRequest && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                References
              </h2>
              <p className="text-sm text-gray-700">Available upon request</p>
            </div>
          )}

          {/* Publications */}
          {data.publications && data.publications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Publications
              </h2>
              <div className="space-y-4">
                {data.publications.map((pub, index) => (
                  <div key={pub.id || index}>
                    <h3 className="font-medium text-gray-900">{pub.title}</h3>
                    <p className="text-gray-700">{pub.authors.join(', ')}</p>
                    <p className="text-gray-700">{pub.publication} ({pub.year})</p>
                    {pub.url && (
                      <p className="text-sm text-blue-600">{pub.url}</p>
                    )}
                    {pub.abstract && (
                      <p className="text-sm text-gray-600 mt-1">{pub.abstract}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patents */}
          {data.patents && data.patents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Patents
              </h2>
              <div className="space-y-4">
                {data.patents.map((patent, index) => (
                  <div key={patent.id || index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{patent.title}</h3>
                        <p className="text-gray-700">Patent #{patent.patentNumber}</p>
                        <p className="text-sm text-gray-600">Status: {patent.status}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {patent.grantDate || patent.filingDate}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{patent.description}</p>
                    {patent.inventors.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Inventors: {patent.inventors.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speaking Engagements */}
          {data.speakingEngagements && data.speakingEngagements.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Speaking Engagements
              </h2>
              <div className="space-y-4">
                {data.speakingEngagements.map((engagement, index) => (
                  <div key={engagement.id || index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{engagement.title}</h3>
                        <p className="text-gray-700">{engagement.event}</p>
                        <p className="text-sm text-gray-600">{engagement.location}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {engagement.date}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{engagement.description}</p>
                    {engagement.audience && (
                      <p className="text-sm text-gray-600 mt-1">
                        Audience: {engagement.audience}
                        {engagement.audienceSize && ` (${engagement.audienceSize} attendees)`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Professional Memberships */}
          {data.professionalMemberships && data.professionalMemberships.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Professional Memberships
              </h2>
              <div className="space-y-4">
                {data.professionalMemberships.map((membership, index) => (
                  <div key={membership.id || index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{membership.organization}</h3>
                        {membership.role && (
                          <p className="text-gray-700">{membership.role}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {membership.startDate} - {membership.endDate || 'Present'}
                      </div>
                    </div>
                    {membership.description && (
                      <p className="text-sm text-gray-700">{membership.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies & Interests */}
          {data.hobbies && data.hobbies.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                Hobbies &amp; Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.hobbies.map((hobby, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!isDataComplete() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Incomplete Resume
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please fill in all required fields (name, email, at least one work experience, and skills) before generating PDF.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={generatePDF}
          disabled={isGenerating || !isDataComplete()}
          className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating PDF...
            </>
          ) : (
            <>
              <EyeIcon className="h-5 w-5 mr-2" />
              Generate PDF Preview
            </>
          )}
        </button>

        {pdfUrl && (
          <button
            onClick={downloadPDF}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Download PDF
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Generating PDF
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {pdfUrl && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">PDF Preview</h3>
          </div>
          <div className="p-4">
            <iframe
              src={pdfUrl}
              className="w-full h-96 border border-gray-300 rounded"
              title="Resume PDF Preview"
            />
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900 mb-1">PDF Generation Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Make sure all required fields are filled before generating</li>
              <li>• The PDF will be formatted professionally and ready for submission</li>
              <li>• You can regenerate the PDF anytime after making changes</li>
              <li>• The downloaded file will be named with your name for easy identification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Type declarations for window object
declare global {
  interface Window {
    generatePDF?: () => void;
    generateAlternativePDF?: (data: ResumeData) => Promise<Blob>;
  }
}

// Expose functions to window object for debugging
if (typeof window !== 'undefined') {
  window.generatePDF = undefined; // Will be set by component instance
  window.generateAlternativePDF = generateAlternativePDF;
}