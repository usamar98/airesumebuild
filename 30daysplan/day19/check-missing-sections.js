// Script to check localStorage data for missing sections
console.log('🔍 Checking localStorage data for missing sections...');

// Get data from localStorage
const resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}');
const sectionOrder = JSON.parse(localStorage.getItem('sectionOrder') || '[]');

console.log('=== MISSING SECTIONS DATA CHECK ===');

// Check each missing section
console.log('\n📋 Data availability:');
console.log('Volunteer Experience:', resumeData.volunteerExperience?.length || 0, 'items');
if(resumeData.volunteerExperience?.length) {
  console.log('  First volunteer item:', resumeData.volunteerExperience[0]);
}

console.log('Awards:', resumeData.awards?.length || 0, 'items');
if(resumeData.awards?.length) {
  console.log('  First award:', resumeData.awards[0]);
}

console.log('Languages:', resumeData.languageSkills?.length || 0, 'items');
if(resumeData.languageSkills?.length) {
  console.log('  First language:', resumeData.languageSkills[0]);
}

console.log('References:', resumeData.references?.length || 0, 'items');
if(resumeData.references?.length) {
  console.log('  First reference:', resumeData.references[0]);
}

console.log('Hobbies:', resumeData.hobbies?.length || 0, 'items');
if(resumeData.hobbies?.length) {
  console.log('  First hobby:', resumeData.hobbies[0]);
}

console.log('Publications:', resumeData.publications?.length || 0, 'items');
if(resumeData.publications?.length) {
  console.log('  First publication:', resumeData.publications[0]);
}

console.log('Patents:', resumeData.patents?.length || 0, 'items');
if(resumeData.patents?.length) {
  console.log('  First patent:', resumeData.patents[0]);
}

console.log('Speaking Engagements:', resumeData.speakingEngagements?.length || 0, 'items');
if(resumeData.speakingEngagements?.length) {
  console.log('  First speaking engagement:', resumeData.speakingEngagements[0]);
}

console.log('Professional Memberships:', resumeData.professionalMemberships?.length || 0, 'items');
if(resumeData.professionalMemberships?.length) {
  console.log('  First membership:', resumeData.professionalMemberships[0]);
}

console.log('\n📑 Section Order includes missing sections:');
const missingSections = [
  'Volunteer Experience', 
  'Awards & Achievements', 
  'Languages', 
  'References', 
  'Hobbies & Interests', 
  'Publications',
  'Patents',
  'Speaking Engagements',
  'Professional Memberships'
];

missingSections.forEach(section => {
  const included = sectionOrder.includes(section);
  console.log(`  ${section}: ${included ? '✅ YES' : '❌ NO'}`);
});

console.log('\n📊 Complete section order:');
sectionOrder.forEach((section, index) => {
  console.log(`  ${index + 1}. ${section}`);
});

console.log('\n🎯 Summary:');
console.log('Total sections in order:', sectionOrder.length);
console.log('Missing sections with data:', missingSections.filter(section => {
  const key = section === 'Languages' ? 'languageSkills' : 
              section === 'Awards & Achievements' ? 'awards' :
              section === 'Hobbies & Interests' ? 'hobbies' :
              section === 'Volunteer Experience' ? 'volunteerExperience' :
              section.toLowerCase().replace(/\s+/g, '').replace('&', '');
  return resumeData[key]?.length > 0;
}).length);