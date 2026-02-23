import express from 'express';
import {
  sendOTP,
  verifyOTP,
  register,
  login,
  googleLogin,
  checkEnrollment,
  forgotPasswordSendOTP,
  forgotPasswordVerifyOTP,
  forgotPasswordReset,
} from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/check-enrollment', checkEnrollment);

// Forgot password routes
router.post('/forgot-password/send-otp', forgotPasswordSendOTP);
router.post('/forgot-password/verify-otp', forgotPasswordVerifyOTP);
router.post('/forgot-password/reset', forgotPasswordReset);

// Protected routes (future use)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

export default router;
