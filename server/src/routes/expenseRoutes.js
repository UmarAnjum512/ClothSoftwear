import express from 'express';
import {
  getExpenses,
  createExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('Super Admin', 'Manager'), getExpenses);
router.post('/', authorize('Super Admin', 'Manager', 'Cashier'), createExpense);
router.delete('/:id', authorize('Super Admin', 'Manager'), deleteExpense);

export default router;
