// Simple PDF Test - Copy and paste this into browser console
// This tests the absolute minimal case to identify the DataView error

console.log('🧪 Starting simple PDF test...');

// Test with absolutely minimal data
const minimalTestData = {
  personalInfo: {
    fullName: 'Test',
    email: 'test@test.com',
    phone: '123',
    address: 'Test',
    linkedin: '',
    github: '',
    portfolio: '',
    professionalSummary: 'Test',
    dateOfBirth: '',
    nationality: '',
    languages: []
  },
  workExperience: [],
  skills: [],
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
  hobbies: []
};

// Test with empty personal info
const emptyTestData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    linkedin: '',
    github: '',
    portfolio: '',
    professionalSummary: '',
    dateOfBirth: '',
    nationality: '',
    languages: []
  },
  workExperience: [],
  skills: [],
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
  hobbies: []
};

// Test with only one skill
const oneSkillData = {
  personalInfo: {
    fullName: 'Test',
    email: 'test@test.com',
    phone: '123',
    address: 'Test',
    linkedin: '',
    github: '',
    portfolio: '',
    professionalSummary: 'Test',
    dateOfBirth: '',
    nationality: '',
    languages: []
  },
  workExperience: [],
  skills: ['JavaScript'],
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
  hobbies: []
};

async function runSimpleTests() {
  const tests = [
    { name: 'Empty Data', data: emptyTestData },
    { name: 'Minimal Data', data: minimalTestData },
    { name: 'One Skill', data: oneSkillData }
  ];
  
  for (const test of tests) {
    console.log(`\n🔬 Testing: ${test.name}`);
    try {
      console.log('📋 Data:', test.data);
      const blob = await window.generatePDFBlob(test.data);
      console.log(`✅ ${test.name} - SUCCESS:`, { size: blob.size, type: blob.type });
    } catch (error) {
      console.error(`❌ ${test.name} - FAILED:`, {
        error: error.message,
        stack: error.stack,
        isDataViewError: error.message.includes('DataView') || error.message.includes('Offset')
      });
    }
  }
}

// Check if function is available
if (typeof window.generatePDFBlob === 'function') {
  console.log('✅ generatePDFBlob function found, starting tests...');
  runSimpleTests();
} else {
  console.error('❌ generatePDFBlob function not found on window object');
  console.log('Available window properties:', Object.keys(window).filter(key => key.includes('PDF') || key.includes('pdf')));
}