import { Request, Response } from 'express';
import { catchAsync } from '@/util/catch-async';
import { validateOrThrow } from '@/util/validate-or-throw';
import { ApiResponse } from '@/util/api-response';
import logger from '@/libs/pino';
import { UserService } from '@/services/user';
import { userSignupSchema, userLoginSchema, resetPasswordSchema, userUpdateSchema } from '@/validations/user';

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

  public static forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return ApiResponse.badRequest(res, "Please provide an email address");
    }

    // Capture the base URL dynamically
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    
    await UserController.userService.generatePasswordReset(email, origin);

    return ApiResponse.success(
      res, 
      null, 
      'If that email belongs to an account, a reset link has been sent.'
    );
  });

  public static resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { token, password } = validateOrThrow(resetPasswordSchema, req.body);

    await UserController.userService.executePasswordReset(token, password);

    return ApiResponse.success(res, null, 'Password updated successfully. You can now log in.');
  });

  public static getAll = catchAsync(async (req: Request, res: Response) => {
    const users = await UserController.userService.getAllUsers();
    return ApiResponse.success(res, users, 'Users retrieved successfully');
  });

  public static getOne = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) return ApiResponse.badRequest(res, 'User ID parameter is required');

    const user = await UserController.userService.getUserById(id as string);
    return ApiResponse.success(res, user, 'User retrieved successfully');
  });

  public static update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) return ApiResponse.badRequest(res, 'User ID parameter is required');

    const validatedData = validateOrThrow(userUpdateSchema, req.body);

    const updatedUser = await UserController.userService.updateUserById(id as string, validatedData);
    return ApiResponse.success(res, updatedUser, 'User updated successfully');
  });

  public static remove = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) return ApiResponse.badRequest(res, 'User ID parameter is required');

    await UserController.userService.deleteUserById(id as string);
    return ApiResponse.success(res, null, 'User deleted successfully');
  });
}
