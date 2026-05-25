import mongoose, { Schema, Document } from 'mongoose';

export interface IAnonymousTracker extends Document {
  ipAddress: string;
  usedAt: Date;
  createdAt: Date;
}

const anonymousTrackerSchema = new Schema<IAnonymousTracker>({
  ipAddress: { 
    type: String, 
    required: true, 
    unique: true 
  },
  usedAt: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 432000 // Auto-delete after 5 days (matches guest link expiry)
  }
});

export const AnonymousTracker = mongoose.model<IAnonymousTracker>('AnonymousTracker', anonymousTrackerSchema);