// Comprehensive PDF Generation Debug Script
// This script tests PDF generation with various data configurations to isolate the DataView error

const fs = require('fs');
const path = require('path');

// Test data configurations
const testConfigurations = {
  // Absolute minimal data
  minimal: {
    personalInfo: {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      address: 'Test Address',
      linkedin: ' ',
      github: ' ',
      portfolio: ' ',
      professionalSummary: 'Test Summary',
      dateOfBirth: ' ',
      nationality: ' ',
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
  },

  // Test with work experience
  withWorkExperience: {
    personalInfo: {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      address: 'Test Address',
      linkedin: ' ',
      github: ' ',
      portfolio: ' ',
      professionalSummary: 'Test Summary',
      dateOfBirth: ' ',
      nationality: ' ',
      languages: []
    },
    workExperience: [{
      id: '1',
      jobTitle: 'Software Developer',
      company: 'Test Company',
      startDate: '2020-01-01',
      endDate: '2023-12-31',
      achievements: ['Achievement 1', 'Achievement 2']
    }],
    skills: ['JavaScript', 'React'],
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
  },

  // Test with hobbies as array
  withHobbiesArray: {
    personalInfo: {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      address: 'Test Address',
      linkedin: ' ',
      github: ' ',
      portfolio: ' ',
      professionalSummary: 'Test Summary',
      dateOfBirth: ' ',
      nationality: ' ',
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
    hobbies: ['Reading', 'Coding', 'Gaming']
  },

  // Test with problematic characters
  withProblematicChars: {
    personalInfo: {
      fullName: 'Test\x00User\x01',
      email: 'test@example.com',
      phone: '123-456-7890',
      address: 'Test Address',
      linkedin: ' ',
      github: ' ',
      portfolio: ' ',
      professionalSummary: 'Test Summary with\x02 control chars',
      dateOfBirth: ' ',
      nationality: ' ',
      languages: []
    },
    workExperience: [],
    skills: ['JavaScript\x03', 'React\x04'],
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
    hobbies: ['Reading\x05', 'Coding\x06']
  },

  // Test with large data
  withLargeData: {
    personalInfo: {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      address: 'Test Address',
      linkedin: ' ',
      github: ' ',
      portfolio: ' ',
      professionalSummary: 'A'.repeat(2000), // Large summary
      dateOfBirth: ' ',
      nationality: ' ',
      languages: []
    },
    workExperience: Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      jobTitle: `Job Title ${i + 1}`,
      company: `Company ${i + 1}`,
      startDate: '2020-01-01',
      endDate: '2023-12-31',
      achievements: Array.from({ length: 20 }, (_, j) => `Achievement ${j + 1} for job ${i + 1}`)
    })),
    skills: Array.from({ length: 50 }, (_, i) => `Skill ${i + 1}`),
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
    hobbies: Array.from({ length: 20 }, (_, i) => `Hobby ${i + 1}`)
  }
};

// Function to test PDF generation in browser
function generateTestScript() {
  const testScript = `
// PDF Generation Test Script - Run in Browser Console
// This script tests various data configurations to identify the DataView error

async function testPDFGeneration() {
  console.log('🧪 Starting comprehensive PDF generation tests...');
  
  const testConfigurations = ${JSON.stringify(testConfigurations, null, 2)};
  
  const results = {};
  
  for (const [configName, testData] of Object.entries(testConfigurations)) {
    console.log(\`\n🔬 Testing configuration: \${configName}\`);
    console.log('📋 Test data summary:', {
      personalInfo: testData.personalInfo ? 'present' : 'missing',
      workExperience: testData.workExperience?.length || 0,
      skills: testData.skills?.length || 0,
      hobbies: testData.hobbies?.length || 0
    });
    
    try {
      console.log(\`⚡ Attempting PDF generation for \${configName}...\`);
      
      // Check if generatePDFBlob is available
      if (typeof window.generatePDFBlob !== 'function') {
        console.error('❌ generatePDFBlob function not found on window object');
        results[configName] = { success: false, error: 'Function not available' };
        continue;
      }
      
      const startTime = performance.now();
      const blob = await window.generatePDFBlob(testData);
      const endTime = performance.now();
      
      console.log(\`✅ \${configName} - SUCCESS: PDF generated successfully\`, {
        size: blob.size,
        type: blob.type,
        duration: \`\${(endTime - startTime).toFixed(2)}ms\`
      });
      
      results[configName] = {
        success: true,
        size: blob.size,
        duration: endTime - startTime
      };
      
    } catch (error) {
      console.error(\`❌ \${configName} - FAILED:\`, {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      
      results[configName] = {
        success: false,
        error: error.message,
        errorType: error.name,
        isDataViewError: error.message.includes('DataView') || error.message.includes('Offset') || error.message.includes('buffer')
      };
    }
    
    // Add delay between tests to prevent memory issues
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Results Summary:');
  console.table(results);
  
  // Analyze results
  const successful = Object.entries(results).filter(([_, result]) => result.success);
  const failed = Object.entries(results).filter(([_, result]) => !result.success);
  const dataViewErrors = failed.filter(([_, result]) => result.isDataViewError);
  
  console.log('\n📈 Analysis:');
  console.log(\`✅ Successful tests: \${successful.length}/\${Object.keys(results).length}\`);
  console.log(\`❌ Failed tests: \${failed.length}/\${Object.keys(results).length}\`);
  console.log(\`🚨 DataView errors: \${dataViewErrors.length}/\${failed.length} failed tests\`);
  
  if (successful.length > 0) {
    console.log('\n✅ Working configurations:', successful.map(([name]) => name));
  }
  
  if (dataViewErrors.length > 0) {
    console.log('\n🚨 Configurations causing DataView errors:', dataViewErrors.map(([name]) => name));
  }
  
  return results;
}

// Run the test
testPDFGeneration().then(results => {
  console.log('\n🏁 All tests completed. Results stored in variable \'testResults\'');
  window.testResults = results;
}).catch(error => {
  console.error('🚨 Test suite failed:', error);
});
`;

  return testScript;
}

// Write the test script to a file
const testScript = generateTestScript();
fs.writeFileSync(path.join(__dirname, 'browser-pdf-test.js'), testScript);

console.log('✅ Comprehensive PDF test script generated!');
console.log('📁 File saved as: browser-pdf-test.js');
console.log('\n📋 Instructions:');
console.log('1. Open your application in the browser');
console.log('2. Open browser developer tools (F12)');
console.log('3. Copy and paste the contents of browser-pdf-test.js into the console');
console.log('4. Press Enter to run the tests');
console.log('5. Review the test results to identify which data configurations cause the DataView error');
console.log('\n🔍 The script will test:');
console.log('- Minimal data configuration');
console.log('- Data with work experience');
console.log('- Data with hobbies array');
console.log('- Data with problematic characters');
console.log('- Data with large content');
console.log('\n📊 Results will show which configurations work and which cause DataView errors.');