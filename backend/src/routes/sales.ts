import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Placeholder routes - to be implemented
router.get('/', requireAuth, (req, res) => {
  res.json({ message: 'Sales endpoint - Coming soon' });
});

export default router;
