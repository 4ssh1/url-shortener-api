import { Request, Response } from 'express';
import { catchAsync } from '@/util/catch-async';
import { validateOrThrow } from '@/util/validate-or-throw';
import { ApiResponse } from '@/util/api-response';
import logger from '@/libs/pino';
import { UserService } from '@/services/user';
import { userSignupSchema, userLoginSchema } from '@/validations/user';
import { verifyRefreshToken } from '@/libs/jwt';

const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents client-side JS from reading the cookie (Stops XSS)
  secure: process.env.NODE_ENV === 'production', // Forces HTTPS in production
  sameSite: 'lax' as const, // Protects against CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class UserController {
  private static userService = new UserService();

  public static signup = catchAsync(async (req: Request, res: Response) => {
    logger.info('Processing signup request');
    const data = validateOrThrow(userSignupSchema, req.body);

    const { user, accessToken, refreshToken } =
      await UserController.userService.createUser(data);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return ApiResponse.created(
      res,
      {
        user: { _id: user._id, email: user.email, role: user.role },
        accessToken: accessToken,
      },
      'User registered successfully',
    );
  });

  public static login = catchAsync(async (req: Request, res: Response) => {
    logger.info('Processing login request');
    const data = validateOrThrow(userLoginSchema, req.body);

    const { user, accessToken, refreshToken } =
      await UserController.userService.authenticateUser(data);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return ApiResponse.success(
      res,
      {
        user: { _id: user._id, email: user.email, role: user.role },
        accessToken: accessToken,
      },
      'Logged in successfully',
    );
  });

  public static logout = catchAsync(async (req: Request, res: Response) => {
    logger.info('Processing logout request');

    if (req.user?._id) {
      await UserController.userService.logoutUser(req.user._id);
    }

    res.clearCookie('refreshToken', {
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
    });

    return ApiResponse.success(res, null, 'Logged out successfully');
  });

  public static refresh = catchAsync(async (req: Request, res: Response) => {
    logger.info('Processing access token refresh request');

    const currentRefreshToken = req.cookies.refreshToken;
    const { id, exp } = req.refreshPayload!;

    const { user, newAccessToken, newRefreshToken, rotated } =
      await UserController.userService.handleSlidingWindowRefresh(
        id,
        currentRefreshToken,
        exp,
      );

    if (rotated) {
      res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    }

    return ApiResponse.success(
      res,
      {
        user: { _id: user._id, email: user.email, role: user.role },
        rotated: rotated,
        accessToken: newAccessToken,
      },
      'Access token refreshed successfully',
    );
  });
}
