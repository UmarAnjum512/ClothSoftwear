import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Super Admin', 'Manager', 'Cashier', 'Store Keeper']
  },
  description: { type: String, default: '' },
  permissions: [{ type: String }]
}, { timestamps: true });

export const Role = mongoose.model('Role', roleSchema);
