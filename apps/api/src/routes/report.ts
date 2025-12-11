import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { getUserFamily } from '../services/family';
import { getCategoryBreakdown, getMonthlyTrend } from '../services/report';

const router = Router();

// Get category breakdown for pie chart
router.get('/category-breakdown', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const family = await getUserFamily(req.user!.id);
    if (!family) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FAMILY', message: 'User does not belong to a family' }
      });
      return;
    }

    const { month } = req.query;
    const breakdown = await getCategoryBreakdown(family.id, month as string);
    res.json({ success: true, data: breakdown });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get breakdown';
    res.status(500).json({ success: false, error: { code: 'REPORT_ERROR', message } });
  }
});

// Get monthly trend for bar chart
router.get('/monthly-trend', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const family = await getUserFamily(req.user!.id);
    if (!family) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FAMILY', message: 'User does not belong to a family' }
      });
      return;
    }

    const { months } = req.query;
    const trend = await getMonthlyTrend(family.id, months ? parseInt(months as string) : 6);
    res.json({ success: true, data: trend });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get trend';
    res.status(500).json({ success: false, error: { code: 'REPORT_ERROR', message } });
  }
});

export default router;
