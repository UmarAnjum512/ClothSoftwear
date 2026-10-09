import express from 'express';
import {
  processSaleReturnOrExchange,
  getSaleReturns
} from '../controllers/saleReturnController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSaleReturns);
router.post('/', authorize('Super Admin', 'Manager', 'Cashier'), processSaleReturnOrExchange);

export default router;
