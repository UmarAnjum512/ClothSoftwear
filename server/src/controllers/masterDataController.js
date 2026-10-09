import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Size } from '../models/Size.js';
import { Color } from '../models/Color.js';

// Categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Brands
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.json({ success: true, count: brands.length, brands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createBrand = async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ success: true, brand });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, brand });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Brand deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sizes
export const getSizes = async (req, res) => {
  try {
    const sizes = await Size.find().sort({ orderIndex: 1, name: 1 });
    res.json({ success: true, count: sizes.length, sizes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSize = async (req, res) => {
  try {
    const size = await Size.create(req.body);
    res.status(201).json({ success: true, size });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateSize = async (req, res) => {
  try {
    const size = await Size.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, size });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteSize = async (req, res) => {
  try {
    await Size.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Size deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Colors
export const getColors = async (req, res) => {
  try {
    const colors = await Color.find().sort({ name: 1 });
    res.json({ success: true, count: colors.length, colors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createColor = async (req, res) => {
  try {
    const color = await Color.create(req.body);
    res.status(201).json({ success: true, color });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateColor = async (req, res) => {
  try {
    const color = await Color.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, color });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteColor = async (req, res) => {
  try {
    await Color.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Color deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
