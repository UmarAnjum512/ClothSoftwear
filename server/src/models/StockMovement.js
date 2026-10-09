import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  sku: { type: String, default: '' },
  productName: { type: String, default: '' },
  type: {
    type: String,
    enum: [
      'Purchase Received',
      'Purchase Return',
      'Sale',
      'Sale Return Saleable',
      'Sale Return Damaged',
      'Stock Adjustment +',
      'Stock Adjustment -'
    ],
    required: true
  },
  qtyChange: { type: Number, required: true }, // positive or negative
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  referenceType: {
    type: String,
    enum: ['Purchase', 'Sale', 'Sale Return', 'Purchase Return', 'Manual Adjustment'],
    default: 'Manual Adjustment'
  },
  referenceId: { type: String, default: '' },
  notes: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: 'System' }
}, { timestamps: true });

stockMovementSchema.index({ variantId: 1 });
stockMovementSchema.index({ createdAt: -1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
