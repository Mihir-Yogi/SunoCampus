import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createReport, getMyReports } from '../controllers/reportController.js';

const router = express.Router();

// All report routes require authentication
router.use(authMiddleware);

// POST /api/reports — Submit a report
router.post('/', createReport);

// GET /api/reports/my — View my submitted reports
router.get('/my', getMyReports);

export default router;
