// CSRF Testing Script
// Usage: node test-csrf.js [all|missing|invalid|valid|get]

const BASE_URL = 'http://localhost:5000';
const ADMIN_KEY = 'SECURITY_TEST_2024';

const testCases = [
  {
    name: 'Test 1: Missing CSRF Token',
    testType: 'missing_token',
    endpoint: '/api/auth/login',
    data: { email: 'test@example.com', password: 'test123' },
    expectedStatus: 403
  },
  {
    name: 'Test 2: Invalid CSRF Token',
    testType: 'invalid_token',
    endpoint: '/api/auth/login',
    data: { email: 'test@example.com', password: 'test123' },
    expectedStatus: 403
  },
  {
    name: 'Test 3: Valid CSRF Token',
    testType: 'valid_token',
    endpoint: '/api/auth/login',
    data: { email: 'test@example.com', password: 'test123' },
    expectedStatus: 401
  },
  {
    name: 'Test 4: GET Request (Should Bypass CSRF)',
    testType: 'get_request',
    endpoint: '/api/health',
    data: {},
    expectedStatus: 200
  },
  {
    name: 'Test 5: Registration Missing CSRF Token',
    testType: 'missing_token',
    endpoint: '/api/auth/register',
    data: { 
      name: 'Test User', 
      email: 'test@example.com', 
      phone: '1234567890', 
      password: 'TestPassword123!' 
    },
    expectedStatus: 403
  },
  {
    name: 'Test 6: Registration Invalid CSRF Token',
    testType: 'invalid_token',
    endpoint: '/api/auth/register',
    data: { 
      name: 'Test User', 
      email: 'test@example.com', 
      phone: '1234567890', 
      password: 'TestPassword123!' 
    },
    expectedStatus: 403
  },
  {
    name: 'Test 7: Registration Valid CSRF Token',
    testType: 'valid_token',
    endpoint: '/api/auth/register',
    data: { 
      name: 'Test User', 
      email: 'test@example.com', 
      phone: '1234567890', 
      password: 'TestPassword123!' 
    },
    expectedStatus: 400
  }
];

async function runCsrfTests() {
  console.log('🔒 CSRF PROTECTION TESTING');
  console.log('=' .repeat(50));
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`   Endpoint: ${testCase.endpoint}`);
    console.log(`   Expected Status: ${testCase.expectedStatus}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/test/csrf-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': ADMIN_KEY
        },
        body: JSON.stringify({
          testType: testCase.testType,
          endpoint: testCase.endpoint,
          data: testCase.data
        })
      });
      
      const result = await response.json();
      
      if (result.passed) {
        console.log(`   ✅ PASSED - Status: ${result.status}`);
        passedTests++;
      } else {
        console.log(`   ❌ FAILED - Expected: ${testCase.expectedStatus}, Got: ${result.status}`);
        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 RESULTS: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL CSRF TESTS PASSED! Your CSRF protection is working correctly.');
  } else {
    console.log('⚠️  Some CSRF tests failed. Please check your CSRF implementation.');
  }
}

// Manual CSRF Test Functions
async function testMissingToken() {
  console.log('\n🔍 Testing Missing CSRF Token...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 403) {
      console.log('✅ CSRF Protection Working! Missing token blocked.');
    } else {
      console.log('❌ CSRF Protection Failed! Expected 403.');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testInvalidToken() {
  console.log('\n🔍 Testing Invalid CSRF Token...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'invalid'
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 403) {
      console.log('✅ CSRF Protection Working! Invalid token blocked.');
    } else {
      console.log('❌ CSRF Protection Failed! Expected 403.');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testValidToken() {
  console.log('\n🔍 Testing Valid CSRF Token...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'valid-csrf-token-12345'
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 401) {
      console.log('✅ CSRF Protection Working! Valid token passed, auth failed as expected.');
    } else if (response.status === 403) {
      console.log('❌ CSRF Protection Failed! Valid token was rejected.');
    } else {
      console.log(`⚠️ Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testGetRequest() {
  console.log('\n🔍 Testing GET Request (Should Bypass CSRF)...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET'
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ CSRF Protection Working! GET request bypassed CSRF as expected.');
    } else {
      console.log('❌ CSRF Protection Failed! GET request was blocked.');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔒 CSRF Testing Script');
    console.log('Usage:');
    console.log('  node test-csrf.js all          - Run all tests');
    console.log('  node test-csrf.js missing      - Test missing token');
    console.log('  node test-csrf.js invalid      - Test invalid token');
    console.log('  node test-csrf.js valid        - Test valid token');
    console.log('  node test-csrf.js get          - Test GET request');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'all':
      runCsrfTests();
      break;
    case 'missing':
      testMissingToken();
      break;
    case 'invalid':
      testInvalidToken();
      break;
    case 'valid':
      testValidToken();
      break;
    case 'get':
      testGetRequest();
      break;
    default:
      console.log('Invalid command. Use: all, missing, invalid, valid, or get');
  }
}

module.exports = { runCsrfTests, testMissingToken, testInvalidToken, testValidToken, testGetRequest }; 