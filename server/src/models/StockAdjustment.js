import mongoose from 'mongoose';

const stockAdjustmentSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  adjustmentType: {
    type: String,
    enum: ['Addition', 'Deduction', 'Set Exact'],
    required: true
  },
  previousQty: { type: Number, required: true },
  adjustedQty: { type: Number, required: true },
  newQty: { type: Number, required: true },
  reason: {
    type: String,
    required: true,
    enum: ['Damage/Spoilage', 'Physical Count Discrepancy', 'Theft/Loss', 'Inventory Restock', 'Sample Given', 'Other']
  },
  notes: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const StockAdjustment = mongoose.model('StockAdjustment', stockAdjustmentSchema);
