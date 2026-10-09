import express from 'express';
import {
  getCurrentRegister,
  openRegister,
  closeRegister,
  getRegisterHistory
} from '../controllers/cashRegisterController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/current', getCurrentRegister);
router.post('/open', openRegister);
router.post('/close', closeRegister);
router.get('/history', authorize('Super Admin', 'Manager', 'Cashier'), getRegisterHistory);

export default router;
