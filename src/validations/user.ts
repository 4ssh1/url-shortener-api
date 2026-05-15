import { z } from 'zod';
import { config } from '@/config';

// Base schema without refinement
const baseUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters long'),
  email: z.email('Please provide a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[\W_]/, 'Password must contain at least one special character'),
  role: z.enum(['user', 'admin']).default('user')
});

export const userSignupSchema = baseUserSchema.refine(data => {
  if (data.role === 'admin') {
    return config.whiteListedEmails.includes(data.email);
  }
  return true;
}, {
  message: "You are not authorized to create an admin account.",
  path: ["role"],
});

export const userLoginSchema = baseUserSchema.pick({
  email: true,
  password: true,
});

export type UserLoginInput = z.infer<typeof userLoginSchema>;

export type UserSignupInput = z.infer<typeof userSignupSchema>;