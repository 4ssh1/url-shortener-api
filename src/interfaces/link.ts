import { Types, Document } from "mongoose";

export interface ILink<T = string> {
    title: string;
    destination: string;
    backHalf: string;
    shortLink: string;
    creator: T;
    totalVisitCount?: number;
}

export interface ILinkDocument extends ILink<Types.ObjectId>, Document {}