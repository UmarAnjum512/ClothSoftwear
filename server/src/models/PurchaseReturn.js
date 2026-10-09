import mongoose from 'mongoose';

const purchaseReturnItemSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  qty: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
});

const purchaseReturnSchema = new mongoose.Schema({
  purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  returnDate: { type: Date, default: Date.now },
  items: [purchaseReturnItemSchema],
  totalAmount: { type: Number, required: true },
  reason: { type: String, default: 'Defective / Excess Stock' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
