import express from 'express';
import {
  createSale,
  getSales,
  getSaleById,
  voidSale
} from '../controllers/saleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.post('/:id/void', authorize('Super Admin', 'Manager'), voidSale);

export default router;
