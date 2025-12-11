import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import {
  createFamily,
  joinFamily,
  getUserFamily,
  getFamilyMembers,
  refreshInviteCode
} from '../services/family';

const router = Router();

// Get current user's family
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const family = await getUserFamily(req.user!.id);

    if (!family) {
      res.json({ success: true, data: null });
      return;
    }

    res.json({ success: true, data: family });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get family';
    res.status(500).json({ success: false, error: { code: 'FAMILY_ERROR', message } });
  }
});

// Create new family
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Family name is required' }
      });
      return;
    }

    // Check if user already has a family
    const existingFamily = await getUserFamily(req.user!.id);
    if (existingFamily) {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_HAS_FAMILY', message: 'You already belong to a family' }
      });
      return;
    }

    const family = await createFamily({ name, userId: req.user!.id });
    res.status(201).json({ success: true, data: family });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create family';
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message } });
  }
});

// Join family via invite code
router.post('/join', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || typeof inviteCode !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invite code is required' }
      });
      return;
    }

    // Check if user already has a family
    const existingFamily = await getUserFamily(req.user!.id);
    if (existingFamily) {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_HAS_FAMILY', message: 'You already belong to a family' }
      });
      return;
    }

    const family = await joinFamily({ inviteCode, userId: req.user!.id });
    res.json({ success: true, data: family });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join family';
    res.status(400).json({ success: false, error: { code: 'JOIN_ERROR', message } });
  }
});

// Get family members
router.get('/:familyId/members', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { familyId } = req.params;
    const members = await getFamilyMembers(familyId);
    res.json({ success: true, data: members });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get members';
    res.status(500).json({ success: false, error: { code: 'MEMBERS_ERROR', message } });
  }
});

// Refresh invite code
router.post('/:familyId/refresh-code', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { familyId } = req.params;
    const newCode = await refreshInviteCode(familyId, req.user!.id);
    res.json({ success: true, data: { inviteCode: newCode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to refresh code';
    res.status(400).json({ success: false, error: { code: 'REFRESH_ERROR', message } });
  }
});

export default router;
