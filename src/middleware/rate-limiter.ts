import { config } from '@/config';
import { rateLimit, RateLimitRequestHandler, Options } from 'express-rate-limit';

type RateLimit = "basic" | "auth" | "reset-password";

const limiter: Partial<Options> = {
  windowMs: config.windowMs,
  message: 'Too many requests, please try again later.',
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  standardHeaders: true, // Enable the `RateLimit-*` headers
};

const options = new Map<RateLimit, Partial<Options>>([
  ["basic", {...limiter, limit: 100}],
  ["auth", {...limiter, limit: 10}],
  ["reset-password", {...limiter, limit: 3}]
]);

const getRateLimiter = (type: RateLimit): RateLimitRequestHandler => {
  const opts = options.get(type);
  if (!opts) {
    throw new Error(`Rate limiter configuration for type "${type}" not found.`);
  }
  return rateLimit(opts);
};


export default getRateLimiter;