const User = require('./models/User');
const passwordUtils = require('./utils/passwordUtils');
const mongoose = require('mongoose');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/frame-shop');

const testPasswordHistory = async () => {
  try {
    console.log('Testing Password History Functionality');
    console.log('=====================================');
    
    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('No user found in database');
      return;
    }
    
    console.log(`Testing with user: ${user.email}`);
    console.log(`Current password history count: ${user.passwordHistory?.length || 0}`);
    
    // Test 1: Check if current password is in history
    const currentPasswordCheck = passwordUtils.checkPasswordHistory('test123', user.passwordHistory || []);
    console.log('\n1. Current password check:', currentPasswordCheck);
    
    // Test 2: Simulate password change
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456@';
    
    console.log('\n2. Simulating password change:');
    console.log(`Old password: ${oldPassword}`);
    console.log(`New password: ${newPassword}`);
    
    // Hash the old password
    const hashedOldPassword = await passwordUtils.hashPassword(oldPassword);
    
    // Add old password to history
    const updatedHistory = [...(user.passwordHistory || []), {
      password: hashedOldPassword,
      changedAt: new Date()
    }];
    
    // Keep only last 5
    const finalHistory = updatedHistory.slice(-5);
    
    console.log(`History after adding old password: ${finalHistory.length} entries`);
    
    // Test 3: Try to reuse old password
    const reuseCheck = passwordUtils.checkPasswordHistory(oldPassword, finalHistory);
    console.log('\n3. Reuse check for old password:', reuseCheck);
    
    // Test 4: Try to use new password
    const newPasswordCheck = passwordUtils.checkPasswordHistory(newPassword, finalHistory);
    console.log('\n4. Check for new password:', newPasswordCheck);
    
    console.log('\n✅ Password history test completed!');
    console.log('The old password should be marked as "reused" and cannot be used again.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

testPasswordHistory(); 