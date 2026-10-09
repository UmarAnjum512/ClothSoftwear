import mongoose from 'mongoose';

const cashRegisterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shiftNumber: { type: String, required: true },
  openingCash: { type: Number, required: true, default: 0 },
  actualCash: { type: Number, default: 0 },
  expectedCash: { type: Number, default: 0 },
  difference: { type: Number, default: 0 },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  notes: { type: String, default: '' }
}, { timestamps: true });

export const CashRegister = mongoose.model('CashRegister', cashRegisterSchema);
