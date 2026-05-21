import mongoose, { Schema, Document, Types } from 'mongoose';
import { IClickLogDocument } from '@/interfaces/click-log';

const clickLogSchema = new Schema<IClickLogDocument>(
  {
    linkId: {
      type: Schema.Types.ObjectId,
      ref: 'Link',
      required: [true, 'Click log must be linked to a shortened URL'],
    },
    clickedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    referer: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  { 
    timestamps: false // We use clickedAt explicitly instead
  }
);

clickLogSchema.index({ linkId: 1, clickedAt: -1 });

export const ClickLog = mongoose.model<IClickLogDocument>('ClickLog', clickLogSchema);