import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';
import logger from '@/libs/pino';
import { UserSignupInput, UserLoginInput } from '@/validations/user';
import { User } from '@/models/user';
import {
  generateAccessToken,
  generateRefreshToken,
} from '@/libs/jwt';
import crypto from 'crypto';
import { sendEmail } from '@/libs/mailer';
import { UserRole } from '@/interfaces/user';
import { UserUpdateInput } from '@/validations/user';

export class UserService {
  public async createUser(data: UserSignupInput) {
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
      logger.debug(
        { email: data.email },
        'Signup failed: Email already in use',
      );
      throw new AppError('Email is already registered', HttpStatus.BAD_REQUEST);
    }

    const user = new User(data);

    const accessToken = generateAccessToken({
      _id: user._id.toString(),
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      _id: user._id.toString(),
      role: user.role,
    });

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

    const accessToken = generateAccessToken({
      _id: user._id.toString(),
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      _id: user._id.toString(),
      role: user.role,
    });

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    logger.info({ userId: user._id }, 'User authenticated successfully');
    return { user, accessToken, refreshToken };
  }

  public async logoutUser(userId: string): Promise<void> {
    logger.info({ userId }, 'Clearing refresh token from database');

    await User.findByIdAndUpdate(userId, {
      $set: { refreshToken: null },
    });
  }

  public async handleSlidingWindowRefresh(
    userId: string,
    currentRefreshToken: string,
    tokenExp: number,
  ) {
    logger.info({ userId }, 'Processing sliding window session refresh');

    if (!userId) {
      throw new AppError(
        'User ID is missing for token refresh',
        HttpStatus.BAD_REQUEST,
      );
    }

    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
    const twoDaysInSeconds = 2 * 24 * 60 * 60;

    const isNearingExpiration = tokenExp - currentTime < twoDaysInSeconds;

    const tokenPayload = { _id: userId.toString(), role: 'user' as UserRole };
    const newAccessToken = generateAccessToken(tokenPayload);

    // 2. IF nearing expiration: Generate a new refresh token and WRITE to DB
    if (isNearingExpiration) {
      logger.info(
        { userId },
        'Refresh token is nearing expiration. Extending session lifespan.',
      );
      const newRefreshToken = generateRefreshToken(tokenPayload);

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { refreshToken: newRefreshToken } },
        { new: true },
      );

      if (!user)
        throw new AppError('User no longer exists', HttpStatus.UNAUTHORIZED);

      return { user, newAccessToken, newRefreshToken, rotated: true };
    }

    // 3. ELSE: Do a simple READ check to ensure the token wasn't revoked via logout
    const user = await User.findById(userId).select('+refreshToken');

    if (!user || user.refreshToken !== currentRefreshToken) {
      logger.warn(
        { userId },
        'Refresh failed: Token is invalid or has been revoked',
      );
      throw new AppError(
        'Session expired or revoked. Please log in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Return the current refresh token unmodified. No DB write occurred.
    return {
      user,
      newAccessToken,
      newRefreshToken: currentRefreshToken,
      rotated: false,
    };
  }

  public async generatePasswordReset(email: string, originHeader: string) {

    const user = await User.findOne({ email }).select('+passwordResetToken');
    if (!user) {
      logger.debug(
        { email },
        'Password reset requested for non-existent email',
      );
      return;
    }

    if (
      user.passwordResetToken &&
      user.passwordResetToken.expiresAt > new Date()
    ) {
      logger.warn(
        { userId: user._id },
        'Password reset rejected: An active link already exists',
      );
      throw new AppError(
        'A password reset link has already been sent to your email and is still active. Please check your inbox.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const token = crypto.randomBytes(16).toString('hex');

    user.passwordResetToken = {
      token,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    await user.save();

    const resetUrl = `${originHeader}/reset-password?token=${token}`;

    const htmlMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Url-shortener password</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px 40px 10px;">
        
        <!-- Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
          
          <!-- Header Banner (Optional brand accent line) -->
          <tr>
            <td height="4" style="background-color: #2d3748; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td align="left" style="padding: 40px 32px 40px 32px;">
              
              <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; line-height: 32px; color: #1a202c;">
                Password Reset Request
              </h1>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                You requested a password reset. Click the button below to set a new password. This link is only valid for <strong>10 minutes</strong>.
              </p>

              <!-- Action Button Container -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="left">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#2d3748" style="border-radius: 6px;">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0 0 24px 0;" />

              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #718096;">
                If you did not make this request, you can safely ignore this email. Your password will remain unchanged.
              </p>

            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 0 32px 40px 32px; font-size: 12px; line-height: 18px; color: #a0aec0;">
              <p style="margin: 0;">This is an automated security notification. Please do not reply directly to this email.</p>
            </td>
          </tr>

        </table>
        <!-- /Email Container -->

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    await sendEmail(
      user.email,
      'Password Reset Link (Valid for 10 mins)',
      htmlMessage,
    ).catch((err: Error) => {
      logger.error(
        { err, userId: user._id },
        'Background password reset email failed to send',
      );
    });
  }

  public async executePasswordReset(token: string, newPassword: string) {
    const user = await User.findOne({
      'passwordResetToken.token': token,
      'passwordResetToken.expiresAt': { $gt: new Date() },
    }).select('+password +passwordResetToken');

    if (!user) {
      throw new AppError(
        'This reset link is invalid, has expired, or has already been used.',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.password = newPassword;

    user.passwordResetToken = null;

    await user.save();
    logger.info({ userId: user._id }, 'User password reset successfully');
  }

  public async getAllUsers() {
    logger.info('Fetching all users from database');
    return await User.find({});
  }

  public async getUserById(userId: string) {
    logger.info({ userId }, 'Fetching user by ID');
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  public async updateUserById(userId: string, updateData: UserUpdateInput) {
    logger.info({ userId }, 'Updating user records');

    // findByIdAndUpdate skips standard pre('save') hooks, preventing accidental password re-hashing
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      throw new AppError('User not found or update failed', HttpStatus.NOT_FOUND);
    }
    return updatedUser;
  }

  public async deleteUserById(userId: string) {
    logger.info({ userId }, 'Deleting user from database');
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      throw new AppError('User not found', HttpStatus.NOT_FOUND);
    }
    return deletedUser;
  }
}
