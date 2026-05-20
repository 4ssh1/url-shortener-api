import { Types, Document } from "mongoose";

export interface ILinkDocument extends Document {
    title: string;
    destination: string;
    backHalf: string;
    shortLink: string;
    creator: Types.ObjectId;
    totalVisitCount: number;
}