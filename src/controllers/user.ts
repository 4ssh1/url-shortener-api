import { Request, Response } from 'express';
import { catchAsync } from '@/util/catch-async';
import { validateOrThrow } from '@/util/validate-or-throw';
import { ApiResponse } from '@/util/api-response';
import logger from '@/libs/pino';
import { UserService } from '@/services/user';
import { userSignupSchema, userLoginSchema } from '@/validations/user';
import { generateAccessToken } from '@/libs/jwt';
import { AuthenticatedRequest } from '@/interfaces/user';

const COOKIE_OPTIONS = {
  httpOnly: true,   // Prevents client-side JS from reading the cookie (Stops XSS)
  secure: process.env.NODE_ENV === 'production', // Forces HTTPS in production
  sameSite: 'lax' as const,    // Protects against CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000,       
};

export class UserController {
  private static userService = new UserService();

  public static signup = catchAsync(async (req: Request, res: Response) => {
    logger.info('Processing signup request');
    const data = validateOrThrow(userSignupSchema, req.body);
    
    const { user, accessToken, refreshToken } = await UserController.userService.createUser(data);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    
    return ApiResponse.created(res, { user: { _id: user._id, email: user.email, role: user.role }, accessToken: accessToken,  }, 'User registered successfully');
  });

  public static login = catchAsync(async (req: Request, res: Response) => {
    logger.info('Processing login request');
    const data = validateOrThrow(userLoginSchema, req.body);
    
    const { user, accessToken, refreshToken } = await UserController.userService.authenticateUser(data);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    
    return ApiResponse.success(res, { user: { _id: user._id, email: user.email, role: user.role }, accessToken: accessToken }, 'Logged in successfully');
  });

  public static logout = catchAsync(async (req: Request, res: Response) => {
    logger.info('Processing logout request');

    res.clearCookie('refreshToken', {
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
    });

    return ApiResponse.success(res, null, 'Logged out successfully');
  });

  public static refresh = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    logger.info('Processing access token refresh request');
    
    const payload = req.refreshPayload!;

    const newAccessToken = generateAccessToken({
      _id: payload._id,
      role: payload.role,
    });

    return ApiResponse.success(
      res, 
      { accessToken: newAccessToken }, 
      'Access token refreshed successfully'
    );
  });
}