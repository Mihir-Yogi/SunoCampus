import express from 'express';
import { getAllColleges } from '../controllers/collegeController.js';

const router = express.Router();

// Public routes
router.get('/', getAllColleges);

export default router;
