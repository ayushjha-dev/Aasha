import AuditLog from '../models/AuditLog';
import { Types } from 'mongoose';

/**
 * Logs an action to the audit trail.
 */
const logAudit = async (
  actorId: string | Types.ObjectId,
  action: string,
  targetType: string,
  targetId: string | Types.ObjectId,
  details?: string
): Promise<void> => {
  try {
    await AuditLog.create({
      actorId: new Types.ObjectId(actorId.toString()),
      action,
      targetType,
      targetId: new Types.ObjectId(targetId.toString()),
      details: details || '',
    });
  } catch (error) {
    // Audit logging should never crash the main operation
    console.error('Audit log write failed:', error);
  }
};

export default logAudit;
