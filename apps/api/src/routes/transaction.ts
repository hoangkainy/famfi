import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { getUserFamily } from '../services/family';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary
} from '../services/transaction';
import { parseQuickInput } from '../lib/quickInput';

const router = Router();

// Get transactions for user's family
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const family = await getUserFamily(req.user!.id);
    if (!family) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FAMILY', message: 'User does not belong to a family' }
      });
      return;
    }

    const { startDate, endDate, type, categoryId, limit, offset } = req.query;

    const transactions = await getTransactions({
      familyId: family.id,
      startDate: startDate as string,
      endDate: endDate as string,
      type: type as 'INCOME' | 'EXPENSE',
      categoryId: categoryId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get transactions';
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message } });
  }
});

// Get transaction summary
router.get('/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
    const summary = await getTransactionSummary(family.id, month as string);
    res.json({ success: true, data: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get summary';
    res.status(500).json({ success: false, error: { code: 'SUMMARY_ERROR', message } });
  }
});

// Create transaction
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const family = await getUserFamily(req.user!.id);
    if (!family) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FAMILY', message: 'User does not belong to a family' }
      });
      return;
    }

    const { amount, note, type, categoryId, transactionDate } = req.body;

    if (!amount || !type) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Amount and type are required' }
      });
      return;
    }

    const transaction = await createTransaction({
      familyId: family.id,
      createdBy: req.user!.id,
      amount: parseFloat(amount),
      note,
      type,
      categoryId,
      transactionDate
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create transaction';
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message } });
  }
});

// Quick input endpoint
router.post('/quick', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const family = await getUserFamily(req.user!.id);
    if (!family) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FAMILY', message: 'User does not belong to a family' }
      });
      return;
    }

    const { input, type } = req.body;

    if (!input) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Input is required' }
      });
      return;
    }

    const parsed = parseQuickInput(input);

    if (!parsed) {
      res.status(400).json({
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Could not parse input. Try: "breakfast 50k" or "50000 lunch"' }
      });
      return;
    }

    const transaction = await createTransaction({
      familyId: family.id,
      createdBy: req.user!.id,
      amount: parsed.amount,
      note: parsed.note,
      type: type || 'EXPENSE'
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create transaction';
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message } });
  }
});

// Get single transaction
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transaction = await getTransaction(req.params.id);

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transaction not found' }
      });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get transaction';
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message } });
  }
});

// Update transaction
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, note, type, categoryId, transactionDate } = req.body;

    const transaction = await updateTransaction(req.params.id, {
      amount: amount ? parseFloat(amount) : undefined,
      note,
      type,
      categoryId,
      transactionDate
    });

    res.json({ success: true, data: transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update transaction';
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message } });
  }
});

// Delete transaction
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteTransaction(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete transaction';
    res.status(500).json({ success: false, error: { code: 'DELETE_ERROR', message } });
  }
});

export default router;
