import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/util/app-eror';
import { ApiResponse } from '@/util/api-response';
import { HttpStatus } from '@/consts/http-status';
import logger from '@/libs/pino';

export const globalErrorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn({ 
      path: req.path, 
      method: req.method, 
      statusCode: err.statusCode, 
      errors: err.errors 
    }, err.message);
    
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  logger.error({ 
    err, 
    path: req.path, 
    method: req.method 
  }, 'Unexpected server error occurred');
  
  return ApiResponse.error(res, 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
};