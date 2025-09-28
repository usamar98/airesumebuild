// Font Bypass Test - Test PDF generation without custom font registration
// This test will help isolate if the Inter font registration is causing the DataView error

console.log('🧪 Starting font bypass test...');

// Test PDF generation without any custom fonts
async function testWithoutCustomFonts() {
  try {
    console.log('📋 Testing PDF generation without custom fonts...');
    
    // Import React PDF components directly
    const { Document, Page, Text, View, StyleSheet, pdf } = await import('@react-pdf/renderer');
    
    console.log('✅ React PDF imported successfully');
    
    // Create styles using only system fonts
    const styles = StyleSheet.create({
      page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica', // Use only system font
      },
      header: {
        marginBottom: 20,
        borderBottom: '2 solid #3B82F6',
        paddingBottom: 10,
      },
      name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 5,
      },
      contactInfo: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 2,
      },
      section: {
        marginBottom: 20,
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3B82F6',
        marginBottom: 10,
        borderBottom: '1 solid #E5E7EB',
        paddingBottom: 3,
      },
      text: {
        fontSize: 12,
        color: '#374151',
        marginBottom: 3,
      }
    });
    
    // Create minimal document without any custom fonts
    const MinimalDocument = () => {
      return React.createElement(Document, {}, 
        React.createElement(Page, { size: 'A4', style: styles.page },
          React.createElement(View, { style: styles.header },
            React.createElement(Text, { style: styles.name }, 'John Doe'),
            React.createElement(Text, { style: styles.contactInfo }, 'john.doe@email.com'),
            React.createElement(Text, { style: styles.contactInfo }, '+1 (555) 123-4567')
          ),
          React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, 'WORK EXPERIENCE'),
            React.createElement(Text, { style: styles.text }, 'Software Developer'),
            React.createElement(Text, { style: styles.text }, 'Tech Company'),
            React.createElement(Text, { style: styles.text }, '2020 - Present')
          ),
          React.createElement(View, { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, 'SKILLS'),
            React.createElement(Text, { style: styles.text }, 'JavaScript • React • Node.js')
          )
        )
      );
    };
    
    console.log('📋 Creating document...');
    const doc = React.createElement(MinimalDocument);
    
    console.log('📋 Generating PDF blob...');
    const blob = await pdf(doc).toBlob();
    
    console.log('✅ SUCCESS - PDF generated without custom fonts:', {
      size: blob.size,
      type: blob.type,
      sizeKB: Math.round(blob.size / 1024 * 100) / 100
    });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test-no-fonts.pdf';
    link.textContent = 'Download Test PDF (No Custom Fonts)';
    document.body.appendChild(link);
    
    console.log('📥 Download link created and added to page');
    
    return { success: true, blob };
    
  } catch (error) {
    console.error('❌ FAILED - PDF generation without custom fonts:', {
      error: error.message,
      stack: error.stack?.substring(0, 500),
      isDataViewError: error.message.includes('DataView') || error.message.includes('Offset'),
      isFontError: error.message.includes('font') || error.message.includes('Font')
    });
    
    return { success: false, error };
  }
}

// Test with different font families
async function testDifferentSystemFonts() {
  const systemFonts = ['Helvetica', 'Times-Roman', 'Courier'];
  const results = [];
  
  for (const fontFamily of systemFonts) {
    try {
      console.log(`\n🔤 Testing with font: ${fontFamily}`);
      
      const { Document, Page, Text, View, StyleSheet, pdf } = await import('@react-pdf/renderer');
      
      const styles = StyleSheet.create({
        page: {
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          padding: 30,
          fontFamily: fontFamily,
        },
        text: {
          fontSize: 12,
          color: '#000000',
        }
      });
      
      const TestDocument = () => {
        return React.createElement(Document, {}, 
          React.createElement(Page, { size: 'A4', style: styles.page },
            React.createElement(Text, { style: styles.text }, `Test with ${fontFamily} font`)
          )
        );
      };
      
      const doc = React.createElement(TestDocument);
      const blob = await pdf(doc).toBlob();
      
      console.log(`✅ ${fontFamily} - SUCCESS:`, { size: blob.size });
      results.push({ font: fontFamily, success: true, size: blob.size });
      
    } catch (error) {
      console.error(`❌ ${fontFamily} - FAILED:`, error.message);
      results.push({ font: fontFamily, success: false, error: error.message });
    }
  }
  
  console.log('\n📊 Font test results:', results);
  return results;
}

// Run tests
if (typeof window !== 'undefined' && typeof React !== 'undefined') {
  console.log('🚀 Starting font bypass tests...');
  
  testWithoutCustomFonts()
    .then(result => {
      console.log('\n📋 Basic test completed:', result.success ? 'SUCCESS' : 'FAILED');
      
      if (result.success) {
        console.log('✅ PDF generation works without custom fonts!');
        console.log('🔍 This suggests the Inter font registration is causing the DataView error.');
        
        // Test different system fonts
        return testDifferentSystemFonts();
      } else {
        console.log('❌ PDF generation still fails without custom fonts.');
        console.log('🔍 The issue is not related to font registration.');
      }
    })
    .then(fontResults => {
      if (fontResults) {
        const successfulFonts = fontResults.filter(r => r.success);
        const failedFonts = fontResults.filter(r => !r.success);
        
        console.log(`\n📊 Font test summary:`);
        console.log(`✅ Successful fonts: ${successfulFonts.map(f => f.font).join(', ')}`);
        console.log(`❌ Failed fonts: ${failedFonts.map(f => f.font).join(', ')}`);
      }
    })
    .catch(error => {
      console.error('🚨 Test execution failed:', error);
    });
} else {
  console.error('❌ Required dependencies not found');
  console.log('Available:', {
    React: typeof React,
    window: typeof window
  });
}