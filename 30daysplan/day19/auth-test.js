// Authentication Flow Test Script
// Run this in browser console to test authentication issues

console.log('🧪 Starting Authentication Flow Test');

// Test 1: Check current authentication state
function testCurrentAuthState() {
  console.log('\n📋 Test 1: Current Authentication State');
  
  // Check localStorage for Supabase data
  const localStorageKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('sb-') || key.includes('supabase')
  );
  
  // Check sessionStorage for Supabase data
  const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
    key.startsWith('sb-') || key.includes('supabase')
  );
  
  console.log('📦 LocalStorage Supabase keys:', localStorageKeys);
  console.log('📦 SessionStorage Supabase keys:', sessionStorageKeys);
  
  // Check if user appears authenticated
  const hasAuthData = localStorageKeys.length > 0 || sessionStorageKeys.length > 0;
  console.log('🔐 Has authentication data:', hasAuthData);
  
  return { localStorageKeys, sessionStorageKeys, hasAuthData };
}

// Test 2: Test logout functionality
function testLogoutFlow() {
  console.log('\n🚪 Test 2: Testing Logout Flow');
  
  // Get current auth state
  const beforeLogout = testCurrentAuthState();
  
  console.log('⚠️  To test logout:');
  console.log('1. Click the logout button in the navigation');
  console.log('2. Run testAfterLogout() in console');
  console.log('3. Refresh the page');
  console.log('4. Run testAfterRefresh() in console');
  
  return beforeLogout;
}

// Test 3: Check state after logout
function testAfterLogout() {
  console.log('\n✅ Test 3: After Logout State');
  
  const afterLogout = testCurrentAuthState();
  
  if (afterLogout.hasAuthData) {
    console.log('❌ FAIL: Authentication data still present after logout');
    console.log('🔧 This indicates logout is not properly clearing storage');
  } else {
    console.log('✅ PASS: Authentication data cleared after logout');
  }
  
  return afterLogout;
}

// Test 4: Check state after page refresh
function testAfterRefresh() {
  console.log('\n🔄 Test 4: After Page Refresh State');
  
  const afterRefresh = testCurrentAuthState();
  
  if (afterRefresh.hasAuthData) {
    console.log('❌ FAIL: User automatically logged back in after refresh');
    console.log('🔧 This indicates session persistence is not properly disabled');
  } else {
    console.log('✅ PASS: User remains logged out after refresh');
  }
  
  return afterRefresh;
}

// Test 5: Test protected route navigation
function testProtectedRoutes() {
  console.log('\n🛡️  Test 5: Testing Protected Routes');
  
  const routes = [
    '/resume-builder',
    '/resume-analyzer', 
    '/templates',
    '/cover-letter'
  ];
  
  console.log('🧭 To test protected routes:');
  routes.forEach(route => {
    console.log(`- Navigate to ${route} and check for infinite loading`);
  });
  
  console.log('✅ Expected: Routes should load immediately without infinite loading');
  console.log('❌ Problem: Routes get stuck in loading state');
}

// Test 6: Manual storage cleanup
function manualStorageCleanup() {
  console.log('\n🧹 Test 6: Manual Storage Cleanup');
  
  const beforeCleanup = testCurrentAuthState();
  
  // Clear all Supabase-related storage
  const localKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('sb-') || key.includes('supabase')
  );
  const sessionKeys = Object.keys(sessionStorage).filter(key => 
    key.startsWith('sb-') || key.includes('supabase')
  );
  
  localKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('🗑️  Removed localStorage key:', key);
  });
  
  sessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log('🗑️  Removed sessionStorage key:', key);
  });
  
  const afterCleanup = testCurrentAuthState();
  
  console.log('🔄 Refresh the page now to test if auto re-login occurs');
  
  return { beforeCleanup, afterCleanup };
}

// Run initial test
testCurrentAuthState();

console.log('\n🎯 Available test functions:');
console.log('- testCurrentAuthState() - Check current auth state');
console.log('- testLogoutFlow() - Test logout functionality');
console.log('- testAfterLogout() - Check state after logout');
console.log('- testAfterRefresh() - Check state after refresh');
console.log('- testProtectedRoutes() - Test protected route navigation');
console.log('- manualStorageCleanup() - Manually clear all auth storage');

console.log('\n📝 To run complete test:');
console.log('1. testLogoutFlow()');
console.log('2. Click logout button');
console.log('3. testAfterLogout()');
console.log('4. Refresh page');
console.log('5. testAfterRefresh()');
console.log('6. testProtectedRoutes()');