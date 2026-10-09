import express from 'express';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getBrands, createBrand, updateBrand, deleteBrand,
  getSizes, createSize, updateSize, deleteSize,
  getColors, createColor, updateColor, deleteColor
} from '../controllers/masterDataController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Read permissions available to all logged-in staff
router.get('/categories', getCategories);
router.post('/categories', authorize('Super Admin', 'Manager', 'Store Keeper'), createCategory);
router.patch('/categories/:id', authorize('Super Admin', 'Manager', 'Store Keeper'), updateCategory);
router.delete('/categories/:id', authorize('Super Admin'), deleteCategory);

router.get('/brands', getBrands);
router.post('/brands', authorize('Super Admin', 'Manager', 'Store Keeper'), createBrand);
router.patch('/brands/:id', authorize('Super Admin', 'Manager', 'Store Keeper'), updateBrand);
router.delete('/brands/:id', authorize('Super Admin'), deleteBrand);

router.get('/sizes', getSizes);
router.post('/sizes', authorize('Super Admin', 'Manager', 'Store Keeper'), createSize);
router.patch('/sizes/:id', authorize('Super Admin', 'Manager', 'Store Keeper'), updateSize);
router.delete('/sizes/:id', authorize('Super Admin'), deleteSize);

router.get('/colors', getColors);
router.post('/colors', authorize('Super Admin', 'Manager', 'Store Keeper'), createColor);
router.patch('/colors/:id', authorize('Super Admin', 'Manager', 'Store Keeper'), updateColor);
router.delete('/colors/:id', authorize('Super Admin'), deleteColor);

export default router;
