import mongoose, { Schema, Document } from 'mongoose';

export interface IShelter extends Document {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  totalCapacity: number;
  currentOccupancy: number;
  status: 'operational' | 'full' | 'closed';
  contactInfo: string;
  resourcesAvailable: string[];
  createdAt: Date;
  updatedAt: Date;
}

const shelterSchema = new Schema<IShelter>(
  {
    name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
      maxlength: 200,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 0,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['operational', 'full', 'closed'],
      default: 'operational',
    },
    contactInfo: {
      type: String,
      trim: true,
      default: '',
    },
    resourcesAvailable: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

shelterSchema.index({ status: 1 });
shelterSchema.index({ 'location.lat': 1, 'location.lng': 1 });

export default mongoose.model<IShelter>('Shelter', shelterSchema);
