import express from 'express';
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  createPurchaseReturn
} from '../controllers/purchaseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('Super Admin', 'Manager', 'Store Keeper'), getPurchases);
router.get('/:id', authorize('Super Admin', 'Manager', 'Store Keeper'), getPurchaseById);
router.post('/', authorize('Super Admin', 'Manager', 'Store Keeper'), createPurchase);
router.post('/return', authorize('Super Admin', 'Manager', 'Store Keeper'), createPurchaseReturn);

export default router;
