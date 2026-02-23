import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/authMiddleware.js';
import { uploadEventBanner, uploadPostImage } from '../config/cloudinary.js';
import {
  getOverview,
  getMyEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  getEventRegistrations,
  getAllRegistrations,
  toggleAttendance,
  exportRegistrationsCSV,
  getExportFields,
  getAnalytics,
} from '../controllers/contributorController.js';

const router = express.Router();

// All routes require authentication + contributor role
router.use(authMiddleware);
router.use(roleMiddleware(['contributor', 'admin']));

// ── Overview ────────────────────────────────────────────────
router.get('/overview', getOverview);

// ── Events CRUD ─────────────────────────────────────────────
router.get('/events', getMyEvents);
router.get('/events/:id', getEventById);
router.post('/events', uploadEventBanner.single('banner'), createEvent);
router.put('/events/:id', uploadEventBanner.single('banner'), updateEvent);
router.put('/events/:id/cancel', cancelEvent);

// ── Posts CRUD ──────────────────────────────────────────────
router.get('/posts', getMyPosts);
router.post('/posts', uploadPostImage.single('image'), createPost);
router.put('/posts/:id', uploadPostImage.single('image'), updatePost);
router.delete('/posts/:id', deletePost);

// ── Registrations & Attendance ──────────────────────────────
router.get('/registrations', getAllRegistrations);
router.get('/events/:id/registrations', getEventRegistrations);
router.put('/registrations/:id/attendance', toggleAttendance);

// ── CSV Export ──────────────────────────────────────────────
router.get('/events/:id/export-fields', getExportFields);
router.post('/events/:id/export-csv', exportRegistrationsCSV);

// ── Analytics ───────────────────────────────────────────────
router.get('/analytics', getAnalytics);

export default router;
