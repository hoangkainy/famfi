import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { getUserFamily } from '../services/family';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '../services/category';

const router = Router();

// Get all categories for user's family
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

    const { type } = req.query;
    const categories = await getCategories(family.id, type as 'INCOME' | 'EXPENSE');
    res.json({ success: true, data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get categories';
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message } });
  }
});

// Create new category
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

    const { name, icon, type } = req.body;

    if (!name || !type) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Name and type are required' }
      });
      return;
    }

    const category = await createCategory({
      familyId: family.id,
      name,
      icon,
      type
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create category';
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message } });
  }
});

// Get single category
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = await getCategory(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' }
      });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get category';
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message } });
  }
});

// Update category
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, icon } = req.body;

    const category = await updateCategory(req.params.id, { name, icon });
    res.json({ success: true, data: category });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update category';
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message } });
  }
});

// Delete category
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    res.status(500).json({ success: false, error: { code: 'DELETE_ERROR', message } });
  }
});

export default router;
