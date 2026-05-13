import { z } from 'zod';
import { AppError } from './app-eror';
import { HttpStatus } from '@/consts/http-status';
import { ValidationError } from '@/interfaces/error';

export const validateOrThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const formattedErrors: ValidationError[] = result.error.issues.map((err) => ({
      field: err.path.join('.'), 
      message: err.message,
    }));

    throw new AppError('Validation failed', HttpStatus.BAD_REQUEST, formattedErrors);
  }

  return result.data;
};