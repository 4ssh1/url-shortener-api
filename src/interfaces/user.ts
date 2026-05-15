import { Document } from 'mongoose';
import { UserSignupInput } from '@/validations/user';
import { JwtPayload } from 'jsonwebtoken';

export interface IUserDocument extends UserSignupInput, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  role: "user" | "admin";
  totalVisitCount: number;
  passwordResetToken: string | null;
  refreshToken: string | null;
}

export interface UserPayload {
    _id: string;
    role: string;
}
export interface DecodedAccessToken extends JwtPayload {

    sub: string;
    role: string;
}