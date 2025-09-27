// Test script to trigger PDF generation and capture errors
const testData = {
  personalInfo: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe',
    website: 'johndoe.com'
  },
  professionalSummary: 'Experienced software developer with 5+ years of experience.',
  skills: ['JavaScript', 'React', 'Node.js'],
  workExperience: [{
    company: 'Tech Corp',
    position: 'Software Developer',
    startDate: '2020-01',
    endDate: '2023-12',
    description: 'Developed web applications'
  }],
  education: [{
    institution: 'University',
    degree: 'Computer Science',
    graduationDate: '2020-05'
  }],
  hobbies: ['Reading', 'Hiking', 'Photography']
};

console.log('Test data prepared:', testData);
console.log('Hobbies type:', typeof testData.hobbies);
console.log('Hobbies is array:', Array.isArray(testData.hobbies));

// Store in localStorage for testing
localStorage.setItem('resumeData', JSON.stringify(testData));
console.log('Test data stored in localStorage');

// Try to access the PDF generation function
if (window.location.pathname.includes('resume-builder') || window.location.pathname.includes('builder')) {
  console.log('On resume builder page, attempting to trigger PDF generation...');
  
  // Wait for the page to load and then try to click the PDF button
  setTimeout(() => {
    const pdfButton = document.querySelector('button[data-testid="generate-pdf"]') || 
                     document.querySelector('button:contains("Generate PDF")') ||
                     document.querySelector('button[class*="pdf"]') ||
                     document.querySelector('button[class*="generate"]');
    
    if (pdfButton) {
      console.log('Found PDF button, clicking...');
      pdfButton.click();
    } else {
      console.log('PDF button not found, searching for any button with PDF text...');
      const buttons = document.querySelectorAll('button');
      buttons.forEach((btn, index) => {
        if (btn.textContent && btn.textContent.toLowerCase().includes('pdf')) {
          console.log(`Found PDF button ${index}:`, btn.textContent);
          btn.click();
        }
      });
    }
  }, 2000);
} else {
  console.log('Not on resume builder page. Current path:', window.location.pathname);
}