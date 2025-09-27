// Browser-based debugging script to compare LivePreview and PDFPreview data
// Run this in the browser console when on the Resume Builder page

function debugDataSynchronization() {
  console.log('🔍 === BROWSER DATA SYNCHRONIZATION DEBUG ===');
  
  // 1. Check localStorage data
  console.log('\n📦 Checking localStorage data...');
  const resumeDataKey = localStorage.getItem('resumeData');
  const legacyDataKey = localStorage.getItem('updatedResumeData');
  
  if (resumeDataKey) {
    try {
      const resumeData = JSON.parse(resumeDataKey);
      console.log('✅ Found resumeData in localStorage:', {
        personalInfo: {
          fullName: resumeData.personalInfo?.fullName,
          email: resumeData.personalInfo?.email,
          phone: resumeData.personalInfo?.phone
        },
        education: resumeData.education?.map(edu => ({
          degree: edu.degree,
          institution: edu.institution,
          startDate: edu.startDate,
          endDate: edu.endDate
        })),
        certifications: resumeData.certifications?.map(cert => ({
          name: cert.name,
          issuingOrganization: cert.issuingOrganization,
          issueDate: cert.issueDate,
          expirationDate: cert.expirationDate
        }))
      });
    } catch (e) {
      console.error('❌ Failed to parse resumeData:', e);
    }
  } else {
    console.log('❌ No resumeData found in localStorage');
  }
  
  if (legacyDataKey) {
    console.log('⚠️ Found legacy updatedResumeData in localStorage');
  }
  
  // 2. Check React component data
  console.log('\n🔍 Checking React component data...');
  
  // Try to find React components in DOM
  const reactElements = document.querySelectorAll('[data-reactroot], [data-react-checksum]');
  console.log(`Found ${reactElements.length} React elements`);
  
  // Look for specific component containers
  const livePreviewContainer = document.querySelector('[data-testid="live-preview"]') || 
                              document.querySelector('.live-preview') ||
                              document.querySelector('#live-preview');
  
  const pdfPreviewContainer = document.querySelector('[data-testid="pdf-preview"]') || 
                             document.querySelector('.pdf-preview') ||
                             document.querySelector('#pdf-preview');
  
  if (livePreviewContainer) {
    console.log('✅ LivePreview container found');
  } else {
    console.log('❌ LivePreview container not found');
  }
  
  if (pdfPreviewContainer) {
    console.log('✅ PDFPreview container found');
  } else {
    console.log('❌ PDFPreview container not found');
  }
  
  // 3. Check window debug functions
  console.log('\n🔧 Checking window debug functions...');
  if (typeof window.generatePDF === 'function') {
    console.log('✅ window.generatePDF function available');
  } else {
    console.log('❌ window.generatePDF function not available');
  }
  
  // 4. Intercept PDF generation to debug data
  if (typeof window.generatePDF === 'function') {
    const originalGeneratePDF = window.generatePDF;
    window.generatePDF = function(...args) {
      console.log('🔄 PDF Generation intercepted!');
      console.log('📊 Arguments passed to generatePDF:', args);
      
      // Call original function
      return originalGeneratePDF.apply(this, args);
    };
    console.log('✅ PDF generation function intercepted for debugging');
  }
  
  // 5. Check for data in DOM elements
  console.log('\n🔍 Checking data in DOM elements...');
  
  // Look for name display in LivePreview
  const nameElements = document.querySelectorAll('h1, .name, [data-testid="name"]');
  nameElements.forEach((el, index) => {
    if (el.textContent && el.textContent.trim()) {
      console.log(`Name element ${index + 1}:`, el.textContent.trim());
    }
  });
  
  // Look for education data in DOM
  const educationElements = document.querySelectorAll('[data-testid="education"], .education-section');
  educationElements.forEach((el, index) => {
    console.log(`Education element ${index + 1}:`, el.textContent?.substring(0, 200));
  });
  
  // Look for certification data in DOM
  const certificationElements = document.querySelectorAll('[data-testid="certifications"], .certifications-section');
  certificationElements.forEach((el, index) => {
    console.log(`Certification element ${index + 1}:`, el.textContent?.substring(0, 200));
  });
  
  return {
    hasResumeData: !!resumeDataKey,
    hasLegacyData: !!legacyDataKey,
    hasLivePreview: !!livePreviewContainer,
    hasPDFPreview: !!pdfPreviewContainer,
    hasGeneratePDF: typeof window.generatePDF === 'function'
  };
}

// Function to compare specific data fields
function compareDataFields() {
  console.log('\n🔍 === DETAILED DATA FIELD COMPARISON ===');
  
  const resumeDataKey = localStorage.getItem('resumeData');
  if (!resumeDataKey) {
    console.log('❌ No resume data to compare');
    return;
  }
  
  try {
    const resumeData = JSON.parse(resumeDataKey);
    
    console.log('\n👤 Personal Info Analysis:');
    console.log('Full Name:', resumeData.personalInfo?.fullName || 'UNDEFINED');
    console.log('Email:', resumeData.personalInfo?.email || 'UNDEFINED');
    console.log('Phone:', resumeData.personalInfo?.phone || 'UNDEFINED');
    
    console.log('\n🎓 Education Analysis:');
    if (resumeData.education && resumeData.education.length > 0) {
      resumeData.education.forEach((edu, index) => {
        console.log(`Education ${index + 1}:`, {
          degree: edu.degree || 'UNDEFINED',
          institution: edu.institution || 'UNDEFINED',
          startDate: edu.startDate || 'UNDEFINED',
          endDate: edu.endDate || 'UNDEFINED'
        });
      });
    } else {
      console.log('No education data found');
    }
    
    console.log('\n📜 Certifications Analysis:');
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      resumeData.certifications.forEach((cert, index) => {
        console.log(`Certification ${index + 1}:`, {
          name: cert.name || 'UNDEFINED',
          issuingOrganization: cert.issuingOrganization || 'UNDEFINED',
          issueDate: cert.issueDate || 'UNDEFINED',
          expirationDate: cert.expirationDate || 'UNDEFINED'
        });
      });
    } else {
      console.log('No certification data found');
    }
    
  } catch (e) {
    console.error('❌ Failed to parse resume data for comparison:', e);
  }
}

// Function to test PDF generation with debugging
function testPDFGenerationWithDebug() {
  console.log('\n🔄 === TESTING PDF GENERATION WITH DEBUG ===');
  
  if (typeof window.generatePDF !== 'function') {
    console.log('❌ window.generatePDF not available. Make sure you\'re on the Preview & Download step.');
    return;
  }
  
  console.log('🔄 Triggering PDF generation...');
  try {
    window.generatePDF();
    console.log('✅ PDF generation triggered successfully');
  } catch (e) {
    console.error('❌ PDF generation failed:', e);
  }
}

// Main function to run all debugging
function runFullDebug() {
  debugDataSynchronization();
  compareDataFields();
  
  console.log('\n🎯 === DEBUGGING COMPLETE ===');
  console.log('To test PDF generation, run: testPDFGenerationWithDebug()');
  console.log('To re-run data comparison, run: compareDataFields()');
}

// Expose functions to window for easy access
window.debugDataSynchronization = debugDataSynchronization;
window.compareDataFields = compareDataFields;
window.testPDFGenerationWithDebug = testPDFGenerationWithDebug;
window.runFullDebug = runFullDebug;

console.log('🔧 Browser debugging functions loaded!');
console.log('Available functions:');
console.log('- runFullDebug() - Run complete debugging suite');
console.log('- debugDataSynchronization() - Check data sync between components');
console.log('- compareDataFields() - Compare specific data fields');
console.log('- testPDFGenerationWithDebug() - Test PDF generation with debugging');

// Auto-run if script is executed
if (typeof window !== 'undefined') {
  runFullDebug();
}