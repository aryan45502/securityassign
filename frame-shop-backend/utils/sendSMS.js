// Secure SMS delivery with Twilio integration and fallback simulation
const twilio = require('twilio');

// Initialize Twilio client with error handling
let twilioClient = null;
let twilioEnabled = false;

try {
  // Check if Twilio credentials are properly configured
  if (process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN && 
      process.env.TWILIO_PHONE_NUMBER &&
      process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    twilioEnabled = true;
    console.log('✅ Twilio SMS service enabled');
  } else {
    console.log('⚠️ Twilio credentials not properly configured, SMS will be simulated');
  }
} catch (error) {
  console.log('⚠️ Twilio initialization failed, SMS will be simulated:', error.message);
}

const sendSMS = async (to, message) => {
  try {
    if (twilioEnabled && twilioClient) {
      // Send real SMS via Twilio
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
      
      console.log('📱 SMS sent successfully:', result.sid);
      return { success: true, sid: result.sid };
    } else {
      // Simulate SMS sending for development/testing
      console.log('📱 [SIMULATED] SMS would be sent to:', to);
      console.log('📱 [SIMULATED] Message:', message);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { 
        success: true, 
        simulated: true,
        message: 'SMS simulated (Twilio not configured)'
      };
    }
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
    
    // Fallback to simulation if Twilio fails
    console.log('📱 [FALLBACK] SMS simulated due to error');
    return { 
      success: true, 
      simulated: true,
      error: error.message,
      message: 'SMS simulated due to service error'
    };
  }
};

const sendOTP = async (phoneNumber, otp) => {
  const message = `Welcome to MediConnect! Your verification code is: ${otp}. This code expires in 10 minutes.`;
  return await sendSMS(phoneNumber, message);
};

module.exports = {
  sendSMS,
  sendOTP,
  twilioEnabled
};
