import mongoose, { Schema } from "mongoose";
import { ILinkDocument } from "@/interfaces/link";

const linkSchema = new Schema<ILinkDocument>(
  {
    destination: {
      type: String,
      required: [true, 'Destination URL is required'],
      trim: true,
    },
    backHalf: {
      type: String,
      required: [true, 'Back-half is required'],
      unique: true, 
      trim: true,
    },
    shortLink: {
      type: String,
      required: [true, 'Short link URL is required'],
      unique: true,
      trim: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Link must belong to a creator'],
    },
    totalVisitCount: {
      type: Number,
      default: 0,
    },
  },
  { 
    timestamps: true
  }
);

linkSchema.index({ creator: 1, createdAt: -1 });

export const Link = mongoose.model<ILinkDocument>('Link', linkSchema);
