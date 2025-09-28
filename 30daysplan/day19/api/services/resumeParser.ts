import { ResumeData, PersonalInfo, WorkExperience, Education, Certification, Project, VolunteerExperience, Award, Language, Reference } from '../../src/types/index.js';

export interface ParsedResumeData {
  personalInfo: Partial<PersonalInfo>;
  workExperience: Partial<WorkExperience>[];
  education: Partial<Education>[];
  skills: string[];
  certifications: Partial<Certification>[];
  projects: Partial<Project>[];
  volunteerExperience: Partial<VolunteerExperience>[];
  awards: Partial<Award>[];
  languages: Partial<Language>[];
  references: Partial<Reference>[];
}

export class ResumeParser {
  private text: string;
  private lines: string[];

  constructor(text: string) {
    this.text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    this.lines = this.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  }

  public parse(): ParsedResumeData {
    return {
      personalInfo: this.extractPersonalInfo(),
      workExperience: this.extractWorkExperience(),
      education: this.extractEducation(),
      skills: this.extractSkills(),
      certifications: this.extractCertifications(),
      projects: this.extractProjects(),
      volunteerExperience: this.extractVolunteerExperience(),
      awards: this.extractAwards(),
      languages: this.extractLanguages(),
      references: this.extractReferences()
    };
  }

  private extractPersonalInfo(): Partial<PersonalInfo> {
    const personalInfo: Partial<PersonalInfo> = {};
    
    // Extract name (usually the first line or prominent text)
    const namePattern = /^[A-Z][a-z]+ [A-Z][a-z]+/;
    for (const line of this.lines.slice(0, 5)) {
      if (namePattern.test(line) && !line.includes('@') && !line.includes('http')) {
        personalInfo.fullName = line;
        break;
      }
    }

    // Extract email
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatch = this.text.match(emailPattern);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
    }

    // Extract phone
    const phonePattern = /(?:\+?1[-\s]?)?\(?[0-9]{3}\)?[-\s]?[0-9]{3}[-\s]?[0-9]{4}/g;
    const phoneMatch = this.text.match(phonePattern);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
    }

    // Extract LinkedIn
    const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([a-zA-Z0-9-]+)/i;
    const linkedinMatch = this.text.match(linkedinPattern);
    if (linkedinMatch) {
      personalInfo.linkedin = linkedinMatch[0];
    }

    // Extract GitHub
    const githubPattern = /(?:github\.com\/)([a-zA-Z0-9-]+)/i;
    const githubMatch = this.text.match(githubPattern);
    if (githubMatch) {
      personalInfo.github = githubMatch[0];
    }

    // Extract address (look for city, state patterns)
    const addressPattern = /([A-Z][a-z]+,\s*[A-Z]{2}|[A-Z][a-z]+\s*,\s*[A-Z][a-z]+)/;
    const addressMatch = this.text.match(addressPattern);
    if (addressMatch) {
      personalInfo.address = addressMatch[0];
    }

    return personalInfo;
  }

  private extractWorkExperience(): Partial<WorkExperience>[] {
    const experiences: Partial<WorkExperience>[] = [];
    const workSectionStart = this.findSectionStart(['experience', 'work experience', 'employment', 'professional experience']);
    
    if (workSectionStart === -1) return experiences;

    const workSectionEnd = this.findNextSectionStart(workSectionStart + 1);
    const workLines = this.lines.slice(workSectionStart + 1, workSectionEnd);

    let currentExperience: Partial<WorkExperience> | null = null;
    
    for (const line of workLines) {
      // Check if this line looks like a job title/company
      if (this.looksLikeJobTitle(line)) {
        if (currentExperience) {
          experiences.push(currentExperience);
        }
        currentExperience = this.parseJobLine(line);
      } else if (currentExperience && this.looksLikeDateRange(line)) {
        const dates = this.parseDateRange(line);
        currentExperience.startDate = dates.start;
        currentExperience.endDate = dates.end;
      } else if (currentExperience && line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        if (!currentExperience.achievements) {
          currentExperience.achievements = [];
        }
        currentExperience.achievements.push(line.replace(/^[•\-*]\s*/, ''));
      }
    }

    if (currentExperience) {
      experiences.push(currentExperience);
    }

    return experiences;
  }

  private extractEducation(): Partial<Education>[] {
    const education: Partial<Education>[] = [];
    const eduSectionStart = this.findSectionStart(['education', 'academic background', 'qualifications']);
    
    if (eduSectionStart === -1) return education;

    const eduSectionEnd = this.findNextSectionStart(eduSectionStart + 1);
    const eduLines = this.lines.slice(eduSectionStart + 1, eduSectionEnd);

    let currentEducation: Partial<Education> | null = null;
    
    for (const line of eduLines) {
      if (this.looksLikeDegree(line)) {
        if (currentEducation) {
          education.push(currentEducation);
        }
        currentEducation = this.parseEducationLine(line);
      } else if (currentEducation && this.looksLikeDateRange(line)) {
        const dates = this.parseDateRange(line);
        currentEducation.startDate = dates.start;
        currentEducation.endDate = dates.end;
      }
    }

    if (currentEducation) {
      education.push(currentEducation);
    }

    return education;
  }

  private extractSkills(): string[] {
    const skills: string[] = [];
    const skillsSectionStart = this.findSectionStart(['skills', 'technical skills', 'core competencies', 'technologies']);
    
    if (skillsSectionStart === -1) return skills;

    const skillsSectionEnd = this.findNextSectionStart(skillsSectionStart + 1);
    const skillsLines = this.lines.slice(skillsSectionStart + 1, skillsSectionEnd);

    for (const line of skillsLines) {
      // Split by common delimiters
      const lineSkills = line.split(/[,;|•\-*]/).map(skill => skill.trim()).filter(skill => skill.length > 0);
      skills.push(...lineSkills);
    }

    return skills.filter(skill => skill.length > 1);
  }

  private extractCertifications(): Partial<Certification>[] {
    const certifications: Partial<Certification>[] = [];
    const certSectionStart = this.findSectionStart(['certifications', 'certificates', 'professional certifications']);
    
    if (certSectionStart === -1) return certifications;

    const certSectionEnd = this.findNextSectionStart(certSectionStart + 1);
    const certLines = this.lines.slice(certSectionStart + 1, certSectionEnd);

    for (const line of certLines) {
      if (line.length > 3) {
        const cert: Partial<Certification> = {
          id: this.generateId(),
          name: line
        };
        certifications.push(cert);
      }
    }

    return certifications;
  }

  private extractProjects(): Partial<Project>[] {
    const projects: Partial<Project>[] = [];
    const projectSectionStart = this.findSectionStart(['projects', 'personal projects', 'side projects']);
    
    if (projectSectionStart === -1) return projects;

    const projectSectionEnd = this.findNextSectionStart(projectSectionStart + 1);
    const projectLines = this.lines.slice(projectSectionStart + 1, projectSectionEnd);

    let currentProject: Partial<Project> | null = null;
    
    for (const line of projectLines) {
      if (this.looksLikeProjectTitle(line)) {
        if (currentProject) {
          projects.push(currentProject);
        }
        currentProject = {
          id: this.generateId(),
          name: line,
          technologies: [],
          highlights: []
        };
      } else if (currentProject && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
        if (!currentProject.highlights) {
          currentProject.highlights = [];
        }
        currentProject.highlights.push(line.replace(/^[•\-*]\s*/, ''));
      }
    }

    if (currentProject) {
      projects.push(currentProject);
    }

    return projects;
  }

  private extractVolunteerExperience(): Partial<VolunteerExperience>[] {
    const volunteer: Partial<VolunteerExperience>[] = [];
    const volSectionStart = this.findSectionStart(['volunteer', 'volunteer experience', 'community service']);
    
    if (volSectionStart === -1) return volunteer;

    const volSectionEnd = this.findNextSectionStart(volSectionStart + 1);
    const volLines = this.lines.slice(volSectionStart + 1, volSectionEnd);

    for (const line of volLines) {
      if (line.length > 5) {
        const vol: Partial<VolunteerExperience> = {
          id: this.generateId(),
          role: line,
          achievements: []
        };
        volunteer.push(vol);
      }
    }

    return volunteer;
  }

  private extractAwards(): Partial<Award>[] {
    const awards: Partial<Award>[] = [];
    const awardSectionStart = this.findSectionStart(['awards', 'honors', 'achievements', 'recognition']);
    
    if (awardSectionStart === -1) return awards;

    const awardSectionEnd = this.findNextSectionStart(awardSectionStart + 1);
    const awardLines = this.lines.slice(awardSectionStart + 1, awardSectionEnd);

    for (const line of awardLines) {
      if (line.length > 3) {
        const award: Partial<Award> = {
          id: this.generateId(),
          name: line,
          category: 'other'
        };
        awards.push(award);
      }
    }

    return awards;
  }

  private extractLanguages(): Partial<Language>[] {
    const languages: Partial<Language>[] = [];
    const langSectionStart = this.findSectionStart(['languages', 'language skills']);
    
    if (langSectionStart === -1) return languages;

    const langSectionEnd = this.findNextSectionStart(langSectionStart + 1);
    const langLines = this.lines.slice(langSectionStart + 1, langSectionEnd);

    for (const line of langLines) {
      const parts = line.split(/[-:,]/);
      if (parts.length >= 1) {
        const lang: Partial<Language> = {
          id: this.generateId(),
          name: parts[0].trim(),
          proficiency: this.extractProficiency(line)
        };
        languages.push(lang);
      }
    }

    return languages;
  }

  private extractReferences(): Partial<Reference>[] {
    const references: Partial<Reference>[] = [];
    const refSectionStart = this.findSectionStart(['references']);
    
    if (refSectionStart === -1) return references;

    const refSectionEnd = this.findNextSectionStart(refSectionStart + 1);
    const refLines = this.lines.slice(refSectionStart + 1, refSectionEnd);

    for (const line of refLines) {
      if (line.toLowerCase().includes('available upon request')) {
        continue;
      }
      if (line.length > 5) {
        const ref: Partial<Reference> = {
          id: this.generateId(),
          name: line
        };
        references.push(ref);
      }
    }

    return references;
  }

  // Helper methods
  private findSectionStart(sectionNames: string[]): number {
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase();
      if (sectionNames.some(name => line.includes(name))) {
        return i;
      }
    }
    return -1;
  }

  private findNextSectionStart(startIndex: number): number {
    const commonSections = ['experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'languages', 'references', 'volunteer'];
    
    for (let i = startIndex; i < this.lines.length; i++) {
      const line = this.lines[i].toLowerCase();
      if (commonSections.some(section => line.includes(section))) {
        return i;
      }
    }
    return this.lines.length;
  }

  private looksLikeJobTitle(line: string): boolean {
    // Check if line contains job title patterns
    const jobTitlePatterns = [
      /\b(developer|engineer|manager|analyst|designer|consultant|director|coordinator|specialist|lead|senior|junior)\b/i,
      /\bat\s+[A-Z]/,
      /\b(software|web|mobile|data|product|project|marketing|sales|hr|finance)\b/i
    ];
    return jobTitlePatterns.some(pattern => pattern.test(line));
  }

  private looksLikeDateRange(line: string): boolean {
    const datePatterns = [
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i,
      /\b\d{4}\b/,
      /\b(present|current|now)\b/i,
      /\d{1,2}\/\d{1,2}\/\d{2,4}/
    ];
    return datePatterns.some(pattern => pattern.test(line));
  }

  private looksLikeDegree(line: string): boolean {
    const degreePatterns = [
      /\b(bachelor|master|phd|doctorate|associate|diploma|certificate)\b/i,
      /\b(b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|ph\.?d\.?)\b/i,
      /\buniversity\b/i,
      /\bcollege\b/i
    ];
    return degreePatterns.some(pattern => pattern.test(line));
  }

  private looksLikeProjectTitle(line: string): boolean {
    return line.length > 5 && line.length < 100 && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*');
  }

  private parseJobLine(line: string): Partial<WorkExperience> {
    const parts = line.split(/\sat\s|\s-\s|\s\|\s/);
    return {
      id: this.generateId(),
      jobTitle: parts[0]?.trim() || line,
      company: parts[1]?.trim() || '',
      achievements: [],
      technologies: []
    };
  }

  private parseEducationLine(line: string): Partial<Education> {
    const parts = line.split(/\sat\s|\s-\s|\s\|\s|\sfrom\s/);
    return {
      id: this.generateId(),
      degree: parts[0]?.trim() || line,
      institution: parts[1]?.trim() || '',
      relevantCoursework: [],
      honors: []
    };
  }

  private parseDateRange(line: string): { start: string; end: string } {
    const dateMatch = line.match(/(\w+\s+\d{4})\s*[-–—]\s*(\w+\s+\d{4}|present|current)/i);
    if (dateMatch) {
      return {
        start: dateMatch[1],
        end: dateMatch[2].toLowerCase() === 'present' || dateMatch[2].toLowerCase() === 'current' ? '' : dateMatch[2]
      };
    }
    return { start: '', end: '' };
  }

  private extractProficiency(line: string): 'beginner' | 'intermediate' | 'advanced' | 'native' {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('native') || lowerLine.includes('fluent')) return 'native';
    if (lowerLine.includes('advanced') || lowerLine.includes('proficient')) return 'advanced';
    if (lowerLine.includes('intermediate')) return 'intermediate';
    return 'beginner';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export function parseResumeText(text: string): ParsedResumeData {
  const parser = new ResumeParser(text);
  return parser.parse();
}