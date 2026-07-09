import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'citizen' | 'volunteer' | 'admin';
  location: {
    lat: number;
    lng: number;
  };
  languagePreference: 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'pa' | 'ml' | 'kn' | 'or' | 'as' | 'es';
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ['citizen', 'volunteer', 'admin'],
      default: 'citizen',
    },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    languagePreference: {
      type: String,
      enum: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'ml', 'kn', 'or', 'as', 'es'],
      default: 'en',
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial-like queries (basic lat/lng filtering)
userSchema.index({ 'location.lat': 1, 'location.lng': 1 });
userSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', userSchema);
