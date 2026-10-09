import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, default: '' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  description: { type: String, default: '' },
  images: [{ type: String }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

productSchema.index({ name: 'text', code: 'text' });

export const Product = mongoose.model('Product', productSchema);
