import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  action: string;
  targetType: string;
  targetId: Types.ObjectId;
  details?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  actorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  targetType: {
    type: String,
    required: true,
    trim: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
