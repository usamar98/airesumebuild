const http = require('http');

// Test data for PDF generation
const testData = {
  resumeData: {
    personalInfo: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      location: 'New York, NY'
    },
    summary: 'Experienced software developer with 5+ years of experience in web development.',
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
};

const postData = JSON.stringify(testData);

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

console.log('Testing PDF generation endpoint...');
console.log('Sending request to: http://localhost:3001/api/generate-pdf');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received');
    
    if (res.headers['content-type'] && res.headers['content-type'].includes('application/pdf')) {
      console.log('PDF Response - Length:', data.length, 'bytes');
      console.log('PDF generation successful!');
    } else {
      console.log('Response Body:', data);
      try {
        const parsed = JSON.parse(data);
        console.log('Parsed JSON:', parsed);
      } catch (e) {
        console.log('Could not parse as JSON');
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();