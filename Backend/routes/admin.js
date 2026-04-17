import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
  blockUser,
  unblockUser,
  blockPost,
  unblockPost,
  deletePost,
  blockEvent,
  unblockEvent,
  deleteEvent,
  getContributorApplications,
  approveContributor,
  rejectContributor,
  revokeContributor,
  expireContributor,
  addCollege,
  updateCollege,
  deleteCollege,
  getCollegesWithStats,
  searchEnrollments,
  getRecentRegistrations,
  getOTPStats,
} from '../controllers/adminController.js';
import {
  getReports,
  getReportStats,
  getReportById,
  reviewReport,
  resolveReport,
  dismissReport,
} from '../controllers/reportController.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// ===== Overview =====
router.get('/stats', getDashboardStats);

// ===== User Management =====
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', changeUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/unblock', unblockUser);
router.delete('/users/:id', deleteUser);

// ===== Content Moderation =====
router.put('/posts/:id/block', blockPost);
router.put('/posts/:id/unblock', unblockPost);
router.delete('/posts/:id', deletePost);
router.put('/events/:id/block', blockEvent);
router.put('/events/:id/unblock', unblockEvent);
router.delete('/events/:id', deleteEvent);

// ===== Contributor Verification =====
router.get('/contributors', getContributorApplications);
router.put('/contributors/:id/approve', approveContributor);
router.put('/contributors/:id/reject', rejectContributor);
router.put('/contributors/:id/revoke', revokeContributor);
router.put('/contributors/:id/expire', expireContributor);

// ===== College Management =====
router.get('/colleges', getCollegesWithStats);
router.post('/colleges', addCollege);
router.put('/colleges/:id', updateCollege);
router.delete('/colleges/:id', deleteCollege);

// ===== Enrollment Monitor =====
router.get('/enrollments', searchEnrollments);

// ===== Reports (Moderation) =====
router.get('/reports', getReports);
router.get('/reports/stats', getReportStats);
router.get('/reports/:id', getReportById);
router.put('/reports/:id/review', reviewReport);
router.put('/reports/:id/resolve', resolveReport);
router.put('/reports/:id/dismiss', dismissReport);

// ===== Legacy Stats =====
router.get('/stats/registrations', getRecentRegistrations);
router.get('/stats/otp', getOTPStats);

export default router;
