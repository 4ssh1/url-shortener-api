import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';
import logger from '@/libs/pino';
import { UserSignupInput, UserLoginInput } from '@/validations/user';
import { User } from '@/models/user';
import { generateAccessToken, generateRefreshToken } from '@/libs/jwt';

export class UserService {
  public async createUser(data: UserSignupInput) {
    const existingUser = await User.findOne({ email: data.email });
    
    if (existingUser) {
      logger.debug({ email: data.email }, 'Signup failed: Email already in use');
      throw new AppError('Email is already registered', HttpStatus.BAD_REQUEST);
    }

    const user = new User(data);
    
    const accessToken = generateAccessToken({ _id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ _id: user._id.toString(), role: user.role });

    user.refreshToken = refreshToken;
    
    await user.save();

    logger.info({ userId: user._id }, 'New user created successfully');
    
    return { user, accessToken, refreshToken };
  }

  public async authenticateUser(data: UserLoginInput) {
    const user = await User.findOne({ email: data.email }).select('+password');
    
    if (!user) {
      logger.debug({ email: data.email }, 'Login failed: User not found');
      throw new AppError('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    const isMatch = await user.comparePassword(data.password);
    
    if (!isMatch) {
      logger.debug({ email: data.email }, 'Login failed: Incorrect password');
      throw new AppError('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = generateAccessToken({ _id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ _id: user._id.toString(), role: user.role });

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    logger.info({ userId: user._id }, 'User authenticated successfully');
    return { user, accessToken, refreshToken };
  }
}