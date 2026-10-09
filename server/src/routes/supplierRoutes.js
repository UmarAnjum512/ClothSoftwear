import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  recordSupplierPayment
} from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', authorize('Super Admin', 'Manager'), createSupplier);
router.patch('/:id', authorize('Super Admin', 'Manager'), updateSupplier);
router.post('/:id/payment', authorize('Super Admin', 'Manager'), recordSupplierPayment);

export default router;
