import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  id: string;
  email: string;
  passwordHash: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'USER' | 'ADMIN' | 'SAFETY_OPERATOR';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  email_verified: boolean;
  timezone: string;
  verification_code?: string;
  verification_expires_at?: Date;
  created_at: string;
  updated_at: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
    },

    avatar_url: {
      type: String,
    },

    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'SAFETY_OPERATOR'],
      default: 'USER',
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
      default: 'ACTIVE',
    },

    email_verified: {
      type: Boolean,
      default: false,
    },

    timezone: {
      type: String,
      default: 'America/New_York',
    },

    verification_code: {
      type: String,
    },

    verification_expires_at: {
      type: Date,
    },

    created_at: {
      type: String,
      required: true,
    },

    updated_at: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'users',
  }
);

export const UserModel: Model<IUserDocument> =
  mongoose.models.NexGuardUser ||
  mongoose.model<IUserDocument>('NexGuardUser', UserSchema);