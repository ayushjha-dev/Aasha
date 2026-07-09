import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVolunteerTeam extends Document {
  name: string;
  memberIds: Types.ObjectId[];
  specialization: string;
  assignedIncidentIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const volunteerTeamSchema = new Schema<IVolunteerTeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: 100,
    },
    memberIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    specialization: {
      type: String,
      trim: true,
      default: 'general',
    },
    assignedIncidentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Incident',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVolunteerTeam>('VolunteerTeam', volunteerTeamSchema);
