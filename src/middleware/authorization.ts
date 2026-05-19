
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/util/api-response';
import { HttpStatus } from '@/consts/http-status';

type UserRole = 'user' | 'admin';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.role)) {
      return ApiResponse.error(res, 'You are not authorized to access this resource', HttpStatus.FORBIDDEN);
    }
    next();
  };
}
