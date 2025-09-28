// Script to trigger PDF generation and capture debug logs
console.log('🧪 Starting PDF generation debug test...');

// Wait for the page to load and then trigger PDF generation
setTimeout(() => {
  console.log('📍 Current location:', window.location.href);
  
  // Check if we're on the resume builder page
  if (!window.location.hash.includes('resume-builder')) {
    console.log('🔄 Navigating to resume builder...');
    window.location.hash = '#/resume-builder';
    
    // Wait for navigation and try again
    setTimeout(() => {
      triggerPDFGeneration();
    }, 3000);
  } else {
    triggerPDFGeneration();
  }
}, 1000);

function triggerPDFGeneration() {
  console.log('🔍 Looking for PDF generation methods...');
  
  // Method 1: Try the exposed window.generatePDF function
  if (typeof window.generatePDF === 'function') {
    console.log('✅ Found window.generatePDF function, calling it...');
    try {
      window.generatePDF();
      console.log('✅ PDF generation triggered successfully');
      return;
    } catch (error) {
      console.error('❌ Error calling window.generatePDF:', error);
    }
  }
  
  // Method 2: Try to find and click the PDF generation button
  console.log('🔍 Looking for PDF generation button...');
  
  const selectors = [
    'button[data-testid="generate-pdf"]',
    'button:contains("Generate PDF Preview")',
    'button:contains("Generate PDF")',
    'button:contains("Preview")',
    'button[class*="bg-blue-600"]'
  ];
  
  let pdfButton = null;
  
  // Try each selector
  for (const selector of selectors) {
    try {
      pdfButton = document.querySelector(selector);
      if (pdfButton) {
        console.log(`✅ Found PDF button with selector: ${selector}`);
        break;
      }
    } catch (e) {
      // Ignore selector errors
    }
  }
  
  // If no button found with selectors, search by text content
  if (!pdfButton) {
    console.log('🔍 Searching for buttons by text content...');
    const buttons = Array.from(document.querySelectorAll('button'));
    
    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || '';
      if (text.includes('pdf') || text.includes('generate') || text.includes('preview')) {
        pdfButton = button;
        console.log(`✅ Found PDF button by text: "${button.textContent}"`);
        break;
      }
    }
  }
  
  if (pdfButton) {
    console.log('🖱️ Clicking PDF generation button...');
    pdfButton.click();
    
    // Wait a bit and check for console logs
    setTimeout(() => {
      console.log('⏰ Waiting for PDF generation logs...');
    }, 2000);
  } else {
    console.log('❌ No PDF generation button found');
    console.log('📋 Available buttons:');
    document.querySelectorAll('button').forEach((btn, index) => {
      console.log(`  ${index}: "${btn.textContent?.trim()}"`);
    });
  }
}

// Also expose this function globally for manual testing
window.triggerPDFDebug = triggerPDFGeneration;