import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getFeed,
  getPost,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
  getEvent,
  registerForEvent,
  getRegistrationStatus,
  getPublicProfile,
  getUserPosts,
  getUserEvents,
  getMyRegistrations,
  cancelRegistration,
} from '../controllers/browseController.js';

const router = express.Router();

// All browse routes require authentication
router.use(authMiddleware);

// Feed
router.get('/feed', getFeed);

// Posts
router.get('/posts/:id', getPost);
router.post('/posts/:id/like', toggleLike);
router.get('/posts/:id/comments', getComments);
router.post('/posts/:id/comments', addComment);
router.delete('/comments/:commentId', deleteComment);

// Events
router.get('/events/:id', getEvent);
router.post('/events/:id/register', registerForEvent);
router.get('/events/:id/registration-status', getRegistrationStatus);

// My Registrations
router.get('/my-registrations', getMyRegistrations);
router.delete('/registrations/:id', cancelRegistration);

// Public user profile
router.get('/users/:id', getPublicProfile);
router.get('/users/:id/posts', getUserPosts);
router.get('/users/:id/events', getUserEvents);

export default router;
