import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  applyContributor,
  deactivateAccount,
} from '../controllers/profileController.js';

const router = express.Router();

// All profile routes require authentication
router.use(authMiddleware);

// GET    /api/profile              — fetch user profile
router.get('/', getProfile);

// PUT    /api/profile              — update academic/personal details
router.put('/', updateProfile);

// PUT    /api/profile/password     — change password
router.put('/password', changePassword);

// POST   /api/profile/apply-contributor — request contributor role
router.post('/apply-contributor', applyContributor);

// DELETE /api/profile              — deactivate account
router.delete('/', deactivateAccount);

export default router;
