import mongoose, { Schema, Document } from 'mongoose';

export interface IGuestLink extends Document {
  destination: string;
  backHalf: string;
  shortLink: string;
  createdAt: Date;
}

const guestLinkSchema = new Schema<IGuestLink>({
  destination: { 
    type: String, 
    required: true 
  },
  backHalf: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  shortLink: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 432000 // Auto-delete after 5 days (5 * 24 * 60 * 60 seconds)
  }
});

export const GuestLink = mongoose.model<IGuestLink>('GuestLink', guestLinkSchema);