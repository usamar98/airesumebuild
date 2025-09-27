// Script to check localStorage resume data
console.log('🔍 Checking localStorage resume data...');

try {
  const resumeData = localStorage.getItem('resumeData');
  if (resumeData) {
    const parsed = JSON.parse(resumeData);
    console.log('📊 Resume data found in localStorage:');
    console.log('Personal Info:', {
      fullName: parsed.personalInfo?.fullName,
      email: parsed.personalInfo?.email,
      phone: parsed.personalInfo?.phone,
      address: parsed.personalInfo?.address,
      professionalSummary: parsed.personalInfo?.professionalSummary ? 'Present' : 'Missing'
    });
    console.log('Education:', parsed.education?.map(edu => ({
      degree: edu.degree,
      institution: edu.institution,
      startDate: edu.startDate,
      endDate: edu.endDate,
      gpa: edu.gpa
    })));
    console.log('Certifications:', parsed.certifications?.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      issuingOrganization: cert.issuingOrganization,
      date: cert.date,
      issueDate: cert.issueDate
    })));
    console.log('Work Experience:', parsed.workExperience?.map(exp => ({
      jobTitle: exp.jobTitle,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate
    })));
    console.log('Skills:', parsed.skills);
  } else {
    console.log('❌ No resume data found in localStorage');
  }
} catch (error) {
  console.error('❌ Error reading localStorage:', error);
}

// Also check legacy key
try {
  const legacyData = localStorage.getItem('updatedResumeData');
  if (legacyData) {
    console.log('📊 Legacy resume data found:', JSON.parse(legacyData));
  }
} catch (error) {
  console.log('No legacy data found');
}