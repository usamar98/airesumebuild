const fs = require('fs');
const http = require('http');

function testEndpoint() {
  const fileContent = fs.readFileSync('test-resume.txt');
  const boundary = '----formdata-boundary-' + Math.random().toString(36);
  
  const formData = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="resume"; filename="test-resume.txt"',
    'Content-Type: text/plain',
    '',
    fileContent.toString(),
    `--${boundary}--`,
    ''
  ].join('\r\n');

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/analyze-resume',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(formData)
    }
  };

  console.log('Sending request to: http://localhost:3001/api/analyze-resume');
  
  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Status Message:', res.statusMessage);
    console.log('Headers:', res.headers);
    
    let responseBody = '';
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Body:', responseBody);
      
      if (responseBody) {
        try {
          const jsonResponse = JSON.parse(responseBody);
          console.log('Parsed JSON:', JSON.stringify(jsonResponse, null, 2));
        } catch (parseError) {
          console.log('Failed to parse as JSON:', parseError.message);
        }
      } else {
        console.log('Empty response body');
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.write(formData);
  req.end();
}

testEndpoint();