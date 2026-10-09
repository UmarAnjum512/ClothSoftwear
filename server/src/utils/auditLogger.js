import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({ req, action, entity, entityId = '', details = {} }) => {
  try {
    const userId = req?.user?._id || null;
    const userName = req?.user?.name || 'System';
    const userRole = req?.user?.role || 'System';
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '';

    await AuditLog.create({
      userId,
      userName,
      userRole,
      action,
      entity,
      entityId,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
};
