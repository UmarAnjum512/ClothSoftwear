import express from 'express';
import { getDashboardSummary, getProfitLossReport, getTrendReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardSummary);
router.get('/profit-loss', authorize('Super Admin', 'Manager'), getProfitLossReport);
router.get('/trend', authorize('Super Admin', 'Manager'), getTrendReport);

export default router;
