import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, default: '' },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, default: '' },
  address: { type: String, default: '' },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export const Supplier = mongoose.model('Supplier', supplierSchema);
