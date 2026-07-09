import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDonation extends Document {
  donorId: Types.ObjectId;
  type: 'goods' | 'funds';
  description: string;
  dropoffPointId?: Types.ObjectId;
  status: 'pledged' | 'collected' | 'distributed';
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    donorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['goods', 'funds'],
      required: [true, 'Donation type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    dropoffPointId: {
      type: Schema.Types.ObjectId,
      ref: 'Shelter',
    },
    status: {
      type: String,
      enum: ['pledged', 'collected', 'distributed'],
      default: 'pledged',
    },
  },
  {
    timestamps: true,
  }
);

donationSchema.index({ donorId: 1 });
donationSchema.index({ status: 1 });

export default mongoose.model<IDonation>('Donation', donationSchema);
