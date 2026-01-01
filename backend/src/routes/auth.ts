import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  getCurrentUser,
  updateCurrentUserProfile,
  changeCurrentUserPassword,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  reactivateUser,
} from '../controllers/authController';
import { requireAuth, requireAdminAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);

// Protected routes (require authentication)
router.get('/me', requireAuth, getCurrentUser);
router.put('/me/profile', requireAuth, updateCurrentUserProfile);
router.put('/me/password', requireAuth, changeCurrentUserPassword);

// Admin only routes
router.post('/users', requireAdminAuth, createUser);
router.get('/users', requireAdminAuth, getAllUsers);
router.get('/users/:id', requireAdminAuth, getUserById);
router.put('/users/:id', requireAdminAuth, updateUser);
router.put('/users/:id/deactivate', requireAdminAuth, deactivateUser);
router.put('/users/:id/reactivate', requireAdminAuth, reactivateUser);

export default router;
