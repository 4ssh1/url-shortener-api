import { HttpStatus } from "@/consts/http-status";

export class AppError extends Error {
  public statusCode: number;
  public errors: any;

  constructor(message: string, statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR, errors: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    
    Object.setPrototypeOf(this, AppError.prototype);
  }
}