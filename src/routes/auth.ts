import { Router } from 'express';
import { UserController } from '@/controllers/user';
import getRateLimiter from '@/middleware/rate-limiter';
import { protect } from '@/middleware/protect';

const router = Router();

router.post('/signup', getRateLimiter('auth'), UserController.signup);
router.post('/login', getRateLimiter('auth'), UserController.login);
router.post('/logout', getRateLimiter('auth') , UserController.logout);
router.post('/refresh', getRateLimiter('auth'), protect, UserController.refresh);

export default router;