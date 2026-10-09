import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  recordCustomerPayment
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.patch('/:id', updateCustomer);
router.post('/:id/payment', authorize('Super Admin', 'Manager', 'Cashier'), recordCustomerPayment);

export default router;
