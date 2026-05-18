import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';
import logger from '@/libs/pino';
import { UserSignupInput, UserLoginInput } from '@/validations/user';
import { User } from '@/models/user';
import { generateAccessToken, generatePasswordResetToken, generateRefreshToken, verifyPasswordResetToken } from '@/libs/jwt';
import crypto from 'crypto';
import { sendEmail } from '@/libs/mailer';

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

  public async logoutUser(userId: string): Promise<void> {
    logger.info({ userId }, 'Clearing refresh token from database');
    
    await User.findByIdAndUpdate(userId, {
      $set: { refreshToken: null }
    });
  }

  public async handleSlidingWindowRefresh(userId: string, currentRefreshToken: string, tokenExp: number) {
    logger.info({ userId }, 'Processing sliding window session refresh');

    if (!userId) {
      throw new AppError('User ID is missing for token refresh', HttpStatus.BAD_REQUEST);
    }

    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
    const twoDaysInSeconds = 2 * 24 * 60 * 60;

    const isNearingExpiration = (tokenExp - currentTime) < twoDaysInSeconds;

    const tokenPayload = { _id: userId.toString(), role: 'user' };
    const newAccessToken = generateAccessToken(tokenPayload);

    // 2. IF nearing expiration: Generate a new refresh token and WRITE to DB
    if (isNearingExpiration) {
      logger.info({ userId }, 'Refresh token is nearing expiration. Extending session lifespan.');
      const newRefreshToken = generateRefreshToken(tokenPayload);

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { refreshToken: newRefreshToken } },
        { new: true }
      );

      if (!user) throw new AppError('User no longer exists', HttpStatus.UNAUTHORIZED);

      return { user, newAccessToken, newRefreshToken, rotated: true };
    }

    // 3. ELSE: Do a simple READ check to ensure the token wasn't revoked via logout
    const user = await User.findById(userId).select('+refreshToken');
    
    if (!user || user.refreshToken !== currentRefreshToken) {
      logger.warn({ userId }, 'Refresh failed: Token is invalid or has been revoked');
      throw new AppError('Session expired or revoked. Please log in again.', HttpStatus.UNAUTHORIZED);
    }

    // Return the current refresh token unmodified. No DB write occurred.
    return { user, newAccessToken, newRefreshToken: currentRefreshToken, rotated: false };
  }

  public async generatePasswordReset(email: string, originHeader: string) {
    const user = await User.findOne({ email });
    if (!user) {
      logger.debug({ email }, 'Password reset requested for non-existent email');
      return;
    }

    const resetId = crypto.randomBytes(16).toString('hex');

    user.passwordResetToken = resetId;
    await user.save();

    const token = generatePasswordResetToken({
      sub: user._id.toString(),
      resetId: resetId,
    });

    const resetUrl = `${originHeader}/reset-password?token=${token}`;

    const htmlMessage = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to set a new password. This link is only valid for 10 minutes.</p>
      <a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not make this request, please ignore this email.</p>
    `;

    sendEmail(user.email, 'Password Reset Link (Valid for 10 mins)', htmlMessage).catch((err: Error) => {
      logger.error({ err, userId: user._id }, 'Background password reset email failed to send');
    });
  }

  public async executePasswordReset(token: string, newPassword: string) {
    const decoded = verifyPasswordResetToken(token);
    
    if (!decoded) {
      throw new AppError('The reset link is invalid or has expired.', HttpStatus.BAD_REQUEST);
    }

    const user = await User.findById(decoded.sub).select('+password +passwordResetToken');

    if (!user || user.passwordResetToken !== decoded.resetId) {
      throw new AppError('This reset link has already been used or is invalid.', HttpStatus.BAD_REQUEST);
    }

    user.password = newPassword;
    user.passwordResetToken = null; 
    
    await user.save();
    logger.info({ userId: user._id }, 'User password reset successfully');
  }
}