import { Router } from 'express';
import { authenticateToken, requireFieldOrHigher } from '@/middleware/auth';

const router = Router();

// Apply authentication
router.use(authenticateToken);
router.use(requireFieldOrHigher);

// Placeholder routes - will be implemented
router.post('/residence-verification', (req, res) => {
  res.json({
    success: true,
    message: 'Submit residence verification form - to be implemented',
  });
});

router.post('/office-verification', (req, res) => {
  res.json({
    success: true,
    message: 'Submit office verification form - to be implemented',
  });
});

router.post('/auto-save', (req, res) => {
  res.json({
    success: true,
    message: 'Auto-save form - to be implemented',
  });
});

router.get('/auto-save/:caseId', (req, res) => {
  res.json({
    success: true,
    message: 'Retrieve saved forms - to be implemented',
    data: [],
  });
});

export default router;
