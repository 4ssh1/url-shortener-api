import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/util/catch-async';
import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';
import logger from '@/libs/pino';
import { verifyAccessToken, verifyRefreshToken } from '@/libs/jwt';
import { AuthenticatedRequest } from '@/interfaces/user';

export const protect = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  logger.info('Running access token authentication check');

  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.debug('Authentication failed: No access token provided');
    throw new AppError('You are not logged in. Please log in to gain access.', HttpStatus.UNAUTHORIZED);
  }

  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    logger.debug('Authentication failed: Invalid or expired access token');
    throw new AppError('Invalid or expired token. Please authenticate again.', HttpStatus.UNAUTHORIZED);
  }

  req.user = { _id: decoded.id, role: decoded.role };
  next();
});

export const validateRefresh = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  logger.info('Running refresh token validation check');

  const token = req.cookies?.refreshToken;

  if (!token) {
    logger.debug('Refresh failed: No refresh token cookie found');
    throw new AppError('Refresh token missing. Please log in again.', HttpStatus.UNAUTHORIZED);
  }

  const decoded = verifyRefreshToken(token);

  if (!decoded) {
    logger.debug('Refresh failed: Refresh token is invalid or expired');
    throw new AppError('Invalid or expired refresh token. Please log in again.', HttpStatus.UNAUTHORIZED);
  }

  req.refreshPayload = { _id: decoded.id, role: decoded.role };
  next();
});