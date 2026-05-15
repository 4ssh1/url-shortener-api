import { Request, Response } from 'express';
import { catchAsync } from '@/util/catch-async';
import { validateOrThrow } from '@/util/validate-or-throw';
import { ApiResponse } from '@/util/api-response';
import logger from '@/libs/pino';
import { UserService } from '@/services/user';
import { userSignupSchema, userLoginSchema } from '@/validations/user';

export class UserController {
  private static userService = new UserService();

  public static signup = catchAsync(async (req: Request, res: Response) => {
    logger.info('Processing signup request');
    const data = validateOrThrow(userSignupSchema, req.body);
    
    const user = await UserController.userService.createUser(data);
    
    return ApiResponse.created(res, { userId: user._id }, 'User registered successfully');
  });

  public static login = catchAsync(async (req: Request, res: Response) => {
    logger.info('Processing login request');
    const data = validateOrThrow(userLoginSchema, req.body);
    
    const user = await UserController.userService.authenticateUser(data);
    
    return ApiResponse.success(res, { userId: user._id }, 'Logged in successfully');
  });
}