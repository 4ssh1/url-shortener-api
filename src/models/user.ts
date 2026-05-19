import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUserDocument } from '@/interfaces/user';

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: ['user', 'admin'],
        message: '``{VALUE}`` is not a valid role',
      },
    },
    totalVisitCount: {
      type: Number,
      default: 0,
    },
    passwordResetToken: {
      type: {
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
      },
      default: null,
      select: false,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>('User', userSchema);
