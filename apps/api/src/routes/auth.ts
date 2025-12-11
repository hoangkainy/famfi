import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user?.id,
        email: req.user?.email,
        name: req.user?.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'PROFILE_ERROR', message: 'Failed to get profile' }
    });
  }
});

export default router;
