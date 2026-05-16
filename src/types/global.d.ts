import { UserPayload, DecodedToken } from '@/interfaces/user';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      refreshPayload?: DecodedToken;
    }
  }
}
