import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  archiveProduct,
  addVariant,
  updateVariant,
  searchVariantByCodeOrSku,
  uploadProductImageHandler
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadProductImage } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

// Image upload (must be before /:id routes)
router.post('/upload-image', authorize('Super Admin', 'Manager', 'Store Keeper'), uploadProductImage.single('image'), uploadProductImageHandler);

router.get('/search/:query', searchVariantByCodeOrSku); // POS quick barcode scanner
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('Super Admin', 'Manager', 'Store Keeper'), createProduct);
router.patch('/:id', authorize('Super Admin', 'Manager', 'Store Keeper'), updateProduct);
router.patch('/:id/archive', authorize('Super Admin', 'Manager'), archiveProduct);

// Variant endpoints
router.post('/variants', authorize('Super Admin', 'Manager', 'Store Keeper'), addVariant);
router.patch('/variants/:id', authorize('Super Admin', 'Manager', 'Store Keeper'), updateVariant);

export default router;
