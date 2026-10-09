import express from 'express';
import {
  getInventoryList,
  adjustStockManually,
  getStockMovements
} from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getInventoryList);
router.post('/adjust', authorize('Super Admin', 'Manager', 'Store Keeper'), adjustStockManually);
router.get('/movements', getStockMovements);

export default router;
