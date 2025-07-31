const passwordUtils = require('./utils/passwordUtils');

const testPasswords = [
  'Ag9841442999@@@@',
  'MySecurePass123!',
  'TestPassword456@',
  'weak123',
  'StrongPass789#'
];

console.log('Testing Updated Password Validation');
console.log('==================================');

testPasswords.forEach(password => {
  console.log(`\nPassword: "${password}"`);
  
  const validation = passwordUtils.validatePassword(password);
  const strength = passwordUtils.assessPasswordStrength(password);
  
  console.log(`Valid: ${validation.isValid}`);
  console.log(`Strength: ${strength.strength}`);
  console.log(`Score: ${strength.score}`);
  console.log(`Feedback: ${strength.feedback.join(', ')}`);
  
  // Manual calculation
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (/(.)\1{3,}/.test(password)) score -= 1; // Only penalize 4+ repeated chars
  
  console.log(`Manual score: ${score}`);
  console.log(`Has 4+ repeated chars: ${/(.)\1{3,}/.test(password)}`);
}); 