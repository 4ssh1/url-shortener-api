import { Document } from 'mongoose';
import { UserSignupInput } from '@/validations/user';

export interface IUserDocument extends UserSignupInput, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  role: "user" | "admin";
  totalVisitCount: number;
  passwordResetToken: string | null;
  refreshToken: string | null;
}