import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: [
      'Shop Rent',
      'Electricity & Utility',
      'Staff Salaries',
      'Maintenance & Repair',
      'Packaging & Bags',
      'Tea & Refreshments',
      'Marketing & Ads',
      'Transportation / Fuel',
      'Internet / Software',
      'Miscellaneous'
    ],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Easypaisa', 'JazzCash'],
    default: 'Cash'
  },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

expenseSchema.index({ date: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
