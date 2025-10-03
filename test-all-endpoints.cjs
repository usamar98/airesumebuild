const http = require('http');
const fs = require('fs');

// Test data for different endpoints
const testData = {
  generatePdf: {
    resumeData: {
      personalInfo: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        location: 'New York, NY'
      },
      summary: 'Experienced software developer with 5+ years of experience.',
      workExperience: [
        {
          company: 'Tech Corp',
          position: 'Senior Developer',
          startDate: '2020-01',
          endDate: '2023-12',
          description: 'Led development of web applications using React and Node.js'
        }
      ],
      education: [
        {
          institution: 'University of Technology',
          degree: 'Bachelor of Computer Science',
          graduationDate: '2019-05'
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript']
    },
    templateId: 'default'
  }
};

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Helper function to create multipart form data
function createMultipartFormData(fieldName, filename, content, contentType) {
  const boundary = 'test-boundary-' + Date.now();
  const LF = '\r\n';
  
  const bodyLines = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"`,
    `Content-Type: ${contentType}`,
    '',
    content,
    `--${boundary}--`
  ];
  
  return {
    body: bodyLines.join(LF),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

// Test functions
async function testGeneratePdf() {
  console.log('\n=== Testing Generate PDF Endpoint ===');
  
  const postData = JSON.stringify(testData.generatePdf);
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/generate-pdf',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  try {
    const response = await makeRequest(options, postData);
    console.log(`Status: ${response.statusCode} ${response.statusMessage}`);
    
    if (response.statusCode === 200) {
      try {
        const parsed = JSON.parse(response.body);
        console.log('✅ Valid JSON response');
        console.log('Response:', parsed.success ? 'Success' : 'Failed');
      } catch (e) {
        console.log('❌ Invalid JSON response');
        console.log('Raw response:', response.body.substring(0, 200));
      }
    } else {
      console.log('❌ Non-200 status code');
      console.log('Response:', response.body);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function testAnalyzeResumeWithPdf() {
  console.log('\n=== Testing Analyze Resume Endpoint (PDF) ===');
  
  // Create a simple PDF content
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test Resume Content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;
  
  const formData = createMultipartFormData('resume', 'test-resume.pdf', pdfContent, 'application/pdf');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/analyze-resume',
    method: 'POST',
    headers: {
      'Content-Type': formData.contentType,
      'Content-Length': Buffer.byteLength(formData.body)
    }
  };
  
  try {
    const response = await makeRequest(options, formData.body);
    console.log(`Status: ${response.statusCode} ${response.statusMessage}`);
    
    if (response.statusCode === 200) {
      try {
        const parsed = JSON.parse(response.body);
        console.log('✅ Valid JSON response');
        console.log('Response:', parsed.success ? 'Success' : 'Failed');
      } catch (e) {
        console.log('❌ Invalid JSON response');
        console.log('Raw response:', response.body.substring(0, 200));
      }
    } else {
      console.log('❌ Non-200 status code');
      console.log('Response:', response.body);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function testAnalyzeResumeWithUnsupportedFile() {
  console.log('\n=== Testing Analyze Resume Endpoint (Unsupported File) ===');
  
  const textContent = 'This is a plain text resume file that should be rejected.';
  const formData = createMultipartFormData('resume', 'test-resume.txt', textContent, 'text/plain');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/analyze-resume',
    method: 'POST',
    headers: {
      'Content-Type': formData.contentType,
      'Content-Length': Buffer.byteLength(formData.body)
    }
  };
  
  try {
    const response = await makeRequest(options, formData.body);
    console.log(`Status: ${response.statusCode} ${response.statusMessage}`);
    
    if (response.statusCode === 400) {
      try {
        const parsed = JSON.parse(response.body);
        console.log('✅ Valid JSON error response');
        console.log('Error message:', parsed.error);
      } catch (e) {
        console.log('❌ Invalid JSON response');
        console.log('Raw response:', response.body.substring(0, 200));
      }
    } else {
      console.log('❌ Expected 400 status code');
      console.log('Response:', response.body);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function testParsePdfWithPdf() {
  console.log('\n=== Testing Parse PDF Endpoint (PDF) ===');
  
  // Create a simple PDF content
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test Resume Content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;
  
  const formData = createMultipartFormData('resume', 'test-resume.pdf', pdfContent, 'application/pdf');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/parse-pdf',
    method: 'POST',
    headers: {
      'Content-Type': formData.contentType,
      'Content-Length': Buffer.byteLength(formData.body)
    }
  };
  
  try {
    const response = await makeRequest(options, formData.body);
    console.log(`Status: ${response.statusCode} ${response.statusMessage}`);
    
    try {
      const parsed = JSON.parse(response.body);
      console.log('✅ Valid JSON response');
      console.log('Response:', parsed.success !== undefined ? (parsed.success ? 'Success' : 'Failed') : 'Unknown format');
    } catch (e) {
      console.log('❌ Invalid JSON response');
      console.log('Raw response:', response.body.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Testing All API Endpoints for JSON Response Validity\n');
  console.log('Server: http://localhost:3001');
  
  await testGeneratePdf();
  await testAnalyzeResumeWithPdf();
  await testAnalyzeResumeWithUnsupportedFile();
  await testParsePdfWithPdf();
  
  console.log('\n🏁 All tests completed!');
}

runAllTests().catch(console.error);