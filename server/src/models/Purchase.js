import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  qty: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
});

const purchaseSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  invoiceNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  purchaseDate: { type: Date, default: Date.now },
  items: [purchaseItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Credit / Due', 'Other'],
    default: 'Cash'
  },
  status: {
    type: String,
    enum: ['Received', 'Pending', 'Cancelled'],
    default: 'Received'
  },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Purchase = mongoose.model('Purchase', purchaseSchema);
