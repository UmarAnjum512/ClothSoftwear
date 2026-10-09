import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  barcode: { type: String, required: true, unique: true, trim: true },
  sizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },
  colorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Color', required: true },
  costPrice: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 5 },
  status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

productVariantSchema.index({ productId: 1 });

export const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
