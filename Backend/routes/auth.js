import express from 'express';
import {
  sendOTP,
  verifyOTP,
  register,
  login,
  googleLogin,
} from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);

// Protected routes (future use)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

export default router;
