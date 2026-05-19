import { Document } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { UserSignupInput } from '@/validations/user';

export type UserRole = 'user' | 'admin';

export interface IUserDocument extends UserSignupInput, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  role: UserRole;
  totalVisitCount: number;
  passwordResetToken: {
    token: string;
    expiresAt: Date;
  } | null;
  refreshToken: string | null;
}

export interface UserPayload {
  _id: string;
  role: UserRole;
}
export interface DecodedToken extends JwtPayload {
  id: string;
  role: UserRole;
  exp: number;
}
