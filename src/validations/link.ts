import { z } from 'zod';

export const createLinkSchema = z.object({
  title: z
    .string({ error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty'),
    
  destination: z
    .url('Please provide a valid destination URL (e.g., https://google.com)')
    .trim(),
    
  backHalf: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9-_]+$/, 'Back-half can only contain alphanumeric characters, hyphens, and underscores')
    .min(3, 'Custom alias must be at least 3 characters long')
    .optional(), 
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

