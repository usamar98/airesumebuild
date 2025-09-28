import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf, Font } from '@react-pdf/renderer';
import { ResumeData } from '../types';

// Font registration temporarily disabled for debugging DataView error
// TODO: Re-enable with proper error handling once DataView issue is resolved
console.log('Font registration disabled - using system fonts only');

export interface TemplateMetadata {
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

// Create dynamic styles based on template
const createStyles = (template?: TemplateMetadata) => {
  // Use safe font fallbacks to prevent DataView errors
  let fontFamily = 'Helvetica'; // Default safe font
  if (template?.font_family) {
    // Only use system fonts - Inter removed to test DataView fix
    const safeFonts = ['Helvetica', 'Times-Roman', 'Courier'];
    fontFamily = safeFonts.includes(template.font_family) ? template.font_family : 'Helvetica';
    console.log('Using font:', fontFamily, 'for template font:', template.font_family);
  }
  
  const fontSize = Math.max(8, Math.min(template?.font_size || 12, 24)); // Clamp font size
  const primaryColor = template?.primary_color || '#3B82F6';
  const secondaryColor = template?.secondary_color || '#6B7280';
  const spacing = template?.spacing === 'compact' ? 0.8 : template?.spacing === 'loose' ? 1.2 : 1;
  
  return StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30 * spacing,
    fontFamily: fontFamily,
  },
  header: {
    marginBottom: 20 * spacing,
    borderBottom: `2 solid ${primaryColor}`,
    paddingBottom: 10 * spacing,
  },
  name: {
    fontSize: Math.round(fontSize * 2),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5 * spacing,
  },
  contactInfo: {
    fontSize: Math.round(fontSize * 0.9),
    color: secondaryColor,
    marginBottom: 2 * spacing,
  },
  section: {
    marginBottom: 20 * spacing,
  },
  sectionTitle: {
    fontSize: Math.round(fontSize * 1.3),
    fontWeight: 'bold',
    color: primaryColor,
    marginBottom: 10 * spacing,
    borderBottom: '1 solid #E5E7EB',
    paddingBottom: 3 * spacing,
  },
  jobTitle: {
    fontSize: Math.round(fontSize * 1.2),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2 * spacing,
  },
  company: {
    fontSize: fontSize,
    color: '#4B5563',
    marginBottom: 2 * spacing,
  },
  dates: {
    fontSize: Math.round(fontSize * 0.8),
    color: secondaryColor,
    marginBottom: 5 * spacing,
  },
  achievement: {
    fontSize: Math.round(fontSize * 0.9),
    color: '#374151',
    marginBottom: 3 * spacing,
    marginLeft: 10 * spacing,
  },
  skill: {
    fontSize: Math.round(fontSize * 0.9),
    color: '#374151',
    marginBottom: 2 * spacing,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5 * spacing,
  },
  });
};

// Get bullet character based on style
const getBulletChar = (bulletStyle: string) => {
  switch (bulletStyle) {
    case 'circle': return '●';
    case 'square': return '■';
    case 'dash': return '–';
    default: return '•';
  }
};

// PDF Document Component
const ResumeDocument = ({ data, template, sectionOrder: customSectionOrder }: { data: ResumeData; template?: TemplateMetadata; sectionOrder?: string[] }) => {
  const styles = createStyles(template);
  const bulletChar = getBulletChar(template?.bullet_style || 'bullet');
  const sectionOrder = customSectionOrder || template?.section_order || [
    'Personal Information', 'Professional Summary', 'Work Experience', 'Education', 'Skills', 
    'Certifications', 'Projects', 'Volunteer Experience', 'Awards & Achievements', 
    'Languages', 'References', 'Hobbies & Interests', 'Publications', 'Patents',
    'Speaking Engagements', 'Professional Memberships'
  ];

  // Section components
  const WorkExperienceSection = () => (
    data.workExperience.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WORK EXPERIENCE</Text>
        {data.workExperience.map((job, index) => (
          <View key={job.id} style={{ marginBottom: 15 }}>
            <Text style={styles.jobTitle}>{safeText(job.jobTitle)}</Text>
            <Text style={styles.company}>{safeText(job.company)}</Text>
            <Text style={styles.dates}>
              {safeText(job.startDate)} - {safeText(job.endDate)}
            </Text>
            {job.achievements.map((achievement, achIndex) => (
              <Text key={achIndex} style={styles.achievement}>
                {bulletChar} {safeText(achievement)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    )
  );

  const SkillsSection = () => (
    data.skills.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SKILLS</Text>
        <View style={styles.skillsContainer}>
          {data.skills.map((skill, index) => (
            <Text key={index} style={styles.skill}>
              {safeText(skill)}{index < data.skills.length - 1 ? ' • ' : ' '}
            </Text>
          ))}
        </View>
      </View>
    )
  );

  const ProfessionalSummarySection = () => (
    data.personalInfo.professionalSummary && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
        <Text style={styles.achievement}>
          {safeText(data.personalInfo.professionalSummary)}
        </Text>
      </View>
    )
  );

  const PersonalInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
      {data.personalInfo.github && data.personalInfo.github.trim().length > 0 && (
        <Text style={styles.contactInfo}>GitHub: {safeText(data.personalInfo.github)}</Text>
      )}
      {data.personalInfo.portfolio && data.personalInfo.portfolio.trim().length > 0 && (
        <Text style={styles.contactInfo}>Portfolio: {safeText(data.personalInfo.portfolio)}</Text>
      )}
      {data.personalInfo.dateOfBirth && data.personalInfo.dateOfBirth.trim().length > 0 && (
        <Text style={styles.contactInfo}>Date of Birth: {safeText(data.personalInfo.dateOfBirth)}</Text>
      )}
      {data.personalInfo.nationality && data.personalInfo.nationality.trim().length > 0 && (
        <Text style={styles.contactInfo}>Nationality: {safeText(data.personalInfo.nationality)}</Text>
      )}
      {data.personalInfo.languages && data.personalInfo.languages.length > 0 && (
        <Text style={styles.contactInfo}>
          Languages: {data.personalInfo.languages.join(', ')}
        </Text>
      )}
    </View>
  );

  const EducationSection = () => (
    data.education && data.education.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EDUCATION</Text>
        {data.education.map((edu, index) => (
          <View key={edu.id} style={{ marginBottom: 15 }}>
            <Text style={styles.jobTitle}>{edu.degree || 'Degree'}</Text>
            <Text style={styles.company}>
              {edu.institution || 'Institution'} ({safeDate(edu.startDate)}-{safeDate(edu.endDate)})
            </Text>
            {edu.gpa && (
              <Text style={styles.contactInfo}>GPA: {edu.gpa}</Text>
            )}
            {edu.relevantCoursework && edu.relevantCoursework.length > 0 && (
              <Text style={styles.achievement}>
                Relevant Coursework: {edu.relevantCoursework.join(', ')}
              </Text>
            )}
            {edu.honors && edu.honors.length > 0 && (
              <Text style={styles.achievement}>
                Honors: {edu.honors.join(', ')}
              </Text>
            )}
          </View>
        ))}
      </View>
    )
  );

  const CertificationsSection = () => (
    data.certifications && data.certifications.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
        {data.certifications.map((cert, index) => (
          <View key={cert.id} style={{ marginBottom: 10 }}>
            <Text style={styles.jobTitle}>{cert.name || 'Certification'}</Text>
            <Text style={styles.company}>
              {cert.issuingOrganization || 'Organization'} ({safeDate(cert.issueDate)})
            </Text>
            {cert.credentialId && (
              <Text style={styles.contactInfo}>Credential ID: {cert.credentialId}</Text>
            )}
          </View>
        ))}
      </View>
    )
  );

  const ProjectsSection = () => (
    data.projects && data.projects.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROJECTS</Text>
        {data.projects.map((project, index) => (
          <View key={project.id} style={{ marginBottom: 15 }}>
            <Text style={styles.jobTitle}>{safeText(project.name)}</Text>
            <Text style={styles.dates}>
              {safeDate(project.startDate)} - {safeDate(project.endDate)}
            </Text>
            {project.technologies && project.technologies.length > 0 && (
              <Text style={styles.achievement}>
                Technologies: {project.technologies.join(', ')}
              </Text>
            )}
            {project.highlights && project.highlights.length > 0 && (
              project.highlights.map((highlight, hlIndex) => (
                <Text key={hlIndex} style={styles.achievement}>
                  {bulletChar} {safeText(highlight)}
                </Text>
              ))
            )}
            {project.githubUrl && project.githubUrl.trim().length > 0 && (
              <Text style={styles.contactInfo}>GitHub: {safeText(project.githubUrl)}</Text>
            )}
            {project.liveUrl && project.liveUrl.trim().length > 0 && (
              <Text style={styles.contactInfo}>Live Demo: {safeText(project.liveUrl)}</Text>
            )}
          </View>
        ))}
      </View>
    )
  );

  const VolunteerExperienceSection = () => {
    if (!data.volunteerExperience || data.volunteerExperience.length === 0) {
      return null;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VOLUNTEER EXPERIENCE</Text>
        {data.volunteerExperience.map((vol, index) => (
          <View key={vol.id} style={{ marginBottom: 15 }}>
            <Text style={styles.jobTitle}>{safeText(vol.role)}</Text>
            <Text style={styles.company}>{safeText(vol.organization)}</Text>
            <Text style={styles.dates}>
              {safeDate(vol.startDate)} - {safeDate(vol.endDate)}
            </Text>
            {vol.hoursPerWeek && String(vol.hoursPerWeek).trim().length > 0 && (
              <Text style={styles.contactInfo}>Hours per week: {safeText(vol.hoursPerWeek?.toString() || '')}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const AwardsSection = () => {
    if (!data.awards || data.awards.length === 0) {
      return null;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AWARDS & ACHIEVEMENTS</Text>
        {data.awards.map((award, index) => (
          <View key={award.id} style={{ marginBottom: 10 }}>
            <Text style={styles.jobTitle}>{safeText(award.name)}</Text>
            <Text style={styles.company}>{safeText(award.organization)}</Text>
            <Text style={styles.dates}>{safeDate(award.date)}</Text>
            {award.category && award.category.trim().length > 0 && (
              <Text style={styles.contactInfo}>Category: {safeText(award.category)}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const LanguagesSection = () => {
    if (!data.languageSkills || data.languageSkills.length === 0) {
      return null;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LANGUAGES</Text>
        {data.languageSkills.map((lang, index) => (
          <View key={lang.id} style={{ marginBottom: 5 }}>
            <Text style={styles.skill}>
              {safeText(lang.name)}: {safeText(lang.proficiency)}{lang.certification && lang.certification.trim().length > 0 ? ` (${safeText(lang.certification)})` : ' '}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const ReferencesSection = () => {
    // Show "Available upon request" if availableOnRequest is true
    if (data.availableOnRequest) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REFERENCES</Text>
          <Text style={styles.achievement}>Available upon request</Text>
        </View>
      );
    }
    
    // Show actual references if they exist and availableOnRequest is false
    if (!data.references || data.references.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>REFERENCES</Text>
        {data.references.map((ref, index) => (
          <View key={ref.id} style={{ marginBottom: 10 }}>
            <Text style={styles.jobTitle}>{safeText(ref.name)}</Text>
            <Text style={styles.company}>{safeText(ref.title)} at {safeText(ref.company)}</Text>
            <Text style={styles.contactInfo}>Email: {safeText(ref.email)}</Text>
            <Text style={styles.contactInfo}>Phone: {safeText(ref.phone)}</Text>
            <Text style={styles.contactInfo}>Relationship: {safeText(ref.relationship)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const AdditionalInformationSection = () => {
    const hasGithub = data.personalInfo.github && data.personalInfo.github.trim().length > 0;
    const hasPortfolio = data.personalInfo.portfolio && data.personalInfo.portfolio.trim().length > 0;
    const hasDateOfBirth = data.personalInfo.dateOfBirth && data.personalInfo.dateOfBirth.trim().length > 0;
    const hasNationality = data.personalInfo.nationality && data.personalInfo.nationality.trim().length > 0;
    const hasLanguages = data.personalInfo.languages && data.personalInfo.languages.length > 0;
    
    const hasAnyAdditionalInfo = hasGithub || hasPortfolio || hasDateOfBirth || hasNationality || hasLanguages;
    
    if (!hasAnyAdditionalInfo) {
      return null;
    }
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADDITIONAL INFORMATION</Text>
        {hasGithub && (
          <Text style={styles.contactInfo}>GitHub: {safeText(data.personalInfo.github)}</Text>
        )}
        {hasPortfolio && (
          <Text style={styles.contactInfo}>Portfolio: {safeText(data.personalInfo.portfolio)}</Text>
        )}
        {hasDateOfBirth && (
          <Text style={styles.contactInfo}>Date of Birth: {safeText(data.personalInfo.dateOfBirth)}</Text>
        )}
        {hasNationality && (
          <Text style={styles.contactInfo}>Nationality: {safeText(data.personalInfo.nationality)}</Text>
        )}
        {hasLanguages && (
          <Text style={styles.contactInfo}>Languages: {data.personalInfo.languages.join(', ')}</Text>
        )}
      </View>
    );
  };

  const HobbiesSection = () => {
    console.log('🔍 HobbiesSection: Processing hobbies data:', { hobbies: data.hobbies, type: typeof data.hobbies, isArray: Array.isArray(data.hobbies) });
    
    if (!data.hobbies) {
      console.log('🔍 HobbiesSection: No hobbies data, returning null');
      return null;
    }
    
    let hobbiesText = '';
    
    // Handle both string and array types
    if (typeof data.hobbies === 'string') {
      hobbiesText = (data.hobbies as string).trim();
      console.log('🔍 HobbiesSection: Processing string hobbies:', hobbiesText);
    } else if (Array.isArray(data.hobbies)) {
      hobbiesText = (data.hobbies as string[]).filter(hobby => hobby && hobby.trim()).join(' • ');
      console.log('🔍 HobbiesSection: Processing array hobbies:', hobbiesText);
    } else {
      console.log('🔍 HobbiesSection: Unexpected hobbies type, converting to string');
      hobbiesText = String(data.hobbies || '').trim();
    }
    
    if (!hobbiesText || hobbiesText.length === 0) {
      console.log('🔍 HobbiesSection: Empty hobbies text, returning null');
      return null;
    }
    
    console.log('🔍 HobbiesSection: Rendering hobbies:', hobbiesText);
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HOBBIES & INTERESTS</Text>
        <Text style={styles.achievement}>{safeText(hobbiesText)}</Text>
      </View>
    );
  };

  const PublicationsSection = () => {
    if (!data.publications || data.publications.length === 0) {
      return null;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PUBLICATIONS</Text>
        {data.publications.map((pub, index) => (
          <View key={pub.id} style={{ marginBottom: 10 }}>
            <Text style={styles.jobTitle}>{safeText(pub.title)}</Text>
            <Text style={styles.company}>{safeText(pub.journal)}</Text>
            <Text style={styles.dates}>{safeText(pub.date)}</Text>
            {pub.doi && pub.doi.trim().length > 0 && (
              <Text style={styles.contactInfo}>DOI: {safeText(pub.doi)}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const PatentsSection = () => {
    if (!data.patents || data.patents.length === 0) {
      return null;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PATENTS</Text>
        {data.patents.map((patent, index) => (
          <View key={patent.id} style={{ marginBottom: 10 }}>
            <Text style={styles.jobTitle}>{safeText(patent.title)}</Text>
            <Text style={styles.dates}>{safeText(patent.date)}</Text>
            <Text style={styles.contactInfo}>Patent Number: {safeText(patent.patentNumber)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const SpeakingEngagementsSection = () => {
    if (!data.speakingEngagements || data.speakingEngagements.length === 0) {
      return null;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SPEAKING ENGAGEMENTS</Text>
        {data.speakingEngagements.map((speaking, index) => (
          <View key={speaking.id} style={{ marginBottom: 10 }}>
            <Text style={styles.jobTitle}>{safeText(speaking.title)}</Text>
            <Text style={styles.company}>{safeText(speaking.event)}</Text>
            <Text style={styles.dates}>{safeText(speaking.date)}</Text>
            <Text style={styles.contactInfo}>{safeText(speaking.location)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const ProfessionalMembershipsSection = () => {
    if (!data.professionalMemberships || data.professionalMemberships.length === 0) {
      return null;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROFESSIONAL MEMBERSHIPS</Text>
        {data.professionalMemberships.map((membership, index) => (
          <View key={membership.id} style={{ marginBottom: 5 }}>
            <Text style={styles.skill}>
              {safeText(membership.organization)}
              {membership.role && membership.role.trim().length > 0 ? ` - ${safeText(membership.role)}` : ''}
              {membership.startDate && membership.startDate.trim().length > 0 ? ` (${safeText(membership.startDate)}${membership.endDate && membership.endDate.trim().length > 0 ? ` - ${safeText(membership.endDate)}` : ' - Present'})` : ''}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const AdditionalSectionsSection = () => (
    <View>
      {data.publications && data.publications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PUBLICATIONS</Text>
          {data.publications.map((pub, index) => (
            <View key={pub.id} style={{ marginBottom: 10 }}>
              <Text style={styles.jobTitle}>{safeText(pub.title)}</Text>
              <Text style={styles.company}>{safeText(pub.journal)}</Text>
              <Text style={styles.dates}>{safeText(pub.date)}</Text>
              {pub.doi && pub.doi.trim().length > 0 && (
                <Text style={styles.contactInfo}>DOI: {safeText(pub.doi)}</Text>
              )}
            </View>
          ))}
        </View>
      )}
      {data.patents && data.patents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PATENTS</Text>
          {data.patents.map((patent, index) => (
            <View key={patent.id} style={{ marginBottom: 10 }}>
              <Text style={styles.jobTitle}>{safeText(patent.title)}</Text>
              <Text style={styles.dates}>{safeText(patent.date)}</Text>
              <Text style={styles.contactInfo}>Patent Number: {safeText(patent.patentNumber)}</Text>
            </View>
          ))}
        </View>
      )}
      {data.speakingEngagements && data.speakingEngagements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPEAKING ENGAGEMENTS</Text>
          {data.speakingEngagements.map((speaking, index) => (
            <View key={speaking.id} style={{ marginBottom: 10 }}>
              <Text style={styles.jobTitle}>{safeText(speaking.title)}</Text>
              <Text style={styles.company}>{safeText(speaking.event)}</Text>
              <Text style={styles.dates}>{safeText(speaking.date)}</Text>
              <Text style={styles.contactInfo}>{safeText(speaking.location)}</Text>
            </View>
          ))}
        </View>
      )}
      {data.professionalMemberships && data.professionalMemberships.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFESSIONAL MEMBERSHIPS</Text>
          {data.professionalMemberships.map((membership, index) => (
            <View key={membership.id} style={{ marginBottom: 5 }}>
              <Text style={styles.skill}>
                {safeText(membership.organization)}
                {membership.role && membership.role.trim().length > 0 ? ` - ${safeText(membership.role)}` : ''}
                {membership.startDate && membership.startDate.trim().length > 0 ? ` (${safeText(membership.startDate)}${membership.endDate && membership.endDate.trim().length > 0 ? ` - ${safeText(membership.endDate)}` : ' - Present'})` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
      {data.hobbies && data.hobbies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOBBIES & INTERESTS</Text>
            <Text style={styles.achievement}>{safeText(data.hobbies.join(' • '))}</Text>
          </View>
        )}
    </View>
  );

  // Map section names to components
  const sectionComponents: { [key: string]: () => JSX.Element | false } = {
    'Professional Summary': ProfessionalSummarySection,
    'Summary': ProfessionalSummarySection,
    'Personal Information': PersonalInfoSection,
    'Personal Info': PersonalInfoSection,
    'Contact': PersonalInfoSection, // Map Contact to PersonalInfoSection
    'Work Experience': WorkExperienceSection,
    'Work': WorkExperienceSection,
    'Experience': WorkExperienceSection,
    'Skills': SkillsSection,
    'Technical Skills': SkillsSection,
    'Education': EducationSection,
    'Certifications': CertificationsSection,
    'Projects': ProjectsSection,
    'Volunteer Experience': VolunteerExperienceSection,
    'Volunteer Work': VolunteerExperienceSection,
    'Awards': AwardsSection,
    'Awards & Achievements': AwardsSection, // Add mapping for Awards & Achievements
    'Languages': LanguagesSection,
    'References': ReferencesSection,
    'Additional Sections': AdditionalSectionsSection,
    'Additional Information': AdditionalInformationSection,
    'Additional': AdditionalSectionsSection,
    'Hobbies & Interests': HobbiesSection,
    'Hobbies': HobbiesSection,
    'Publications': PublicationsSection,
    'Patents': PatentsSection,
    'Speaking Engagements': SpeakingEngagementsSection,
    'Professional Memberships': ProfessionalMembershipsSection,
  };

  // Debug logging for PDF data
  console.log('🔍 PDFGenerator: Received data:', data);
  console.log('🔍 PDFGenerator: PersonalInfo:', data.personalInfo);
  console.log('🔍 PDFGenerator: Education:', data.education);
  console.log('🔍 PDFGenerator: Certifications:', data.certifications);
  console.log('🔍 PDFGenerator DEBUG: Section Order:', sectionOrder);
  console.log('🔍 PDFGenerator DEBUG: Available Section Components:', Object.keys(sectionComponents));
  console.log('🔍 PDFGenerator DEBUG: Total sections to process:', sectionOrder.length);
  console.log('🔍 PDFGenerator: Hobbies data:', data.hobbies);
  console.log('🔍 PDFGenerator: Publications data:', data.publications);
  console.log('🔍 PDFGenerator: Awards data:', data.awards);
  console.log('🔍 PDFGenerator: Volunteer Experience data:', data.volunteerExperience);
  console.log('🔍 PDFGenerator: Language Skills data:', data.languageSkills);
  console.log('🔍 PDFGenerator: References data:', data.references);
  
  // Validate personal info data before rendering
  console.log('🔍 PDFGenerator: Personal Info Validation:');
  console.log('  - fullName:', data.personalInfo?.fullName, typeof data.personalInfo?.fullName);
  console.log('  - email:', data.personalInfo?.email, typeof data.personalInfo?.email);
  console.log('  - phone:', data.personalInfo?.phone, typeof data.personalInfo?.phone);
  console.log('  - address:', data.personalInfo?.address, typeof data.personalInfo?.address);
  console.log('  - linkedin:', data.personalInfo?.linkedin, typeof data.personalInfo?.linkedin);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {safeText(data.personalInfo?.fullName) !== ' ' ? data.personalInfo.fullName : 'Your Name'}
          </Text>
          {data.personalInfo?.email && data.personalInfo.email.trim() && (
            <Text style={styles.contactInfo}>
              Email: {safeText(data.personalInfo.email)}
            </Text>
          )}
          {data.personalInfo?.phone && data.personalInfo.phone.trim() && (
            <Text style={styles.contactInfo}>
              Phone: {safeText(data.personalInfo.phone)}
            </Text>
          )}
          {data.personalInfo?.linkedin && data.personalInfo.linkedin.trim() && (
            <Text style={styles.contactInfo}>
              LinkedIn: {safeText(data.personalInfo.linkedin)}
            </Text>
          )}
          {data.personalInfo?.address && data.personalInfo.address.trim() && (
            <Text style={styles.contactInfo}>
              Address: {safeText(data.personalInfo.address)}
            </Text>
          )}
        </View>

        {/* Dynamic Sections based on template order */}
        {(() => {
          console.log(`🔍 PDFGenerator [${new Date().toISOString()}]: Starting section processing`);
          console.log(`📋 PDFGenerator: Section Order:`, sectionOrder);
          console.log(`🔍 PDFGenerator: Available Section Components:`, Object.keys(sectionComponents));
          
          return sectionOrder.map((sectionName, index) => {
            console.log(`🔍 PDFGenerator: Processing section "${sectionName}" (index ${index})`);
            const SectionComponent = sectionComponents[sectionName];
            if (SectionComponent) {
              console.log(`✅ PDFGenerator: Found component for "${sectionName}", rendering...`);
              const result = <SectionComponent key={index} />;
              console.log(`🔍 PDFGenerator: Component "${sectionName}" rendered:`, result);
              return result;
            } else {
              console.log(`❌ PDFGenerator: No component found for "${sectionName}"`);
              return null;
            }
          });
        })()}
      </Page>
    </Document>
  );
};

// Function to safely sanitize string values
const sanitizeString = (value: any, maxLength: number = 1000): string => {
  try {
    if (value === null || value === undefined) return '';
    
    let str = String(value).trim();
    
    // Remove potentially problematic characters that could cause DataView errors
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    
    // Remove any remaining control characters or invalid Unicode sequences
    str = str.replace(/[\uFFFE\uFFFF]/g, '');
    
    // Truncate if too long
    if (str.length > maxLength) {
      str = str.substring(0, maxLength - 3) + '...';
    }
    
    // Return the sanitized string (can be empty)
    return str;
  } catch (error) {
    console.warn('sanitizeString - Error processing value:', { value, error });
    return '';
  }
};

// Function to safely sanitize string values with fallback for PDF rendering
const sanitizeStringForPDF = (value: any, maxLength: number = 1000): string => {
  const sanitized = sanitizeString(value, maxLength);
  // Return a single space if the string is empty to prevent rendering issues
  return sanitized.length > 0 ? sanitized : ' ';
};

// Function to get full name with fallback handling
const getFullName = (personalInfo: any): string => {
  try {
    console.log('🔍 getFullName: Processing personalInfo:', personalInfo);
    
    // Check for fullName field first (this is the primary field in PersonalInfo interface)
    if (personalInfo?.fullName && typeof personalInfo.fullName === 'string' && personalInfo.fullName.trim()) {
      const result = personalInfo.fullName.trim();
      console.log('✅ getFullName: Using fullName:', result);
      return result;
    }
    
    console.log('⚠️ getFullName: fullName not found or empty, checking fallbacks');
    
    // Fallback to email prefix if available
    if (personalInfo?.email && typeof personalInfo.email === 'string') {
      const emailPrefix = personalInfo.email.split('@')[0];
      if (emailPrefix) {
        const result = emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        console.log('✅ getFullName: Using email prefix:', result);
        return result;
      }
    }
    
    // Final fallback
    console.log('⚠️ getFullName: Using final fallback: Resume');
    return 'Resume';
  } catch (error) {
    console.error('🚨 getFullName: Error processing name:', { personalInfo, error });
    return 'Resume';
  }
};

// Function to safely format dates with fallback handling
const safeDate = (date: any, fallback: string = ''): string => {
  try {
    if (!date) {
      return fallback;
    }
    
    if (typeof date === 'string') {
      const trimmed = date.trim();
      if (trimmed.length === 0 || trimmed.toLowerCase() === 'undefined' || trimmed === 'null') {
        return fallback;
      }
      return trimmed;
    }
    
    if (typeof date === 'number') {
      return String(date);
    }
    
    // If it's an object with year property
    if (typeof date === 'object' && date.year) {
      return String(date.year);
    }
    
    return fallback;
  } catch (error) {
    console.error('🚨 safeDate: Error processing date:', { date, error });
    return fallback;
  }
};

// Function to safely render text content (prevents empty strings from being rendered)
const safeText = (content: string): string => {
  try {
    if (!content || typeof content !== 'string') {
      console.log('🔍 safeText: returning space for non-string:', { content, type: typeof content });
      return ' ';
    }
    
    // Check for problematic characters that might cause DataView errors
    if (typeof content === 'string' && content.length > 0) {
      // Check for null bytes or other problematic characters
      if (content.includes('\0') || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(content)) {
        console.warn('🚨 safeText: Found problematic characters in content:', {
          content: content.substring(0, 50),
          hasNullByte: content.includes('\0'),
          hasControlChars: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(content)
        });
        // Clean the content
        content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
      }
    }
    
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      console.log('🔍 safeText: returning space for empty string:', content);
      return ' ';
    }
    return trimmed;
  } catch (error) {
    console.error('🚨 safeText: Error processing content:', { content, error });
    return ' ';
  }
};

// Function to safely render conditional text (for template literals)
const safeConditionalText = (condition: boolean, text: string): string => {
  return condition && text && text.trim().length > 0 ? text.trim() : ' ';
};

// Function to safely sanitize number values
const sanitizeNumber = (value: any): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

// Function to safely sanitize array values with enhanced error handling
const sanitizeArray = (value: any, fieldName?: string): string[] => {
  console.log(`sanitizeArray - Processing ${fieldName || 'unknown field'}:`, { value, type: typeof value, isArray: Array.isArray(value) });
  
  try {
    // Handle null/undefined early
    if (value === null || value === undefined) {
      console.log(`sanitizeArray - Null/undefined value for ${fieldName}, returning empty array`);
      return [];
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      const result = [];
      for (let i = 0; i < value.length; i++) {
        try {
          const item = value[i];
          // Skip null/undefined items
          if (item === null || item === undefined) {
            console.log(`sanitizeArray - Skipping null/undefined item at index ${i} in ${fieldName}`);
            continue;
          }
          
          // Convert to string safely
          let itemStr;
          try {
            itemStr = String(item);
          } catch (stringError) {
            console.warn(`sanitizeArray - Error converting item ${i} to string in ${fieldName}:`, stringError);
            continue;
          }
          
          // Sanitize the string
          const sanitized = sanitizeStringForPDF(itemStr);
          if (sanitized && sanitized !== ' ' && sanitized.trim().length > 0) {
            result.push(sanitized.trim());
          }
        } catch (itemError) {
          console.warn(`sanitizeArray - Error processing array item ${i} in ${fieldName}:`, itemError);
          continue; // Skip problematic items instead of failing
        }
      }
      console.log(`sanitizeArray - Array processed for ${fieldName}:`, { originalLength: value.length, resultLength: result.length, result });
      return result;
    }
    
    // Handle strings (convert to array)
    if (typeof value === 'string') {
      try {
        const items = value.split(',').map(item => {
          const trimmed = item.trim();
          if (trimmed.length === 0) return null;
          const sanitized = sanitizeStringForPDF(trimmed);
          return (sanitized && sanitized !== ' ' && sanitized.trim().length > 0) ? sanitized.trim() : null;
        }).filter(item => item !== null);
        console.log(`sanitizeArray - String converted to array for ${fieldName}:`, { original: value, result: items });
        return items;
      } catch (stringError) {
        console.error(`sanitizeArray - Error processing string for ${fieldName}:`, stringError);
        return [];
      }
    }
    
    // Handle unexpected types
    console.warn(`sanitizeArray - Unexpected type for ${fieldName}:`, { value, type: typeof value });
    
    // Try to convert other types to string and then to array
    try {
      const stringValue = String(value);
      if (stringValue && stringValue !== 'undefined' && stringValue !== 'null') {
        const sanitized = sanitizeStringForPDF(stringValue);
        if (sanitized && sanitized !== ' ' && sanitized.trim().length > 0) {
          return [sanitized.trim()];
        }
      }
    } catch (conversionError) {
      console.error(`sanitizeArray - Error converting unexpected type for ${fieldName}:`, conversionError);
    }
    
    return [];
  } catch (error) {
    console.error(`sanitizeArray - Critical error processing ${fieldName}:`, error);
    return []; // Always return an array, never throw
  }
}

// Function to create minimal fallback data for error recovery
const createMinimalFallbackData = (originalData: ResumeData): ResumeData => {
  console.log('🔄 Creating minimal fallback data...');
  
  try {
    return {
      personalInfo: {
        fullName: originalData.personalInfo?.fullName || 'Resume',
        email: originalData.personalInfo?.email || ' ',
        phone: originalData.personalInfo?.phone || ' ',
        address: originalData.personalInfo?.address || ' ',
        linkedin: ' ',
        github: ' ',
        portfolio: ' ',
        professionalSummary: originalData.personalInfo?.professionalSummary || ' ',
        dateOfBirth: ' ',
        nationality: ' ',
        languages: [],
      },
      workExperience: originalData.workExperience?.slice(0, 2).map(exp => ({
        id: exp.id || '1',
        jobTitle: exp.jobTitle || 'Position',
        company: exp.company || 'Company',
        location: exp.location || '',
        startDate: exp.startDate || ' ',
        endDate: exp.endDate || ' ',
        achievements: exp.achievements?.slice(0, 2) || [],
        companySize: exp.companySize || '',
        industry: exp.industry || '',
        technologies: exp.technologies || [],
        teamSize: exp.teamSize || '',
      })) || [],
      skills: originalData.skills?.slice(0, 5) || ['Skill 1', 'Skill 2'],
      education: originalData.education?.slice(0, 1).map(edu => ({
        id: edu.id || '1',
        degree: edu.degree || 'Degree',
        institution: edu.institution || 'Institution',
        startDate: edu.startDate || ' ',
        endDate: edu.endDate || ' ',
        gpa: ' ',
        relevantCoursework: [],
        honors: [],
      })) || [],
      certifications: [],
      projects: [],
      volunteerExperience: [],
      awards: [],
      languageSkills: [],
      references: [],
      availableOnRequest: false,
      publications: [],
      patents: [],
      speakingEngagements: [],
      professionalMemberships: [],
      hobbies: [],
    };
  } catch (error) {
    console.error('Error creating minimal fallback data:', error);
    // Return absolute minimal data
    return {
      personalInfo: {
        fullName: 'Resume',
        email: ' ',
        phone: ' ',
        address: ' ',
        linkedin: ' ',
        github: ' ',
        portfolio: ' ',
        professionalSummary: ' ',
        dateOfBirth: ' ',
        nationality: ' ',
        languages: [],
      },
      workExperience: [],
      skills: ['Skills'],
      education: [],
      certifications: [],
      projects: [],
      volunteerExperience: [],
      awards: [],
      languageSkills: [],
      references: [],
      availableOnRequest: false,
      publications: [],
      patents: [],
      speakingEngagements: [],
      professionalMemberships: [],
      hobbies: [],
    };
  }
};

// Function to validate and sanitize resume data
const validateAndSanitizeData = (data: any): ResumeData => {
  try {
    console.log('🔍 validateAndSanitizeData - Starting validation');
    console.log('🔍 validateAndSanitizeData - Input data keys:', Object.keys(data || {}));
    
    if (!data || typeof data !== 'object') {
      console.error('❌ validateAndSanitizeData - No data provided or invalid type:', { data, type: typeof data });
      throw new Error('Invalid resume data: Data must be an object');
    }
    console.log('✅ validateAndSanitizeData - Data exists, proceeding with validation');
    
    // Enhanced data type validation
    console.log('validateAndSanitizeData - Validating data structure:', {
      hasPersonalInfo: !!data.personalInfo,
      personalInfoType: typeof data.personalInfo,
      hasWorkExperience: !!data.workExperience,
      workExperienceType: typeof data.workExperience,
      workExperienceIsArray: Array.isArray(data.workExperience),
      hasSkills: !!data.skills,
      skillsType: typeof data.skills,
      skillsIsArray: Array.isArray(data.skills),
      hasHobbies: !!data.hobbies,
      hobbiesType: typeof data.hobbies,
      hobbiesIsArray: Array.isArray(data.hobbies)
    });

    if (!data.personalInfo || typeof data.personalInfo !== 'object') {
      throw new Error('Invalid resume data: Missing personal information section');
    }

    if (!data.personalInfo.fullName || typeof data.personalInfo.fullName !== 'string') {
      throw new Error('Invalid resume data: Full name is required and must be a string');
    }

    // Additional validation for critical fields
    if (data.personalInfo.fullName.trim().length === 0) {
      throw new Error('Invalid resume data: Full name cannot be empty');
    }

    if (data.personalInfo.email && typeof data.personalInfo.email === 'string' && data.personalInfo.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.personalInfo.email.trim())) {
        console.warn('Invalid email format detected, will be sanitized');
      }
    }

  // Sanitize personal information
  console.log('🔍 Processing personalInfo section...');
  let sanitizedPersonalInfo;
  try {
    sanitizedPersonalInfo = {
      fullName: sanitizeStringForPDF(data.personalInfo.fullName, 100),
      email: sanitizeStringForPDF(data.personalInfo.email, 100),
      phone: sanitizeStringForPDF(data.personalInfo.phone, 50),
      address: sanitizeStringForPDF(data.personalInfo.address, 200),
      linkedin: sanitizeStringForPDF(data.personalInfo.linkedin, 100),
      github: sanitizeStringForPDF(data.personalInfo.github, 100),
      portfolio: sanitizeStringForPDF(data.personalInfo.portfolio, 100),
      professionalSummary: sanitizeStringForPDF(data.personalInfo.professionalSummary, 1000),
      dateOfBirth: sanitizeStringForPDF(data.personalInfo.dateOfBirth, 50),
      nationality: sanitizeStringForPDF(data.personalInfo.nationality, 50),
      location: sanitizeStringForPDF(data.personalInfo.location || '', 100),
      languages: sanitizeArray(data.personalInfo.languages, 'personalInfo.languages'),
    };
    console.log('✅ personalInfo section processed successfully');
  } catch (error) {
    console.error('❌ Error processing personalInfo:', error);
    throw new Error(`Personal info processing failed: ${error.message}`);
  }

  // Sanitize work experience
  console.log('🔍 Processing workExperience section...', { count: (data.workExperience || []).length });
  let sanitizedWorkExperience;
  try {
    sanitizedWorkExperience = (data.workExperience || []).map((exp: any, index: number) => {
      console.log(`🔍 Processing work experience ${index}:`, { jobTitle: exp?.jobTitle, company: exp?.company });
      return {
        id: sanitizeStringForPDF(exp.id || Math.random().toString(), 50),
        jobTitle: sanitizeStringForPDF(exp.jobTitle, 100),
        company: sanitizeStringForPDF(exp.company, 100),
        startDate: sanitizeStringForPDF(exp.startDate, 50),
        endDate: sanitizeStringForPDF(exp.endDate, 50),
        achievements: sanitizeArray(exp.achievements || [], `workExperience[${index}].achievements`),
      };
    });
    console.log('✅ workExperience section processed successfully');
  } catch (error) {
    console.error('❌ Error processing workExperience:', error);
    throw new Error(`Work experience processing failed: ${error.message}`);
  }

  // Sanitize skills - flatten to simple array of strings for PDF rendering
  console.log('🔍 Processing skills section...', { 
    skillsExists: !!data.skills, 
    skillsType: typeof data.skills, 
    isArray: Array.isArray(data.skills),
    skillsLength: data.skills?.length,
    skillsContent: data.skills
  });
  
  let sanitizedSkills: string[] = [];
  try {
    if (data.skills && Array.isArray(data.skills)) {
      data.skills.forEach((skill: any, index: number) => {
        console.log(`🔍 Processing skill ${index}:`, { skill, type: typeof skill });
        
        if (typeof skill === 'string') {
          // If skill is already a string, add it directly
          const sanitized = sanitizeStringForPDF(skill, 100);
          console.log(`✅ Added string skill: ${sanitized}`);
          sanitizedSkills.push(sanitized);
        } else if (skill && typeof skill === 'object') {
          console.log(`🔍 Processing object skill:`, { hasItems: !!skill.items, hasCategory: !!skill.category });
          // If skill is an object with items array, flatten the items
          if (skill.items && Array.isArray(skill.items)) {
            skill.items.forEach((item: any, itemIndex: number) => {
              console.log(`🔍 Processing skill item ${itemIndex}:`, { item, type: typeof item });
              if (typeof item === 'string') {
                const sanitized = sanitizeStringForPDF(item, 100);
                console.log(`✅ Added skill item: ${sanitized}`);
                sanitizedSkills.push(sanitized);
              }
            });
          } else if (skill.category) {
            // If skill has category but no items, use the category
            const sanitized = sanitizeStringForPDF(skill.category, 100);
            console.log(`✅ Added skill category: ${sanitized}`);
            sanitizedSkills.push(sanitized);
          }
        } else {
          console.warn(`⚠️ Skipping invalid skill at index ${index}:`, skill);
        }
      });
    }
    console.log('✅ skills section processed successfully', { finalCount: sanitizedSkills.length });
  } catch (error) {
    console.error('❌ Error processing skills:', error);
    throw new Error(`Skills processing failed: ${error.message}`);
  }

  // Sanitize education
  const sanitizedEducation = (data.education || []).map((edu: any, index: number) => ({
    id: sanitizeStringForPDF(edu.id || Math.random().toString(), 50),
    degree: sanitizeStringForPDF(edu.degree, 100),
    institution: sanitizeStringForPDF(edu.institution, 100),
    location: sanitizeStringForPDF(edu.location || '', 100),
    startDate: sanitizeStringForPDF(edu.startDate, 50),
    endDate: sanitizeStringForPDF(edu.endDate, 50),
    gpa: sanitizeStringForPDF(edu.gpa, 20),
    relevantCoursework: sanitizeArray(edu.relevantCoursework || [], `education[${index}].relevantCoursework`),
    honors: sanitizeArray(edu.honors || [], `education[${index}].honors`),
  }));

  // Sanitize other sections with safe defaults
  const sanitizedData: ResumeData = {
    personalInfo: sanitizedPersonalInfo,
    workExperience: sanitizedWorkExperience,
    skills: sanitizedSkills,
    education: sanitizedEducation,
    certifications: (data.certifications || []).map((cert: any) => ({
      id: sanitizeStringForPDF(cert.id || Math.random().toString(), 50),
      name: sanitizeStringForPDF(cert.name, 100),
      issuingOrganization: sanitizeStringForPDF(cert.issuingOrganization, 100),
      issueDate: sanitizeStringForPDF(cert.issueDate, 50),
      expirationDate: sanitizeStringForPDF(cert.expirationDate, 50),
      credentialId: sanitizeStringForPDF(cert.credentialId, 100),
    })),
    projects: (data.projects || []).map((proj: any, index: number) => ({
      id: sanitizeStringForPDF(proj.id || Math.random().toString(), 50),
      name: sanitizeStringForPDF(proj.name, 100),
      startDate: sanitizeStringForPDF(proj.startDate, 50),
      endDate: sanitizeStringForPDF(proj.endDate, 50),
      technologies: sanitizeArray(proj.technologies || [], `projects[${index}].technologies`),
      highlights: sanitizeArray(proj.highlights || [], `projects[${index}].highlights`),
      githubUrl: sanitizeStringForPDF(proj.githubUrl, 200),
      liveUrl: sanitizeStringForPDF(proj.liveUrl, 200),
    })),
    volunteerExperience: (data.volunteerExperience || []).map((vol: any, index: number) => ({
      id: sanitizeStringForPDF(vol.id || Math.random().toString(), 50),
      role: sanitizeStringForPDF(vol.role, 100),
      organization: sanitizeStringForPDF(vol.organization, 100),
      location: sanitizeStringForPDF(vol.location, 100),
      startDate: sanitizeStringForPDF(vol.startDate, 50),
      endDate: sanitizeStringForPDF(vol.endDate, 50),
      current: Boolean(vol.current),
      description: sanitizeStringForPDF(vol.description, 1000),
      achievements: sanitizeArray(vol.achievements || [], `volunteerExperience[${index}].achievements`),
      impact: sanitizeStringForPDF(vol.impact, 500),
      hoursPerWeek: sanitizeNumber(vol.hoursPerWeek),
      totalHours: sanitizeNumber(vol.totalHours),
    })),
    awards: (data.awards || []).map((award: any) => ({
      id: sanitizeStringForPDF(award.id || Math.random().toString(), 50),
      name: sanitizeStringForPDF(award.name, 100),
      organization: sanitizeStringForPDF(award.organization, 100),
      date: sanitizeStringForPDF(award.date, 50),
      description: sanitizeStringForPDF(award.description, 500),
      category: sanitizeStringForPDF(award.category, 100),
    })),
    languageSkills: (data.languageSkills || []).map((lang: any) => ({
      id: sanitizeStringForPDF(lang.id || Math.random().toString(), 50),
      name: sanitizeStringForPDF(lang.name, 50),
      proficiency: sanitizeStringForPDF(lang.proficiency, 50),
      certification: sanitizeStringForPDF(lang.certification, 100),
    })),
    references: (data.references || []).map((ref: any) => ({
      id: sanitizeStringForPDF(ref.id || Math.random().toString(), 50),
      name: sanitizeStringForPDF(ref.name, 100),
      title: sanitizeStringForPDF(ref.title, 100),
      company: sanitizeStringForPDF(ref.company, 100),
      email: sanitizeStringForPDF(ref.email, 100),
      phone: sanitizeStringForPDF(ref.phone, 50),
      relationship: sanitizeStringForPDF(ref.relationship, 100),
    })),
    availableOnRequest: Boolean(data.availableOnRequest),
    publications: (data.publications || []).map((pub: any, index: number) => ({
      id: sanitizeStringForPDF(pub.id || Math.random().toString(), 50),
      title: sanitizeStringForPDF(pub.title, 200),
      authors: sanitizeArray(pub.authors || [], `publications[${index}].authors`),
      publication: sanitizeStringForPDF(pub.publication, 100),
      journal: sanitizeStringForPDF(pub.journal, 100),
      date: sanitizeStringForPDF(pub.date, 50),
      year: sanitizeNumber(pub.year) || new Date().getFullYear(),
      url: sanitizeStringForPDF(pub.url, 200),
      doi: sanitizeStringForPDF(pub.doi, 100),
      abstract: sanitizeStringForPDF(pub.abstract, 1000),
    })),
    patents: (data.patents || []).map((patent: any, index: number) => ({
      id: sanitizeStringForPDF(patent.id || Math.random().toString(), 50),
      title: sanitizeStringForPDF(patent.title, 200),
      patentNumber: sanitizeStringForPDF(patent.patentNumber, 100),
      status: sanitizeStringForPDF(patent.status, 50),
      filingDate: sanitizeStringForPDF(patent.filingDate, 50),
      grantDate: sanitizeStringForPDF(patent.grantDate, 50),
      description: sanitizeStringForPDF(patent.description, 1000),
      inventors: sanitizeArray(patent.inventors || [], `patents[${index}].inventors`),
    })),
    speakingEngagements: (data.speakingEngagements || []).map((speaking: any) => ({
      id: sanitizeStringForPDF(speaking.id || Math.random().toString(), 50),
      title: sanitizeStringForPDF(speaking.title, 200),
      event: sanitizeStringForPDF(speaking.event, 100),
      location: sanitizeStringForPDF(speaking.location, 100),
      date: sanitizeStringForPDF(speaking.date, 50),
      description: sanitizeStringForPDF(speaking.description, 1000),
      audience: sanitizeStringForPDF(speaking.audience, 100),
      audienceSize: sanitizeNumber(speaking.audienceSize),
      type: sanitizeStringForPDF(speaking.type, 50),
    })),
    professionalMemberships: (data.professionalMemberships || []).map((membership: any) => ({
      id: sanitizeStringForPDF(membership.id || Math.random().toString(), 50),
      organization: sanitizeStringForPDF(membership.organization, 100),
      role: sanitizeStringForPDF(membership.role, 100),
      startDate: sanitizeStringForPDF(membership.startDate, 50),
      endDate: sanitizeStringForPDF(membership.endDate, 50),
      current: Boolean(membership.current),
      description: sanitizeStringForPDF(membership.description, 1000),
    })),
    hobbies: (() => {
      console.log('🔍 Processing hobbies section...', { 
        hobbiesExists: !!data.hobbies, 
        hobbiesType: typeof data.hobbies, 
        isArray: Array.isArray(data.hobbies),
        hobbiesContent: data.hobbies
      });
      try {
        const result = sanitizeArray(data.hobbies, 'hobbies');
        console.log('✅ hobbies section processed successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Error processing hobbies:', error);
        throw new Error(`Hobbies processing failed: ${error.message}`);
      }
    })(),
  };

  console.log('✅ All sections processed successfully, returning sanitized data');
  return sanitizedData;
  
  } catch (error) {
    console.error('Data validation and sanitization error:', error);
    
    // If it's already a validation error, re-throw it
    if (error instanceof Error && error.message.includes('Invalid resume data:')) {
      throw error;
    }
    
    // For unexpected errors during sanitization, provide a more user-friendly message
    throw new Error('Data processing failed during validation. Please check your resume content and try again.');
  }
};

// Function to generate PDF blob with comprehensive error handling
export const generatePDFBlob = async (data: ResumeData, template?: TemplateMetadata, sectionOrder?: string[]): Promise<Blob> => {
  try {
    console.log('🚀 PDF Generator - Starting PDF generation process');
    
    // Enhanced debug: Log received data and parameters with memory info
    console.log('📊 PDF Generator - Memory usage before processing:', {
      used: (typeof process !== 'undefined' && process.memoryUsage) ? process.memoryUsage().heapUsed / 1024 / 1024 : 'N/A',
        total: (typeof process !== 'undefined' && process.memoryUsage) ? process.memoryUsage().heapTotal / 1024 / 1024 : 'N/A'
    });
    
    console.log('📋 PDF Generator - Received data summary:', {
      personalInfo: data.personalInfo ? 'present' : 'missing',
      personalInfoKeys: data.personalInfo ? Object.keys(data.personalInfo) : [],
      workExperience: data.workExperience?.length || 0,
      skills: data.skills?.length || 0,
      skillsType: typeof data.skills,
      skillsIsArray: Array.isArray(data.skills),
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
      hobbies: data.hobbies || '',
      hobbiesType: typeof data.hobbies,
      hobbiesIsArray: Array.isArray(data.hobbies),
      availableOnRequest: data.availableOnRequest
    });
    
    // Debug: Check hobbies data type specifically
    console.log('PDF Generator - Hobbies field analysis:', {
      hobbies: data.hobbies,
      hobbiesType: typeof data.hobbies,
      isArray: Array.isArray(data.hobbies),
      hobbiesLength: data.hobbies?.length,
      hobbiesContent: data.hobbies
    });
    console.log('PDF Generator - Section order received:', sectionOrder);
    console.log('PDF Generator - Template received:', template);
    
    // Validate and sanitize input data
    let sanitizedData: ResumeData;
    try {
      console.log('PDF Generator - Starting data validation and sanitization');
      console.log('PDF Generator - Raw data before validation:', JSON.stringify(data, null, 2));
      sanitizedData = validateAndSanitizeData(data);
      console.log('PDF Generator - Data validation completed successfully');
      console.log('PDF Generator - Sanitized data:', JSON.stringify(sanitizedData, null, 2));
    } catch (validationError) {
      console.error('Data validation failed:', validationError);
      throw new Error(`Data validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }

    // Validate template data to prevent rendering issues
    let safeTemplate = template;
    if (template) {
      try {
        // Ensure template has safe values - but don't use template.section_order to avoid limiting sections
        safeTemplate = {
          ...template,
          font_family: template.font_family || 'Helvetica',
          font_size: Math.max(8, Math.min(template.font_size || 12, 24)),
          primary_color: template.primary_color || '#3B82F6',
          secondary_color: template.secondary_color || '#6B7280',
          // Don't use template.section_order - let the sectionOrder parameter control sections
          bullet_style: template.bullet_style || 'bullet',
          spacing: template.spacing || 'normal',
        };
      } catch (templateError) {
        console.warn('Template validation failed, using defaults:', templateError);
        safeTemplate = undefined; // Fall back to default template
      }
    }

    // Validate section order to prevent rendering issues
    let safeSectionOrder = sectionOrder;
    if (sectionOrder && Array.isArray(sectionOrder)) {
      safeSectionOrder = sectionOrder.filter(section => 
        typeof section === 'string' && section.trim().length > 0
      );
      if (safeSectionOrder.length === 0) {
        safeSectionOrder = [
          'Personal Information', 'Professional Summary', 'Work Experience', 'Education', 'Skills', 
          'Certifications', 'Projects', 'Volunteer Experience', 'Awards & Achievements', 
          'Languages', 'References', 'Hobbies & Interests', 'Publications', 'Patents',
          'Speaking Engagements', 'Professional Memberships'
        ];
      }
    } else {
      // Default section order if none provided - match LivePreview exactly
      safeSectionOrder = ['Professional Summary', 'Personal Info', 'Work Experience', 'Skills', 'Education', 'Certifications', 'Projects', 'Volunteer Experience', 'Awards', 'Languages', 'References', 'Hobbies & Interests', 'Publications', 'Patents', 'Speaking Engagements', 'Professional Memberships', 'Additional Sections'];
    }
    
    console.log('PDF Generator - Final section order being used:', safeSectionOrder);

    // Create document with proper error handling
    let doc: React.ReactElement;
    try {
      console.log('🏗️ PDF Generator - Creating document with sanitized data');
      console.log('📋 PDF Generator - About to create ResumeDocument with:', {
        dataKeys: Object.keys(sanitizedData),
        template: safeTemplate,
        sectionOrder: safeSectionOrder
      });
      
      console.log('🔍 PDF Generator - Detailed data inspection before rendering:');
      console.log('🔍 Personal Info:', {
        fullName: sanitizedData.personalInfo?.fullName,
        email: sanitizedData.personalInfo?.email,
        phone: sanitizedData.personalInfo?.phone,
        fieldsCount: Object.keys(sanitizedData.personalInfo || {}).length
      });
      console.log('🔍 Skills:', {
        count: sanitizedData.skills?.length || 0,
        type: typeof sanitizedData.skills,
        isArray: Array.isArray(sanitizedData.skills),
        first3: sanitizedData.skills?.slice(0, 3)
      });
      console.log('🔍 Work Experience:', {
        count: sanitizedData.workExperience?.length || 0,
        first2: sanitizedData.workExperience?.slice(0, 2)?.map(exp => ({
          jobTitle: exp.jobTitle,
          company: exp.company,
          achievementsCount: exp.achievements?.length || 0
        }))
      });
      console.log('🔍 Education:', {
        count: sanitizedData.education?.length || 0,
        first2: sanitizedData.education?.slice(0, 2)?.map(edu => ({
          degree: edu.degree,
          institution: edu.institution
        }))
      });
      console.log('🔍 Hobbies:', {
        type: typeof sanitizedData.hobbies,
        isArray: Array.isArray(sanitizedData.hobbies),
        count: sanitizedData.hobbies?.length || 0,
        content: sanitizedData.hobbies
      });
      
      console.log('⚡ PDF Generator - Creating ResumeDocument React element...');
      doc = <ResumeDocument data={sanitizedData} template={safeTemplate} sectionOrder={safeSectionOrder} />;
      console.log('✅ PDF Generator - Document created successfully');
    } catch (documentError) {
      console.error('❌ Document creation failed:', {
        error: documentError,
        message: documentError instanceof Error ? documentError.message : 'Unknown document error',
        stack: documentError instanceof Error ? documentError.stack : undefined
      });
      throw new Error(`Document creation failed: ${documentError instanceof Error ? documentError.message : 'Unknown document error'}`);
    }
    
    // Generate PDF with comprehensive error handling and timeout
    let blob: Blob;
    try {
      console.log('🔄 PDF Generator - Starting PDF blob generation...');
      console.log('🔄 PDF Generator - Document sections to render:', safeSectionOrder);
      console.log('🔄 PDF Generator - Data summary for PDF generation:', {
        personalInfoFields: Object.keys(sanitizedData.personalInfo || {}),
        workExperienceCount: sanitizedData.workExperience?.length || 0,
        skillsCount: sanitizedData.skills?.length || 0,
        educationCount: sanitizedData.education?.length || 0,
        certificationsCount: sanitizedData.certifications?.length || 0,
        projectsCount: sanitizedData.projects?.length || 0,
        volunteerCount: sanitizedData.volunteerExperience?.length || 0,
        awardsCount: sanitizedData.awards?.length || 0,
        languageSkillsCount: sanitizedData.languageSkills?.length || 0,
        referencesCount: sanitizedData.references?.length || 0,
        publicationsCount: sanitizedData.publications?.length || 0,
        patentsCount: sanitizedData.patents?.length || 0,
        speakingCount: sanitizedData.speakingEngagements?.length || 0,
        membershipsCount: sanitizedData.professionalMemberships?.length || 0,
        hobbiesCount: sanitizedData.hobbies?.length || 0
      });
      
      console.log('📊 PDF Generator - Memory usage before PDF creation:', {
        used: (typeof process !== 'undefined' && process.memoryUsage) ? process.memoryUsage().heapUsed / 1024 / 1024 : 'N/A',
        total: (typeof process !== 'undefined' && process.memoryUsage) ? process.memoryUsage().heapTotal / 1024 / 1024 : 'N/A'
      });
      
      console.log('🔧 PDF Generator - Creating PDF promise...');
      const pdfPromise = pdf(doc).toBlob();
      console.log('⏰ PDF Generator - Setting up timeout promise...');
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF generation timeout after 30 seconds')), 30000);
      });
      
      console.log('⚡ PDF Generator - Starting Promise.race for PDF generation...');
      blob = await Promise.race([pdfPromise, timeoutPromise]);
      console.log('✅ PDF Generator - PDF blob generated successfully, size:', blob.size);
      
      console.log('📊 PDF Generator - Memory usage after PDF creation:', {
        used: (typeof process !== 'undefined' && process.memoryUsage) ? process.memoryUsage().heapUsed / 1024 / 1024 : 'N/A',
        total: (typeof process !== 'undefined' && process.memoryUsage) ? process.memoryUsage().heapTotal / 1024 / 1024 : 'N/A'
      });
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      
      // If DataView error occurs, throw a specific error that can be caught by the fallback
      if (pdfError.message && (pdfError.message.includes('DataView') || pdfError.message.includes('Offset') || pdfError.message.includes('buffer'))) {
        console.log('🔄 Attempting PDF generation with minimal data fallback...');
        try {
          const minimalData = createMinimalFallbackData(sanitizedData);
          const minimalDoc = <ResumeDocument data={minimalData} template={safeTemplate} sectionOrder={['Personal Information', 'Work Experience', 'Skills']} />;
          blob = await pdf(minimalDoc).toBlob();
          console.log('✅ PDF generated successfully with minimal data fallback');
        } catch (fallbackError) {
          console.error('Minimal data fallback also failed:', fallbackError);
          // Throw a specific error type that indicates react-pdf failure
          const reactPdfError = new Error('REACT_PDF_DATAVIEW_ERROR');
          reactPdfError.name = 'ReactPDFDataViewError';
          throw reactPdfError;
        }
      } else {
        throw new Error(`PDF generation failed: ${pdfError.message}. Please check your resume data and try again.`);
      }
    }
    
    // Validate the generated blob
    if (!blob) {
      throw new Error('PDF generation returned null. Please try again.');
    }
    
    if (blob.size === 0) {
      throw new Error('Generated PDF is empty. Please check your resume data.');
    }
    
    if (blob.size < 1000) { // PDFs should be at least 1KB
      throw new Error('Generated PDF appears to be corrupted. Please try again.');
    }
    
    return blob;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    
    // Provide specific error messages for common issues
    if (error instanceof Error) {
      // Handle validation errors (thrown by our validation function)
      if (error.message.includes('Invalid resume data:')) {
        throw new Error(`Data validation failed: ${error.message.replace('Invalid resume data: ', '')}`);
      }
      
      // Handle DataView and buffer errors - throw specific error for fallback
      if (error.message.includes('DataView') || error.message.includes('Offset') || error.message.includes('buffer') || error.message === 'REACT_PDF_DATAVIEW_ERROR') {
        const reactPdfError = new Error('REACT_PDF_DATAVIEW_ERROR');
        reactPdfError.name = 'ReactPDFDataViewError';
        throw reactPdfError;
      }
      
      // Handle font errors
      if (error.message.includes('Font') || error.message.includes('font')) {
        throw new Error('PDF generation failed due to font loading error. Please try using a different template or try again.');
      }
      
      // Handle timeout errors
      if (error.message.includes('timeout')) {
        throw new Error('PDF generation is taking too long. Please try with less content or try again later.');
      }
      
      // Handle memory errors
      if (error.message.includes('memory') || error.message.includes('Memory')) {
        throw new Error('PDF generation failed due to insufficient memory. Please try with less content.');
      }
      
      // Handle network errors (for font loading)
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('PDF generation failed due to network error. Please check your internet connection and try again.');
      }
      
      // If it's already a user-friendly message, pass it through
      if (error.message.includes('Unable to generate PDF') || 
          error.message.includes('Data validation failed') ||
          error.message.includes('Generated PDF')) {
        throw error;
      }
      
      // Generic error with original message for debugging
      throw new Error(`PDF generation failed: ${error.message}. Please try again or contact support if the problem persists.`);
    }
    
    throw new Error('An unexpected error occurred during PDF generation. Please try again or contact support.');
  }
};

// Function to download PDF with improved error handling
export const downloadPDF = async (data: ResumeData, template?: TemplateMetadata, filename: string = 'resume.pdf', sectionOrder?: string[]): Promise<void> => {
  try {
    const blob = await generatePDFBlob(data, template, sectionOrder);
    
    // Validate blob before creating URL
    if (!blob || blob.size === 0) {
      throw new Error('Generated PDF is empty or invalid');
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL after a short delay to ensure download starts
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    if (error instanceof Error) {
      throw error; // Re-throw the specific error from generatePDFBlob
    }
    throw new Error('Failed to download PDF');
  }
};

// Export the PDF Document component for preview
export { ResumeDocument };

// Make generatePDFBlob and ReactPDF components available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).generatePDFBlob = generatePDFBlob;
  (window as any).ReactPDF = {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    pdf,
    Font
  };
  console.log('🔧 PDF Generator - generatePDFBlob and ReactPDF components exposed to window object for debugging');
}