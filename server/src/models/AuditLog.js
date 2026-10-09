import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: 'System' },
  userRole: { type: String, default: '' },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
