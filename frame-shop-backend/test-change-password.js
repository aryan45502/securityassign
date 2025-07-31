const User = require('./models/User');
const passwordUtils = require('./utils/passwordUtils');
const mongoose = require('mongoose');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/frame-shop');

const testChangePassword = async () => {
  try {
    console.log('Testing Change Password Functionality');
    console.log('====================================');
    
    // Test 1: Password Validation
    console.log('\n1. Testing Password Validation:');
    const testPasswords = [
      'weak123',
      'StrongPass123!',
      'MySecurePass456@',
      'password123'
    ];
    
    testPasswords.forEach(password => {
      const validation = passwordUtils.validatePassword(password);
      console.log(`"${password}" -> Valid: ${validation.isValid}`);
    });
    
    // Test 2: Password History Check
    console.log('\n2. Testing Password History:');
    const mockHistory = [
      { password: await passwordUtils.hashPassword('OldPass123!'), changedAt: new Date() },
      { password: await passwordUtils.hashPassword('AnotherPass456@'), changedAt: new Date() }
    ];
    
    const historyCheck1 = passwordUtils.checkPasswordHistory('NewPass789#', mockHistory);
    const historyCheck2 = passwordUtils.checkPasswordHistory('OldPass123!', mockHistory);
    
    console.log(`New password "NewPass789#" -> Reused: ${historyCheck1.isReused}`);
    console.log(`Old password "OldPass123!" -> Reused: ${historyCheck2.isReused}`);
    
    // Test 3: Complete Flow
    console.log('\n3. Testing Complete Flow:');
    
    // Find a test user (you can modify this to use a specific user)
    const testUser = await User.findOne({});
    if (testUser) {
      console.log(`Testing with user: ${testUser.email}`);
      
      // Test password change flow
      const newPassword = 'TestSecurePass123!';
      const validation = passwordUtils.validatePassword(newPassword);
      const historyCheck = passwordUtils.checkPasswordHistory(newPassword, testUser.passwordHistory || []);
      
      console.log(`New password validation: ${validation.isValid}`);
      console.log(`Password history check: ${historyCheck.isReused ? 'Reused' : 'OK'}`);
      console.log(`Current password history count: ${testUser.passwordHistory?.length || 0}`);
      
    } else {
      console.log('No test user found in database');
    }
    
    console.log('\n✅ Change password functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

testChangePassword(); 