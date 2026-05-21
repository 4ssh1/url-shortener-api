import { z } from 'zod';

export const createLinkSchema = z.object({
    body: z.object({
        title: z.string({ error: 'Title is required' }).trim().min(1),
        destination: z.string({ error: 'Destination URL is required' }).trim().url(),
        shortLink: z.url({ error: 'Short link URL is required' }).trim(),
        creator: z.string({ error: 'Link must belong to a creator' }).regex(/^[0-9a-fA-F]{24}$/),
        backHalf: z
            .string()
            .trim()
            .regex(/^[a-zA-Z0-9-_]+$/, 'Back-half can only contain alphanumeric characters, hyphens, and underscores')
    }),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>['body'];