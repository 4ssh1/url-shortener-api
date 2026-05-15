import { Router } from 'express';
import { UserController } from '@/controllers/user';
import getRateLimiter from '@/middleware/rate-limiter';

const router = Router();

router.post('/signup', getRateLimiter('auth'), UserController.signup);
router.post('/login', getRateLimiter('auth'), UserController.login);

export default router;