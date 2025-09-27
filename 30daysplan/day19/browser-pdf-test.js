
// PDF Generation Test Script - Run in Browser Console
// This script tests various data configurations to identify the DataView error

async function testPDFGeneration() {
  console.log('🧪 Starting comprehensive PDF generation tests...');
  
  const testConfigurations = {
  "minimal": {
    "personalInfo": {
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "123-456-7890",
      "address": "Test Address",
      "linkedin": " ",
      "github": " ",
      "portfolio": " ",
      "professionalSummary": "Test Summary",
      "dateOfBirth": " ",
      "nationality": " ",
      "languages": []
    },
    "workExperience": [],
    "skills": [
      "JavaScript"
    ],
    "education": [],
    "certifications": [],
    "projects": [],
    "volunteerExperience": [],
    "awards": [],
    "languageSkills": [],
    "references": [],
    "availableOnRequest": false,
    "publications": [],
    "patents": [],
    "speakingEngagements": [],
    "professionalMemberships": [],
    "hobbies": []
  },
  "withWorkExperience": {
    "personalInfo": {
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "123-456-7890",
      "address": "Test Address",
      "linkedin": " ",
      "github": " ",
      "portfolio": " ",
      "professionalSummary": "Test Summary",
      "dateOfBirth": " ",
      "nationality": " ",
      "languages": []
    },
    "workExperience": [
      {
        "id": "1",
        "jobTitle": "Software Developer",
        "company": "Test Company",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1",
          "Achievement 2"
        ]
      }
    ],
    "skills": [
      "JavaScript",
      "React"
    ],
    "education": [],
    "certifications": [],
    "projects": [],
    "volunteerExperience": [],
    "awards": [],
    "languageSkills": [],
    "references": [],
    "availableOnRequest": false,
    "publications": [],
    "patents": [],
    "speakingEngagements": [],
    "professionalMemberships": [],
    "hobbies": []
  },
  "withHobbiesArray": {
    "personalInfo": {
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "123-456-7890",
      "address": "Test Address",
      "linkedin": " ",
      "github": " ",
      "portfolio": " ",
      "professionalSummary": "Test Summary",
      "dateOfBirth": " ",
      "nationality": " ",
      "languages": []
    },
    "workExperience": [],
    "skills": [
      "JavaScript"
    ],
    "education": [],
    "certifications": [],
    "projects": [],
    "volunteerExperience": [],
    "awards": [],
    "languageSkills": [],
    "references": [],
    "availableOnRequest": false,
    "publications": [],
    "patents": [],
    "speakingEngagements": [],
    "professionalMemberships": [],
    "hobbies": [
      "Reading",
      "Coding",
      "Gaming"
    ]
  },
  "withProblematicChars": {
    "personalInfo": {
      "fullName": "Test\u0000User\u0001",
      "email": "test@example.com",
      "phone": "123-456-7890",
      "address": "Test Address",
      "linkedin": " ",
      "github": " ",
      "portfolio": " ",
      "professionalSummary": "Test Summary with\u0002 control chars",
      "dateOfBirth": " ",
      "nationality": " ",
      "languages": []
    },
    "workExperience": [],
    "skills": [
      "JavaScript\u0003",
      "React\u0004"
    ],
    "education": [],
    "certifications": [],
    "projects": [],
    "volunteerExperience": [],
    "awards": [],
    "languageSkills": [],
    "references": [],
    "availableOnRequest": false,
    "publications": [],
    "patents": [],
    "speakingEngagements": [],
    "professionalMemberships": [],
    "hobbies": [
      "Reading\u0005",
      "Coding\u0006"
    ]
  },
  "withLargeData": {
    "personalInfo": {
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "123-456-7890",
      "address": "Test Address",
      "linkedin": " ",
      "github": " ",
      "portfolio": " ",
      "professionalSummary": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "dateOfBirth": " ",
      "nationality": " ",
      "languages": []
    },
    "workExperience": [
      {
        "id": "1",
        "jobTitle": "Job Title 1",
        "company": "Company 1",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 1",
          "Achievement 2 for job 1",
          "Achievement 3 for job 1",
          "Achievement 4 for job 1",
          "Achievement 5 for job 1",
          "Achievement 6 for job 1",
          "Achievement 7 for job 1",
          "Achievement 8 for job 1",
          "Achievement 9 for job 1",
          "Achievement 10 for job 1",
          "Achievement 11 for job 1",
          "Achievement 12 for job 1",
          "Achievement 13 for job 1",
          "Achievement 14 for job 1",
          "Achievement 15 for job 1",
          "Achievement 16 for job 1",
          "Achievement 17 for job 1",
          "Achievement 18 for job 1",
          "Achievement 19 for job 1",
          "Achievement 20 for job 1"
        ]
      },
      {
        "id": "2",
        "jobTitle": "Job Title 2",
        "company": "Company 2",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 2",
          "Achievement 2 for job 2",
          "Achievement 3 for job 2",
          "Achievement 4 for job 2",
          "Achievement 5 for job 2",
          "Achievement 6 for job 2",
          "Achievement 7 for job 2",
          "Achievement 8 for job 2",
          "Achievement 9 for job 2",
          "Achievement 10 for job 2",
          "Achievement 11 for job 2",
          "Achievement 12 for job 2",
          "Achievement 13 for job 2",
          "Achievement 14 for job 2",
          "Achievement 15 for job 2",
          "Achievement 16 for job 2",
          "Achievement 17 for job 2",
          "Achievement 18 for job 2",
          "Achievement 19 for job 2",
          "Achievement 20 for job 2"
        ]
      },
      {
        "id": "3",
        "jobTitle": "Job Title 3",
        "company": "Company 3",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 3",
          "Achievement 2 for job 3",
          "Achievement 3 for job 3",
          "Achievement 4 for job 3",
          "Achievement 5 for job 3",
          "Achievement 6 for job 3",
          "Achievement 7 for job 3",
          "Achievement 8 for job 3",
          "Achievement 9 for job 3",
          "Achievement 10 for job 3",
          "Achievement 11 for job 3",
          "Achievement 12 for job 3",
          "Achievement 13 for job 3",
          "Achievement 14 for job 3",
          "Achievement 15 for job 3",
          "Achievement 16 for job 3",
          "Achievement 17 for job 3",
          "Achievement 18 for job 3",
          "Achievement 19 for job 3",
          "Achievement 20 for job 3"
        ]
      },
      {
        "id": "4",
        "jobTitle": "Job Title 4",
        "company": "Company 4",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 4",
          "Achievement 2 for job 4",
          "Achievement 3 for job 4",
          "Achievement 4 for job 4",
          "Achievement 5 for job 4",
          "Achievement 6 for job 4",
          "Achievement 7 for job 4",
          "Achievement 8 for job 4",
          "Achievement 9 for job 4",
          "Achievement 10 for job 4",
          "Achievement 11 for job 4",
          "Achievement 12 for job 4",
          "Achievement 13 for job 4",
          "Achievement 14 for job 4",
          "Achievement 15 for job 4",
          "Achievement 16 for job 4",
          "Achievement 17 for job 4",
          "Achievement 18 for job 4",
          "Achievement 19 for job 4",
          "Achievement 20 for job 4"
        ]
      },
      {
        "id": "5",
        "jobTitle": "Job Title 5",
        "company": "Company 5",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 5",
          "Achievement 2 for job 5",
          "Achievement 3 for job 5",
          "Achievement 4 for job 5",
          "Achievement 5 for job 5",
          "Achievement 6 for job 5",
          "Achievement 7 for job 5",
          "Achievement 8 for job 5",
          "Achievement 9 for job 5",
          "Achievement 10 for job 5",
          "Achievement 11 for job 5",
          "Achievement 12 for job 5",
          "Achievement 13 for job 5",
          "Achievement 14 for job 5",
          "Achievement 15 for job 5",
          "Achievement 16 for job 5",
          "Achievement 17 for job 5",
          "Achievement 18 for job 5",
          "Achievement 19 for job 5",
          "Achievement 20 for job 5"
        ]
      },
      {
        "id": "6",
        "jobTitle": "Job Title 6",
        "company": "Company 6",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 6",
          "Achievement 2 for job 6",
          "Achievement 3 for job 6",
          "Achievement 4 for job 6",
          "Achievement 5 for job 6",
          "Achievement 6 for job 6",
          "Achievement 7 for job 6",
          "Achievement 8 for job 6",
          "Achievement 9 for job 6",
          "Achievement 10 for job 6",
          "Achievement 11 for job 6",
          "Achievement 12 for job 6",
          "Achievement 13 for job 6",
          "Achievement 14 for job 6",
          "Achievement 15 for job 6",
          "Achievement 16 for job 6",
          "Achievement 17 for job 6",
          "Achievement 18 for job 6",
          "Achievement 19 for job 6",
          "Achievement 20 for job 6"
        ]
      },
      {
        "id": "7",
        "jobTitle": "Job Title 7",
        "company": "Company 7",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 7",
          "Achievement 2 for job 7",
          "Achievement 3 for job 7",
          "Achievement 4 for job 7",
          "Achievement 5 for job 7",
          "Achievement 6 for job 7",
          "Achievement 7 for job 7",
          "Achievement 8 for job 7",
          "Achievement 9 for job 7",
          "Achievement 10 for job 7",
          "Achievement 11 for job 7",
          "Achievement 12 for job 7",
          "Achievement 13 for job 7",
          "Achievement 14 for job 7",
          "Achievement 15 for job 7",
          "Achievement 16 for job 7",
          "Achievement 17 for job 7",
          "Achievement 18 for job 7",
          "Achievement 19 for job 7",
          "Achievement 20 for job 7"
        ]
      },
      {
        "id": "8",
        "jobTitle": "Job Title 8",
        "company": "Company 8",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 8",
          "Achievement 2 for job 8",
          "Achievement 3 for job 8",
          "Achievement 4 for job 8",
          "Achievement 5 for job 8",
          "Achievement 6 for job 8",
          "Achievement 7 for job 8",
          "Achievement 8 for job 8",
          "Achievement 9 for job 8",
          "Achievement 10 for job 8",
          "Achievement 11 for job 8",
          "Achievement 12 for job 8",
          "Achievement 13 for job 8",
          "Achievement 14 for job 8",
          "Achievement 15 for job 8",
          "Achievement 16 for job 8",
          "Achievement 17 for job 8",
          "Achievement 18 for job 8",
          "Achievement 19 for job 8",
          "Achievement 20 for job 8"
        ]
      },
      {
        "id": "9",
        "jobTitle": "Job Title 9",
        "company": "Company 9",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 9",
          "Achievement 2 for job 9",
          "Achievement 3 for job 9",
          "Achievement 4 for job 9",
          "Achievement 5 for job 9",
          "Achievement 6 for job 9",
          "Achievement 7 for job 9",
          "Achievement 8 for job 9",
          "Achievement 9 for job 9",
          "Achievement 10 for job 9",
          "Achievement 11 for job 9",
          "Achievement 12 for job 9",
          "Achievement 13 for job 9",
          "Achievement 14 for job 9",
          "Achievement 15 for job 9",
          "Achievement 16 for job 9",
          "Achievement 17 for job 9",
          "Achievement 18 for job 9",
          "Achievement 19 for job 9",
          "Achievement 20 for job 9"
        ]
      },
      {
        "id": "10",
        "jobTitle": "Job Title 10",
        "company": "Company 10",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "achievements": [
          "Achievement 1 for job 10",
          "Achievement 2 for job 10",
          "Achievement 3 for job 10",
          "Achievement 4 for job 10",
          "Achievement 5 for job 10",
          "Achievement 6 for job 10",
          "Achievement 7 for job 10",
          "Achievement 8 for job 10",
          "Achievement 9 for job 10",
          "Achievement 10 for job 10",
          "Achievement 11 for job 10",
          "Achievement 12 for job 10",
          "Achievement 13 for job 10",
          "Achievement 14 for job 10",
          "Achievement 15 for job 10",
          "Achievement 16 for job 10",
          "Achievement 17 for job 10",
          "Achievement 18 for job 10",
          "Achievement 19 for job 10",
          "Achievement 20 for job 10"
        ]
      }
    ],
    "skills": [
      "Skill 1",
      "Skill 2",
      "Skill 3",
      "Skill 4",
      "Skill 5",
      "Skill 6",
      "Skill 7",
      "Skill 8",
      "Skill 9",
      "Skill 10",
      "Skill 11",
      "Skill 12",
      "Skill 13",
      "Skill 14",
      "Skill 15",
      "Skill 16",
      "Skill 17",
      "Skill 18",
      "Skill 19",
      "Skill 20",
      "Skill 21",
      "Skill 22",
      "Skill 23",
      "Skill 24",
      "Skill 25",
      "Skill 26",
      "Skill 27",
      "Skill 28",
      "Skill 29",
      "Skill 30",
      "Skill 31",
      "Skill 32",
      "Skill 33",
      "Skill 34",
      "Skill 35",
      "Skill 36",
      "Skill 37",
      "Skill 38",
      "Skill 39",
      "Skill 40",
      "Skill 41",
      "Skill 42",
      "Skill 43",
      "Skill 44",
      "Skill 45",
      "Skill 46",
      "Skill 47",
      "Skill 48",
      "Skill 49",
      "Skill 50"
    ],
    "education": [],
    "certifications": [],
    "projects": [],
    "volunteerExperience": [],
    "awards": [],
    "languageSkills": [],
    "references": [],
    "availableOnRequest": false,
    "publications": [],
    "patents": [],
    "speakingEngagements": [],
    "professionalMemberships": [],
    "hobbies": [
      "Hobby 1",
      "Hobby 2",
      "Hobby 3",
      "Hobby 4",
      "Hobby 5",
      "Hobby 6",
      "Hobby 7",
      "Hobby 8",
      "Hobby 9",
      "Hobby 10",
      "Hobby 11",
      "Hobby 12",
      "Hobby 13",
      "Hobby 14",
      "Hobby 15",
      "Hobby 16",
      "Hobby 17",
      "Hobby 18",
      "Hobby 19",
      "Hobby 20"
    ]
  }
};
  
  const results = {};
  
  for (const [configName, testData] of Object.entries(testConfigurations)) {
    console.log(`
🔬 Testing configuration: ${configName}`);
    console.log('📋 Test data summary:', {
      personalInfo: testData.personalInfo ? 'present' : 'missing',
      workExperience: testData.workExperience?.length || 0,
      skills: testData.skills?.length || 0,
      hobbies: testData.hobbies?.length || 0
    });
    
    try {
      console.log(`⚡ Attempting PDF generation for ${configName}...`);
      
      // Check if generatePDFBlob is available
      if (typeof window.generatePDFBlob !== 'function') {
        console.error('❌ generatePDFBlob function not found on window object');
        results[configName] = { success: false, error: 'Function not available' };
        continue;
      }
      
      const startTime = performance.now();
      const blob = await window.generatePDFBlob(testData);
      const endTime = performance.now();
      
      console.log(`✅ ${configName} - SUCCESS: PDF generated successfully`, {
        size: blob.size,
        type: blob.type,
        duration: `${(endTime - startTime).toFixed(2)}ms`
      });
      
      results[configName] = {
        success: true,
        size: blob.size,
        duration: endTime - startTime
      };
      
    } catch (error) {
      console.error(`❌ ${configName} - FAILED:`, {
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
  
  console.log('
📊 Test Results Summary:');
  console.table(results);
  
  // Analyze results
  const successful = Object.entries(results).filter(([_, result]) => result.success);
  const failed = Object.entries(results).filter(([_, result]) => !result.success);
  const dataViewErrors = failed.filter(([_, result]) => result.isDataViewError);
  
  console.log('
📈 Analysis:');
  console.log(`✅ Successful tests: ${successful.length}/${Object.keys(results).length}`);
  console.log(`❌ Failed tests: ${failed.length}/${Object.keys(results).length}`);
  console.log(`🚨 DataView errors: ${dataViewErrors.length}/${failed.length} failed tests`);
  
  if (successful.length > 0) {
    console.log('
✅ Working configurations:', successful.map(([name]) => name));
  }
  
  if (dataViewErrors.length > 0) {
    console.log('
🚨 Configurations causing DataView errors:', dataViewErrors.map(([name]) => name));
  }
  
  return results;
}

// Run the test
testPDFGeneration().then(results => {
  console.log('
🏁 All tests completed. Results stored in variable 'testResults'');
  window.testResults = results;
}).catch(error => {
  console.error('🚨 Test suite failed:', error);
});
