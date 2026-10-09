import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  hexCode: { type: String, default: '#000000' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export const Color = mongoose.model('Color', colorSchema);
