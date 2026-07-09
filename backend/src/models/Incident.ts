import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIncident extends Document {
  reporterId: Types.ObjectId;
  category: 'medical' | 'fire' | 'flood' | 'trapped' | 'other';
  description: string;
  severity: number; // 1-5
  status: 'reported' | 'acknowledged' | 'assigned' | 'resolved';
  location: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  assignedVolunteerIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['medical', 'fire', 'flood', 'trapped', 'other'],
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    severity: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 3,
    },
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'assigned', 'resolved'],
      default: 'reported',
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    photoUrl: {
      type: String,
      default: '',
    },
    assignedVolunteerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: -1 });
incidentSchema.index({ 'location.lat': 1, 'location.lng': 1 });
incidentSchema.index({ reporterId: 1 });

export default mongoose.model<IIncident>('Incident', incidentSchema);
