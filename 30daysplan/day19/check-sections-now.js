// Quick check of current sections in localStorage
console.log('🔍 Quick Section Check:');

const resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}');
const sectionOrder = JSON.parse(localStorage.getItem('sectionOrder') || '[]');

console.log('📊 Section Data Summary:');
const sections = {
  'volunteerExperience': resumeData.volunteerExperience,
  'awards': resumeData.awards,
  'languageSkills': resumeData.languageSkills,
  'references': resumeData.references,
  'hobbies': resumeData.hobbies,
  'publications': resumeData.publications,
  'patents': resumeData.patents,
  'speakingEngagements': resumeData.speakingEngagements,
  'professionalMemberships': resumeData.professionalMemberships
};

Object.entries(sections).forEach(([key, value]) => {
  console.log(`${key}:`, {
    exists: value !== undefined,
    type: typeof value,
    isArray: Array.isArray(value),
    length: value?.length || 0,
    hasData: Array.isArray(value) ? value.length > 0 : !!value,
    sample: Array.isArray(value) ? value[0] : value
  });
});

console.log('\n📋 Section Order:', sectionOrder);

// Test PDF generation immediately
if (typeof window.generatePDFBlob === 'function') {
  console.log('\n🔄 Testing PDF generation...');
  
  window.generatePDFBlob(resumeData, null, sectionOrder)
    .then(blob => {
      console.log('✅ PDF generated! Size:', blob.size);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'test-sections.pdf';
      link.textContent = 'Download Test PDF';
      link.style.cssText = 'position: fixed; top: 50px; right: 10px; z-index: 9999; background: #2196F3; color: white; padding: 10px; text-decoration: none; border-radius: 5px;';
      document.body.appendChild(link);
      
      console.log('🔗 Test PDF download link added');
    })
    .catch(error => {
      console.error('❌ PDF generation failed:', error);
    });
}

console.log('✅ Section check complete');