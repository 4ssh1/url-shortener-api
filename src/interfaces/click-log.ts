import { Document, Types } from "mongoose";

export interface IClickLogDocument extends Document {
  linkId: Types.ObjectId;
  clickedAt: Date;
  userAgent?: string;
  referer?: string;
  ipAddress?: string; // to integrate geo-IP lookups later
}

export interface ClickMetaData {
  userAgent?: string;
  referer?: string;
  ipAddress?: string;
}