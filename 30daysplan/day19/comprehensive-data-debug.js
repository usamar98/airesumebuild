// Comprehensive Data Debugging Script
// This script compares data access between LivePreview and PDF generation

function comprehensiveDataDebug() {
  console.log('🔍 === COMPREHENSIVE DATA DEBUGGING ===');
  
  // 1. Check localStorage data
  const resumeData = localStorage.getItem('resumeData');
  const updatedResumeData = localStorage.getItem('updatedResumeData');
  
  console.log('📦 localStorage resumeData exists:', !!resumeData);
  console.log('📦 localStorage updatedResumeData exists:', !!updatedResumeData);
  
  let parsedData = null;
  try {
    parsedData = resumeData ? JSON.parse(resumeData) : null;
    console.log('✅ resumeData parsed successfully');
  } catch (e) {
    console.error('❌ Error parsing resumeData:', e);
    return;
  }
  
  if (!parsedData) {
    console.error('❌ No resume data found in localStorage');
    return;
  }
  
  // 2. Log the complete data structure
  console.log('\n🏗️ === COMPLETE DATA STRUCTURE ===');
  console.log('Full data object:', parsedData);
  
  // 3. Check personal info specifically
  console.log('\n👤 === PERSONAL INFO ANALYSIS ===');
  const personalInfo = parsedData.personalInfo || {};
  console.log('personalInfo object:', personalInfo);
  console.log('fullName:', personalInfo.fullName, '(type:', typeof personalInfo.fullName, ')');
  console.log('email:', personalInfo.email, '(type:', typeof personalInfo.email, ')');
  console.log('phone:', personalInfo.phone, '(type:', typeof personalInfo.phone, ')');
  console.log('address:', personalInfo.address, '(type:', typeof personalInfo.address, ')');
  console.log('linkedin:', personalInfo.linkedin, '(type:', typeof personalInfo.linkedin, ')');
  
  // 4. Check education data
  console.log('\n🎓 === EDUCATION DATA ANALYSIS ===');
  const education = parsedData.education || [];
  console.log('education array length:', education.length);
  education.forEach((edu, index) => {
    console.log(`Education ${index}:`, {
      degree: edu.degree,
      institution: edu.institution,
      startDate: edu.startDate,
      endDate: edu.endDate,
      gpa: edu.gpa
    });
    console.log(`  startDate type: ${typeof edu.startDate}, value: "${edu.startDate}"`);
    console.log(`  endDate type: ${typeof edu.endDate}, value: "${edu.endDate}"`);
  });
  
  // 5. Check certifications data
  console.log('\n🏆 === CERTIFICATIONS DATA ANALYSIS ===');
  const certifications = parsedData.certifications || [];
  console.log('certifications array length:', certifications.length);
  certifications.forEach((cert, index) => {
    console.log(`Certification ${index}:`, {
      name: cert.name,
      issuingOrganization: cert.issuingOrganization,
      issueDate: cert.issueDate,
      expirationDate: cert.expirationDate
    });
    console.log(`  issueDate type: ${typeof cert.issueDate}, value: "${cert.issueDate}"`);
    console.log(`  expirationDate type: ${typeof cert.expirationDate}, value: "${cert.expirationDate}"`);
  });
  
  // 6. Check if PDFPreview component exists and its props
  console.log('\n📄 === PDF PREVIEW COMPONENT CHECK ===');
  const pdfPreview = document.querySelector('[data-testid="pdf-preview"]') || 
                    document.querySelector('.pdf-preview') ||
                    document.querySelector('#pdf-preview');
  
  if (pdfPreview) {
    console.log('✅ PDFPreview component found in DOM');
    // Try to access React props if available
    const reactKey = Object.keys(pdfPreview).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalFiber'));
    if (reactKey) {
      console.log('🔍 React instance found, checking props...');
      try {
        const reactInstance = pdfPreview[reactKey];
        const props = reactInstance?.memoizedProps || reactInstance?.pendingProps;
        if (props) {
          console.log('📋 PDFPreview props data:', props.data);
        }
      } catch (e) {
        console.log('⚠️ Could not access React props:', e.message);
      }
    }
  } else {
    console.log('❌ PDFPreview component not found in DOM');
  }
  
  // 7. Check if LivePreview component exists
  console.log('\n👁️ === LIVE PREVIEW COMPONENT CHECK ===');
  const livePreview = document.querySelector('[data-testid="live-preview"]') || 
                     document.querySelector('.live-preview') ||
                     document.querySelector('#live-preview');
  
  if (livePreview) {
    console.log('✅ LivePreview component found in DOM');
  } else {
    console.log('❌ LivePreview component not found in DOM');
  }
  
  // 8. Check window.generatePDF function
  console.log('\n⚙️ === PDF GENERATION FUNCTION CHECK ===');
  if (typeof window.generatePDF === 'function') {
    console.log('✅ window.generatePDF function is available');
    
    // Try to intercept the function to see what data it receives
    const originalGeneratePDF = window.generatePDF;
    window.generatePDF = function(...args) {
      console.log('🔍 generatePDF called with arguments:', args);
      return originalGeneratePDF.apply(this, args);
    };
    console.log('🔧 generatePDF function intercepted for debugging');
  } else {
    console.log('❌ window.generatePDF function not available');
  }
  
  // 9. Summary
  console.log('\n📊 === DEBUGGING SUMMARY ===');
  console.log('Data source: localStorage resumeData');
  console.log('Personal info complete:', !!(personalInfo.fullName && personalInfo.email));
  console.log('Education entries:', education.length);
  console.log('Certification entries:', certifications.length);
  console.log('PDFPreview in DOM:', !!pdfPreview);
  console.log('LivePreview in DOM:', !!livePreview);
  console.log('generatePDF available:', typeof window.generatePDF === 'function');
  
  console.log('\n🎯 === NEXT STEPS ===');
  console.log('1. Navigate to Preview & Download step');
  console.log('2. Run: window.generatePDF() to test PDF generation');
  console.log('3. Check console for data flow during PDF generation');
  
  return parsedData;
}

// Auto-run the debugging
const debugData = comprehensiveDataDebug();

// Make it available globally
window.comprehensiveDataDebug = comprehensiveDataDebug;
window.debugData = debugData;

console.log('\n🚀 Debugging complete! Use window.comprehensiveDataDebug() to run again.');