// Minimal PDF Test - Test the absolute simplest PDF generation
// Copy and paste this into browser console

console.log('🧪 Starting minimal PDF test...');

// Import React and ReactPDF components
const { Document, Page, Text, View, StyleSheet, pdf } = window.ReactPDF;

// Test 1: Absolutely minimal document
const MinimalDocument = () => {
  return React.createElement(Document, {}, 
    React.createElement(Page, { size: 'A4' },
      React.createElement(View, {},
        React.createElement(Text, {}, 'Hello World')
      )
    )
  );
};

// Test 2: Empty document
const EmptyDocument = () => {
  return React.createElement(Document, {}, 
    React.createElement(Page, { size: 'A4' },
      React.createElement(View, {})
    )
  );
};

// Test 3: Document with basic styling
const StyledDocument = () => {
  const styles = {
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF'
    },
    section: {
      margin: 10,
      padding: 10
    }
  };
  
  return React.createElement(Document, {}, 
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(View, { style: styles.section },
        React.createElement(Text, {}, 'Styled Text')
      )
    )
  );
};

async function testMinimalPDF() {
  const tests = [
    { name: 'Empty Document', component: EmptyDocument },
    { name: 'Minimal Document', component: MinimalDocument },
    { name: 'Styled Document', component: StyledDocument }
  ];
  
  for (const test of tests) {
    console.log(`\n🔬 Testing: ${test.name}`);
    try {
      console.log('📋 Creating document...');
      const doc = React.createElement(test.component);
      
      console.log('📋 Generating PDF blob...');
      const blob = await pdf(doc).toBlob();
      
      console.log(`✅ ${test.name} - SUCCESS:`, { 
        size: blob.size, 
        type: blob.type,
        sizeKB: Math.round(blob.size / 1024 * 100) / 100
      });
      
      // Try to create download link
      const url = URL.createObjectURL(blob);
      console.log(`📥 Download URL for ${test.name}:`, url);
      
    } catch (error) {
      console.error(`❌ ${test.name} - FAILED:`, {
        error: error.message,
        stack: error.stack?.substring(0, 500),
        isDataViewError: error.message.includes('DataView') || error.message.includes('Offset'),
        isFontError: error.message.includes('font') || error.message.includes('Font'),
        isUnicodeError: error.message.includes('Unicode') || error.message.includes('unicode')
      });
    }
  }
}

// Check if ReactPDF is available
if (typeof window.ReactPDF !== 'undefined' && typeof React !== 'undefined') {
  console.log('✅ ReactPDF and React found, starting minimal tests...');
  testMinimalPDF();
} else {
  console.error('❌ ReactPDF or React not found');
  console.log('Available window properties:', Object.keys(window).filter(key => 
    key.includes('React') || key.includes('PDF') || key.includes('pdf')
  ));
}

// Also test if we can access the pdf function directly
if (typeof window.ReactPDF?.pdf === 'function') {
  console.log('\n🔧 Testing direct pdf() function access...');
  
  // Test with the simplest possible element
  const simpleElement = React.createElement('div', {}, 'test');
  
  window.ReactPDF.pdf(simpleElement).toBlob()
    .then(blob => {
      console.log('✅ Direct pdf() test - SUCCESS:', { size: blob.size });
    })
    .catch(error => {
      console.error('❌ Direct pdf() test - FAILED:', error.message);
    });
}