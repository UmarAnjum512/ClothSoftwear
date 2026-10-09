import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  productName: { type: String, required: true },
  image: { type: String, default: '' },
  sizeName: { type: String, default: '' },
  colorName: { type: String, default: '' },
  qty: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  refundAmount: { type: Number, required: true },
  disposition: {
    type: String,
    enum: ['saleable', 'damaged'],
    default: 'saleable'
  },
  reason: { type: String, default: 'Size/Fit Issue' }
});

const exchangeItemSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  productName: { type: String, required: true },
  image: { type: String, default: '' },
  sizeName: { type: String, default: '' },
  colorName: { type: String, default: '' },
  qty: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true }
});

const saleReturnSchema = new mongoose.Schema({
  returnNo: { type: String, required: true, unique: true, uppercase: true },
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  invoiceNo: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  returnType: {
    type: String,
    enum: ['Refund', 'Exchange'],
    default: 'Refund'
  },
  returnedItems: [returnItemSchema],
  exchangeItems: [exchangeItemSchema],
  totalReturnAmount: { type: Number, required: true },
  totalExchangeAmount: { type: Number, default: 0 },
  netDifference: { type: Number, default: 0 }, // If exchange > return, customer pays. If exchange < return, store refunds.
  refundMethod: {
    type: String,
    enum: ['Cash', 'Credit Adjustment', 'Store Voucher', 'Original Payment Method'],
    default: 'Cash'
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

export const SaleReturn = mongoose.model('SaleReturn', saleReturnSchema);
