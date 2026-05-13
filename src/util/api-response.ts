import { Response } from 'express';
import { HttpStatus } from '@/consts/http-status';

export class ApiResponse {
  static success<T>(
    res: Response, 
    data: T, 
    message: string = 'Success', 
    statusCode: number = HttpStatus.OK
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error<E>(
    res: Response, 
    message: string = 'Internal Server Error', 
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR, 
    errors: E | null = null
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static created<T>(res: Response, data: T, message: string = 'Created successfully') {
    return this.success<T>(res, data, message, HttpStatus.CREATED);
  }

  static badRequest<E>(res: Response, message: string = 'Bad Request', errors: E | null = null) {
    return this.error<E>(res, message, HttpStatus.BAD_REQUEST, errors);
  }

  static unauthorized<E>(res: Response, message: string = 'Unauthorized', errors: E | null = null) {
    return this.error<E>(res, message, HttpStatus.UNAUTHORIZED, errors);
  }

  static notFound(res: Response, message: string = 'Resource not found') {
    return this.error(res, message, HttpStatus.NOT_FOUND); 
  }
}