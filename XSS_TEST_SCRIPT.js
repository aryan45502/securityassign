// XSS Testing Script for MediConnect
// Run this in browser console to test for XSS vulnerabilities

console.log('🔍 Starting XSS Security Test for MediConnect...');

// XSS Payloads to test
const xssPayloads = [
    '<script>alert("XSS Test 1")</script>',
    '<img src="x" onerror="alert(\'XSS Test 2\')">',
    '"><script>alert("XSS Test 3")</script>',
    '" onmouseover="alert(\'XSS Test 4\')" "',
    'javascript:alert("XSS Test 5")',
    '&#60;script&#62;alert("XSS Test 6")&#60;/script&#62;',
    '\u003Cscript\u003Ealert("XSS Test 7")\u003C/script\u003E',
    '<ScRiPt>alert("XSS Test 8")</ScRiPt>',
    '<svg onload="alert(\'XSS Test 9\')">',
    '<iframe src="javascript:alert(\'XSS Test 10\')"></iframe>'
];

// Test results storage
let testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    vulnerableFields: []
};

// Function to test a single input field
function testInputField(field, payload, testName) {
    testResults.totalTests++;
    
    try {
        // Store original value
        const originalValue = field.value;
        
        // Set XSS payload
        field.value = payload;
        
        // Check if the value was sanitized
        const currentValue = field.value;
        
        // Test if script tags are present
        const hasScriptTags = /<script/i.test(currentValue);
        const hasEventHandlers = /on\w+\s*=/i.test(currentValue);
        const hasJavaScriptProtocol = /javascript:/i.test(currentValue);
        
        if (hasScriptTags || hasEventHandlers || hasJavaScriptProtocol) {
            testResults.failedTests++;
            testResults.vulnerableFields.push({
                field: field.name || field.id || 'unknown',
                testName: testName,
                payload: payload,
                currentValue: currentValue
            });
            console.log(`❌ VULNERABLE: ${testName} - Field: ${field.name || field.id}`);
        } else {
            testResults.passedTests++;
            console.log(`✅ PROTECTED: ${testName} - Field: ${field.name || field.id}`);
        }
        
        // Restore original value
        field.value = originalValue;
        
    } catch (error) {
        console.error(`❌ ERROR testing ${testName}:`, error);
    }
}

// Function to test all forms on the page
function testAllForms() {
    console.log('🔍 Testing all forms for XSS vulnerabilities...');
    
    const forms = document.querySelectorAll('form');
    console.log(`Found ${forms.length} forms to test`);
    
    forms.forEach((form, formIndex) => {
        console.log(`\n📋 Testing Form ${formIndex + 1}: ${form.action || 'No action'}`);
        
        const inputs = form.querySelectorAll('input, textarea');
        console.log(`Found ${inputs.length} input fields`);
        
        inputs.forEach((input, inputIndex) => {
            // Skip password fields for security
            if (input.type === 'password') {
                console.log(`⏭️ Skipping password field: ${input.name || input.id}`);
                return;
            }
            
            // Test each payload
            xssPayloads.forEach((payload, payloadIndex) => {
                const testName = `Form${formIndex + 1}_Input${inputIndex + 1}_Payload${payloadIndex + 1}`;
                testInputField(input, payload, testName);
            });
        });
    });
}

// Function to test URL parameters for reflected XSS
function testURLParameters() {
    console.log('\n🔍 Testing URL parameters for reflected XSS...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const testParams = ['q', 'search', 'id', 'name', 'email'];
    
    testParams.forEach(param => {
        if (urlParams.has(param)) {
            const value = urlParams.get(param);
            console.log(`⚠️ URL Parameter found: ${param} = ${value}`);
            
            // Check if the parameter value is reflected in the page
            const pageContent = document.body.innerHTML;
            if (pageContent.includes(value)) {
                console.log(`❌ POTENTIAL REFLECTED XSS: Parameter ${param} is reflected in page`);
            }
        }
    });
}

// Function to test localStorage/sessionStorage for stored XSS
function testStorageXSS() {
    console.log('\n🔍 Testing localStorage/sessionStorage for stored XSS...');
    
    try {
        // Check localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            if (value && (/<script/i.test(value) || /javascript:/i.test(value))) {
                console.log(`❌ POTENTIAL STORED XSS in localStorage: ${key} = ${value}`);
            }
        }
        
        // Check sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            
            if (value && (/<script/i.test(value) || /javascript:/i.test(value))) {
                console.log(`❌ POTENTIAL STORED XSS in sessionStorage: ${key} = ${value}`);
            }
        }
        
        console.log('✅ No stored XSS found in browser storage');
        
    } catch (error) {
        console.error('❌ Error testing storage XSS:', error);
    }
}

// Function to check security headers
function checkSecurityHeaders() {
    console.log('\n🔍 Checking security headers...');
    
    // This would need to be done server-side, but we can check if CSP is active
    const metaTags = document.querySelectorAll('meta');
    let hasCSP = false;
    
    metaTags.forEach(tag => {
        if (tag.httpEquiv === 'Content-Security-Policy') {
            hasCSP = true;
            console.log('✅ Content Security Policy found:', tag.content);
        }
    });
    
    if (!hasCSP) {
        console.log('⚠️ No Content Security Policy meta tag found');
    }
}

// Function to generate test report
function generateReport() {
    console.log('\n📊 XSS Security Test Report');
    console.log('============================');
    console.log(`Total Tests: ${testResults.totalTests}`);
    console.log(`Passed: ${testResults.passedTests}`);
    console.log(`Failed: ${testResults.failedTests}`);
    console.log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%`);
    
    if (testResults.vulnerableFields.length > 0) {
        console.log('\n❌ VULNERABLE FIELDS FOUND:');
        testResults.vulnerableFields.forEach(vuln => {
            console.log(`- Field: ${vuln.field}`);
            console.log(`  Test: ${vuln.testName}`);
            console.log(`  Payload: ${vuln.payload}`);
            console.log(`  Current Value: ${vuln.currentValue}`);
            console.log('');
        });
    } else {
        console.log('\n✅ No XSS vulnerabilities detected!');
    }
}

// Main test function
function runXSSSecurityTest() {
    console.log('🚀 Starting comprehensive XSS security test...');
    
    // Reset test results
    testResults = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        vulnerableFields: []
    };
    
    // Run all tests
    testAllForms();
    testURLParameters();
    testStorageXSS();
    checkSecurityHeaders();
    
    // Generate final report
    setTimeout(() => {
        generateReport();
    }, 1000);
}

// Auto-run the test when script is loaded
runXSSSecurityTest();

// Export functions for manual testing
window.XSSTest = {
    runXSSSecurityTest,
    testAllForms,
    testURLParameters,
    testStorageXSS,
    checkSecurityHeaders,
    generateReport,
    testResults
};

console.log('✅ XSS Testing Script loaded. Use window.XSSTest to access functions.'); 