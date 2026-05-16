import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserPayload, DecodedAccessToken } from '@/interfaces/user';
import { config } from '@/config';

export const generateAccessToken = (user: UserPayload): string => {
  return jwt.sign({ role: user.role }, config.jwtAccessSecret, {
    subject: user._id,
    expiresIn: '10m',
  });
};

export const generateRefreshToken = (user: UserPayload): string => {
  return jwt.sign({}, config.jwtRefreshSecret, {
    subject: user._id,
    expiresIn: '7d',
  });
};

export const verifyAccessToken = (token: string): DecodedAccessToken | null => {
  try {
    return jwt.verify(token, config.jwtAccessSecret) as DecodedAccessToken;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
  } catch {
    return null;
  }
};