const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendSMS } = require("../utils/sendSMS");

exports.register = async (req, res) => {
  let { name, email, password, phone } = req.body;
  try {
    // Normalize email to lowercase
    email = email.trim().toLowerCase();

    // Check if user exists by email
    const userExistsByEmail = await User.findOne({ email });
    console.log("DEBUG: userExistsByEmail", userExistsByEmail);
    if (userExistsByEmail && userExistsByEmail.isVerified) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    if (userExistsByEmail && !userExistsByEmail.isVerified) {
      // Delete unverified user to allow re-registration
      await User.deleteOne({ email });
    }

    // Check if user exists by phone
    const userExistsByPhone = await User.findOne({ phone });
    if (userExistsByPhone && userExistsByPhone.isVerified) {
      return res.status(400).json({ message: "User with this phone number already exists" });
    }
    if (userExistsByPhone && !userExistsByPhone.isVerified) {
      // Delete unverified user to allow re-registration
      await User.deleteOne({ phone });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with OTP (normalize email to lowercase)
    const newUser = await User.create({
      name,
      email, // already lowercased
      phone,
      password: hashedPassword,
      otp,
      otpExpires,
      isVerified: false
    });

    // Send OTP via SMS
    try {
      await sendSMS(phone, `Your verification code is: ${otp}`);
    } catch (smsError) {
      console.error("SMS sending failed:", smsError);
      // Don't fail registration if SMS fails, just log it
    }

    res.status(201).json({
      message: "Registration successful. Please verify your phone number with the OTP sent to your WhatsApp.",
      phone: phone
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Phone number verified successfully. You can now login.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Account not verified. Please verify your phone number first.",
        needsVerification: true,
        phone: user.phone
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone,
        role: user.role 
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
