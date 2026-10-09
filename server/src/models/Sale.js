import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  productName: { type: String, required: true },
  image: { type: String, default: '' },
  sizeName: { type: String, default: '' },
  colorName: { type: String, default: '' },
  sku: { type: String, default: '' },
  barcode: { type: String, default: '' },
  qty: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 }
});

const paymentDetailSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer', 'Easypaisa', 'JazzCash'],
    required: true
  },
  amount: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String, default: '' },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashRegister' },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  discountTotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, required: true, default: 0 },
  dueAmount: { type: Number, default: 0 },
  changeAmount: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer', 'Easypaisa', 'JazzCash', 'Split'],
    default: 'Cash'
  },
  payments: [paymentDetailSchema],
  status: {
    type: String,
    enum: ['Completed', 'Returned', 'Partial Returned', 'Void'],
    default: 'Completed'
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

saleSchema.index({ createdAt: -1 });

export const Sale = mongoose.model('Sale', saleSchema);
