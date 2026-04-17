import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  saveContent,
  unsaveContent,
  getSavedItems,
  getAllSavedIds,
  checkIfSaved,
} from '../controllers/saveController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Save content
router.post('/', saveContent);

// Unsave content
router.delete('/', unsaveContent);

// Get all saved item IDs (no limit, for initialization)
router.get('/all-ids', getAllSavedIds);

// Get all saved items with filters
router.get('/', getSavedItems);

// Check if specific content is saved
router.get('/check', checkIfSaved);

export default router;
