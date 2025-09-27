// Browser console test script for login functionality
// Copy and paste this into the browser console on the login page

console.log('🧪 Starting manual login test...');
console.log('📧 Test credentials: testuser@gmail.com / TestPassword123!');

// Function to test login
function testLogin() {
    // Find form elements
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !submitButton) {
        console.error('❌ Login form elements not found');
        console.log('Available inputs:', document.querySelectorAll('input'));
        console.log('Available buttons:', document.querySelectorAll('button'));
        return false;
    }
    
    console.log('✅ Found login form elements');
    
    // Clear any existing values
    emailInput.value = '';
    passwordInput.value = '';
    
    // Fill in test credentials
    emailInput.value = 'testuser@gmail.com';
    passwordInput.value = 'TestPassword123!';
    
    // Trigger React state updates
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    
    emailInput.dispatchEvent(inputEvent);
    emailInput.dispatchEvent(changeEvent);
    passwordInput.dispatchEvent(inputEvent);
    passwordInput.dispatchEvent(changeEvent);
    
    console.log('📝 Filled in credentials');
    console.log('Email value:', emailInput.value);
    console.log('Password length:', passwordInput.value.length);
    
    // Submit the form
    console.log('🚀 Submitting login form...');
    submitButton.click();
    
    // Monitor for results
    setTimeout(() => {
        const currentUrl = window.location.href;
        console.log('📍 Current URL after login attempt:', currentUrl);
        
        if (currentUrl.includes('/resume-builder') || currentUrl.includes('/dashboard') || !currentUrl.includes('/login')) {
            console.log('✅ Login appears successful - redirected away from login page');
        } else {
            console.log('❌ Login may have failed - still on login page');
            
            // Check for error messages
            const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], .text-red-500, .text-red-700');
            if (errorElements.length > 0) {
                console.log('🔍 Error messages found:');
                errorElements.forEach((el, index) => {
                    console.log(`  ${index + 1}. ${el.textContent.trim()}`);
                });
            } else {
                console.log('🤔 No visible error messages found');
            }
        }
    }, 3000);
    
    return true;
}

// Auto-run if on login page
if (window.location.href.includes('/login')) {
    console.log('🎯 Detected login page, running test in 2 seconds...');
    setTimeout(testLogin, 2000);
} else {
    console.log('⚠️ Not on login page. Navigate to /login first, then run testLogin()');
}

// Make testLogin available globally
window.testLogin = testLogin;
console.log('💡 You can also manually run testLogin() at any time');