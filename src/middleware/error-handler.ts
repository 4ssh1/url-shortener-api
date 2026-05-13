import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/util/app-eror';
import { ApiResponse } from '@/util/api-response';
import { HttpStatus } from '@/consts/http-status';

export const globalErrorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // If it's our custom error (like a Zod validation error)
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // Fallback for unexpected server crashes (e.g., database goes offline)
  console.error('UNEXPECTED ERROR:', err);
  return ApiResponse.error(res, 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
};