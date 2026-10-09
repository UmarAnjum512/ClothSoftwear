import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  type: {
    type: String,
    enum: ['Alpha', 'Numeric', 'Free Size', 'Kids'],
    default: 'Alpha'
  },
  orderIndex: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export const Size = mongoose.model('Size', sizeSchema);
