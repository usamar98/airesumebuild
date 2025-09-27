// Simple injection script
console.log('🔍 Testing missing sections in PDF...');

// Check localStorage data for missing sections
const resumeDataStr = localStorage.getItem('resumeData');
if (!resumeDataStr) {
  console.log('❌ No resumeData found in localStorage');
} else {
  const resumeData = JSON.parse(resumeDataStr);
  
  console.log('🔍 Missing sections data check:');
  console.log('  - Volunteer Experience:', resumeData.volunteerExperience?.length || 0, 'items');
  console.log('  - Awards:', resumeData.awards?.length || 0, 'items');
  console.log('  - Language Skills:', resumeData.languageSkills?.length || 0, 'items');
  console.log('  - References:', resumeData.references?.length || 0, 'items');
  console.log('  - Publications:', resumeData.publications?.length || 0, 'items');
  console.log('  - Hobbies:', resumeData.hobbies?.length || 0, 'items');
  
  // Log actual data content for missing sections
  if (resumeData.volunteerExperience?.length > 0) {
    console.log('📋 Volunteer Experience data:', resumeData.volunteerExperience[0]);
  }
  if (resumeData.awards?.length > 0) {
    console.log('🏆 Awards data:', resumeData.awards[0]);
  }
  if (resumeData.languageSkills?.length > 0) {
    console.log('🌐 Language Skills data:', resumeData.languageSkills);
  }
  if (resumeData.references?.length > 0) {
    console.log('👥 References data:', resumeData.references[0]);
  }
  if (resumeData.publications?.length > 0) {
    console.log('📚 Publications data:', resumeData.publications[0]);
  }
  if (resumeData.hobbies?.length > 0) {
    console.log('🎯 Hobbies data:', resumeData.hobbies);
  }
  
  // Generate PDF and test
  if (typeof window.generatePDFBlob === 'function') {
    console.log('🔄 Generating test PDF...');
    window.generatePDFBlob(resumeData)
      .then(blob => {
        console.log('✅ Test PDF generated, size:', blob.size);
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'debug-missing-sections.pdf';
        link.textContent = '📄 Download Debug PDF';
        link.style.cssText = `
          position: fixed;
          top: 160px;
          right: 20px;
          background: #e74c3c;
          color: white;
          padding: 10px 15px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
          z-index: 9999;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        // Remove existing debug links
        const existingLinks = document.querySelectorAll('a[download*="debug-missing"]');
        existingLinks.forEach(link => link.remove());
        
        document.body.appendChild(link);
        console.log('📄 Debug PDF download link added');
      })
      .catch(error => {
        console.error('❌ PDF generation failed:', error);
      });
  }
}

console.log('✅ Debug test completed');