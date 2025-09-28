import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ResumeData } from '../types';

// Alternative PDF generator using jsPDF
export class JSPDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;
  private lineHeight: number = 6;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
  }

  private addText(text: string, fontSize: number = 10, isBold: boolean = false): void {
    if (this.currentY > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(fontSize);
    if (isBold) {
      this.doc.setFont('helvetica', 'bold');
    } else {
      this.doc.setFont('helvetica', 'normal');
    }

    const lines = this.doc.splitTextToSize(text, 170); // 170mm width
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * this.lineHeight;
  }

  private addSection(title: string, content: string[]): void {
    this.addText(title, 14, true);
    this.currentY += 2;
    
    content.forEach(item => {
      this.addText(item, 10, false);
      this.currentY += 1;
    });
    
    this.currentY += 3;
  }

  public generatePDF(data: ResumeData): Blob {
    try {
      // Debug logging for jsPDF data
      console.log('🔍 jsPdfGenerator: Received data:', data);
      console.log('🔍 jsPdfGenerator: PersonalInfo:', data.personalInfo);
      console.log('🔍 jsPdfGenerator: Education:', data.education);
      console.log('🔍 jsPdfGenerator: Certifications:', data.certifications);
      
      console.log('🔄 JSPDFGenerator - Starting PDF generation...');
      
      // Header
      this.addText(data.personalInfo.fullName || 'Resume', 18, true);
      this.currentY += 2;
      
      // Contact Info
      const contactInfo = [
        data.personalInfo.email,
        data.personalInfo.phone,
        data.personalInfo.address
      ].filter(Boolean);
      
      if (contactInfo.length > 0) {
        this.addText(contactInfo.join(' | '), 10, false);
        this.currentY += 5;
      }

      // Summary
      if (data.personalInfo.professionalSummary) {
        this.addSection('SUMMARY', [data.personalInfo.professionalSummary]);
      }

      // Skills
      if (data.skills && data.skills.length > 0) {
        const skillsContent = [data.skills.join(', ')];
        this.addSection('SKILLS', skillsContent);
      }

      // Work Experience
      if (data.workExperience && data.workExperience.length > 0) {
        const experienceContent: string[] = [];
        data.workExperience.forEach(exp => {
          experienceContent.push(`${exp.jobTitle} at ${exp.company}`);
          experienceContent.push(`${exp.startDate} - ${exp.endDate || ''}`);
          if (exp.achievements && exp.achievements.length > 0) {
            experienceContent.push(exp.achievements.join(', '));
          }
          experienceContent.push(''); // Empty line
        });
        this.addSection('WORK EXPERIENCE', experienceContent);
      }

      // Projects
      if (data.projects && data.projects.length > 0) {
        const projectsContent: string[] = [];
        data.projects.forEach(project => {
          projectsContent.push(`${project.name}`);
          if (project.description) {
            projectsContent.push(project.description);
          }
          if (project.technologies && project.technologies.length > 0) {
            projectsContent.push(`Technologies: ${project.technologies.join(', ')}`);
          }
          projectsContent.push(''); // Empty line
        });
        this.addSection('PROJECTS', projectsContent);
      }

      // Education
      if (data.education && data.education.length > 0) {
        const educationContent: string[] = [];
        data.education.forEach(edu => {
          educationContent.push(`${edu.degree}`);
          educationContent.push(`${edu.institution} (${edu.startDate} - ${edu.endDate || ''})`);
          if (edu.gpa) {
            educationContent.push(`GPA: ${edu.gpa}`);
          }
          educationContent.push(''); // Empty line
        });
        this.addSection('EDUCATION', educationContent);
      }

      // Certifications
      if (data.certifications && data.certifications.length > 0) {
        const certificationsContent = data.certifications.map(cert => 
          `${cert.name} - ${cert.issuingOrganization} (${cert.issueDate})`
        );
        this.addSection('CERTIFICATIONS', certificationsContent);
      }

      console.log('✅ JSPDFGenerator - PDF generated successfully');
      return this.doc.output('blob');
    } catch (error) {
      console.error('❌ JSPDFGenerator - Error generating PDF:', error);
      throw new Error('Failed to generate PDF using jsPDF');
    }
  }
}

// Alternative HTML-to-PDF generator
export async function generatePDFFromHTML(htmlElement: HTMLElement): Promise<Blob> {
  try {
    console.log('🔄 HTML2PDF - Starting HTML to PDF conversion...');
    
    const canvas = await html2canvas(htmlElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    console.log('✅ HTML2PDF - PDF generated successfully');
    return pdf.output('blob');
  } catch (error) {
    console.error('❌ HTML2PDF - Error generating PDF:', error);
    throw new Error('Failed to generate PDF from HTML');
  }
}

// Main function to generate PDF with fallback options
export async function generateAlternativePDF(data: ResumeData): Promise<Blob> {
  try {
    console.log('🔄 Alternative PDF Generator - Starting generation...');
    
    // Try jsPDF first
    const generator = new JSPDFGenerator();
    const blob = generator.generatePDF(data);
    
    console.log('✅ Alternative PDF Generator - Successfully generated PDF with jsPDF');
    return blob;
  } catch (error) {
    console.error('❌ Alternative PDF Generator - jsPDF failed:', error);
    throw new Error('Alternative PDF generation failed');
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).generateAlternativePDF = generateAlternativePDF;
  (window as any).JSPDFGenerator = JSPDFGenerator;
  console.log('🔧 Alternative PDF Generator - Functions exposed to window object for debugging');
}