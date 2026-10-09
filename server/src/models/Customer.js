import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, default: '' },
  address: { type: String, default: '' },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 }, // Positive = customer owes money (due)
  points: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

customerSchema.index({ name: 'text' });

export const Customer = mongoose.model('Customer', customerSchema);
