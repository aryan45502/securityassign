const passwordUtils = require('./utils/passwordUtils');

// Test password validation
const testPasswords = [
  'weak123',
  'StrongPass123!',
  'MySecurePass456@',
  'password123',
  '123456789',
  'Abc123!@#',
  'TestPassword123!'
];

console.log('Testing password validation:');
console.log('==========================');

testPasswords.forEach(password => {
  const validation = passwordUtils.validatePassword(password);
  const strength = passwordUtils.assessPasswordStrength(password);
  
  console.log(`\nPassword: "${password}"`);
  console.log(`Valid: ${validation.isValid}`);
  console.log(`Strength: ${strength.strength}`);
  console.log(`Score: ${strength.score}/8`);
  console.log(`Feedback: ${strength.feedback.join(', ')}`);
});

console.log('\n\nPassword requirements summary:');
console.log('- At least 8 characters');
console.log('- At least one uppercase letter (A-Z)');
console.log('- At least one lowercase letter (a-z)');
console.log('- At least one number (0-9)');
console.log('- At least one special character (!@#$%^&*)');
console.log('- Score of 6 or higher required');
console.log('- Cannot be common passwords');
console.log('- Cannot have repeated characters'); 