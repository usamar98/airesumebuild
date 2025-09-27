// Script to navigate to Preview & Download step and test PDF generation
console.log('🚀 Starting navigation to Preview & Download step...');

// Function to click the Preview & Download step
function navigateToPreviewStep() {
  // Look for step buttons or navigation elements
  const stepButtons = document.querySelectorAll('button, div, span');
  
  for (let button of stepButtons) {
    const text = button.textContent || button.innerText || '';
    if (text.includes('Preview') && text.includes('Download')) {
      console.log('📍 Found Preview & Download button:', text);
      button.click();
      return true;
    }
  }
  
  // Alternative: look for step 12 or final step
  for (let button of stepButtons) {
    const text = button.textContent || button.innerText || '';
    if (text.includes('12') || text.includes('Final') || text.includes('Download')) {
      console.log('📍 Found step button:', text);
      button.click();
      return true;
    }
  }
  
  console.log('❌ Could not find Preview & Download step button');
  return false;
}

// Function to wait for PDFPreview component to load
function waitForPDFPreview() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.generatePDF) {
        console.log('✅ PDFPreview component loaded, generatePDF function available');
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 500);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('⏰ Timeout waiting for PDFPreview component');
      resolve(false);
    }, 10000);
  });
}

// Function to trigger PDF generation and capture logs
async function triggerPDFGeneration() {
  console.log('🔄 Triggering PDF generation...');
  
  if (window.generatePDF) {
    try {
      await window.generatePDF();
      console.log('✅ PDF generation completed');
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
    }
  } else {
    console.log('❌ generatePDF function not available');
  }
}

// Main execution
async function main() {
  console.log('🎯 Step 1: Navigate to Preview & Download step');
  const navigated = navigateToPreviewStep();
  
  if (navigated) {
    console.log('🎯 Step 2: Wait for PDFPreview component to load');
    const loaded = await waitForPDFPreview();
    
    if (loaded) {
      console.log('🎯 Step 3: Trigger PDF generation');
      await triggerPDFGeneration();
    }
  }
  
  console.log('🏁 Navigation and PDF test completed');
}

// Execute the main function
main();