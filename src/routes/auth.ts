import { Router } from 'express';
import { UserController } from '@/controllers/user';
import getRateLimiter from '@/middleware/rate-limiter';
import { protect, validateRefresh } from '@/middleware/protect';

const router = Router();

router.post('/signup', getRateLimiter('auth'), UserController.signup);
router.post('/login', getRateLimiter('auth'), UserController.login);

router.post('/logout', getRateLimiter('basic'), protect, UserController.logout);
router.post('/refresh', getRateLimiter('basic'), validateRefresh, UserController.refresh);

router.post('/forgot-password', getRateLimiter('auth'), UserController.forgotPassword);
router.post('/reset-password', getRateLimiter('auth'), UserController.resetPassword);

export default router;