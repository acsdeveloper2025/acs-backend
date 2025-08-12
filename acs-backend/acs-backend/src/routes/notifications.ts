import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Apply authentication
router.use(authenticateToken);

// Placeholder routes - will be implemented
router.post('/register', (req, res) => {
  res.json({
    success: true,
    message: 'Register for push notifications - to be implemented',
  });
});

router.post('/sync', (req, res) => {
  res.json({
    success: true,
    message: 'Background sync - to be implemented',
  });
});

export default router;
