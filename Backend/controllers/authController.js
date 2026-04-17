import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import generateOTP from '../utils/generateOTP.js';
import sendOTPEmail from '../utils/emailService.js';
import {
  validateCollegeEmail,
  validatePasswordStrength,
  validateEmailFormat,
  getCollegeFromEmail,
} from '../utils/validators.js';
import generateJWT from '../utils/tokenGenerator.js';

// Step 1: Send OTP to email for registration
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || !validateEmailFormat(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already registered with this email' });
    }

    // Validate college email domain
    const isValidCollege = await validateCollegeEmail(email);
    if (!isValidCollege) {
      return res.status(400).json({ error: 'Email domain not recognized. Please use your college email.' });
    }

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Generate and save OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otp = new OTP({
      email,
      otp: otpCode,
      expiresAt,
    });

    await otp.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otpCode);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.json({
      success: true,
      message: 'OTP sent to email successfully',
      email,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Server error while sending OTP' });
  }
};

// Step 2: Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP expired or not found' });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Check attempt limit
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'Maximum attempts exceeded. Request new OTP' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        error: 'Invalid OTP',
        attemptsRemaining: 3 - otpRecord.attempts,
      });
    }

    // OTP verified successfully
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      email,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error while verifying OTP' });
  }
};

// Step 3: Create account during registration
export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      fullName,
      phone,
      dateOfBirth,
      gender,
      college,
      studentId,
      branch,
      currentYear,
      graduationYear,
    } = req.body;

    // Validate inputs
    if (!email || !password || !confirmPassword || !fullName) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (!college) {
      return res.status(400).json({ error: 'College selection is required' });
    }

    if (!studentId || !/^\d{11}$/.test(studentId)) {
      return res.status(400).json({ error: 'Enrollment number must be exactly 11 digits' });
    }

    if (!branch) {
      return res.status(400).json({ error: 'Branch selection is required' });
    }

    if (!currentYear || currentYear < 1 || currentYear > 4) {
      return res.status(400).json({ error: 'Current year must be between 1 and 4' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if student ID already exists for this college
    const duplicateRegistration = await User.findOne({
      college: college,
      studentId: studentId,
    });
    if (duplicateRegistration) {
      return res.status(400).json({ 
        error: `This enrollment number is already registered with the selected college` 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      fullName,
      phone,
      dateOfBirth,
      gender,
      college: college,
      studentId,
      branch,
      currentYear,
      graduationYear,
      isVerified: true, // Email already verified via OTP
      role: 'student',
    });

    await user.save();

    // Generate JWT
    const token = generateJWT(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle mongoose unique constraint error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'email') {
        return res.status(400).json({ error: 'Email already registered' });
      } else if (field === 'studentId') {
        return res.status(400).json({ error: 'Enrollment number already registered for this college' });
      }
    }
    
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login with email and password
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email (include password field which is normally excluded)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked by an administrator' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_key_change_in_production',
      { expiresIn }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Google Login
export const googleLogin = async (req, res) => {
  try {
    const { email, displayName, photoURL, googleId } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ error: 'Email and name required from Google' });
    }

    // Validate college email
    const isValidCollege = await validateCollegeEmail(email);
    if (!isValidCollege) {
      return res.status(400).json({ error: 'Please use your college email for registration' });
    }

    // Get college
    const college = await getCollegeFromEmail(email);
    if (!college) {
      return res.status(400).json({ error: 'College not found for this email domain' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        email,
        fullName: displayName,
        googleId,
        avatar: photoURL,
        college: college._id,
        isVerified: true,
        role: 'student',
      });

      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      if (photoURL) user.avatar = photoURL;
      await user.save();
    }

    // Generate JWT
    const token = generateJWT(user._id, user.role);

    res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Server error during Google login' });
  }
};

// Check if enrollment number is already registered for a college
export const checkEnrollment = async (req, res) => {
  try {
    const { college, studentId } = req.body;

    if (!college || !studentId) {
      return res.status(400).json({ error: 'College and enrollment number are required' });
    }

    if (!/^\d{11}$/.test(studentId)) {
      return res.status(400).json({ error: 'Enrollment number must be exactly 11 digits' });
    }

    const existingUser = await User.findOne({ college, studentId });

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? 'This enrollment number is already registered with the selected college'
        : 'Enrollment number is available',
    });
  } catch (error) {
    console.error('Check enrollment error:', error);
    res.status(500).json({ error: 'Server error checking enrollment' });
  }
};

// ─── Forgot Password: Step 1 — Send OTP ─────────────────────
export const forgotPasswordSendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmailFormat(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated' });
    }

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Generate and save OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await new OTP({ email, otp: otpCode, expiresAt }).save();

    // Send email
    const { sendPasswordResetOTPEmail } = await import('../utils/emailService.js');
    const emailSent = await sendPasswordResetOTPEmail(email, otpCode, user.fullName);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      email,
    });
  } catch (error) {
    console.error('Forgot password send OTP error:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
};

// ─── Forgot Password: Step 2 — Verify OTP ────────────────────
export const forgotPasswordVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }

    // Check max attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteMany({ email });
      return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 3 - otpRecord.attempts;
      return res.status(400).json({
        error: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // OTP is valid — generate a short-lived reset token
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET || 'your_super_secret_key_change_in_production',
      { expiresIn: '15m' }
    );

    // Clean up OTP
    await OTP.deleteMany({ email });

    res.json({
      success: true,
      message: 'Email verified successfully',
      resetToken,
    });
  } catch (error) {
    console.error('Forgot password verify OTP error:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
};

// ─── Forgot Password: Step 3 — Reset Password ────────────────
export const forgotPasswordReset = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET || 'your_super_secret_key_change_in_production'
      );
    } catch (err) {
      return res.status(401).json({ error: 'Reset link has expired. Please start over.' });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(401).json({ error: 'Invalid reset token' });
    }

    // Find user and update password
    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Forgot password reset error:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
};

export default { sendOTP, verifyOTP, register, login, googleLogin, checkEnrollment, forgotPasswordSendOTP, forgotPasswordVerifyOTP, forgotPasswordReset };
