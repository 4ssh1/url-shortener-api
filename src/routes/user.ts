import { Router } from 'express';
import { UserController } from '@/controllers/user';
import { protect } from '@/middleware/protect';
import { authorize } from '@/middleware/authorization';
import getRateLimiter from '@/middleware/rate-limiter';

const router = Router();

router.use(protect);

router.get('/', getRateLimiter("basic"), authorize("admin"), UserController.getAll);
router.get('/:id', getRateLimiter("basic"), UserController.getOne);
router.patch('/:id', getRateLimiter("basic"), UserController.update);
router.delete('/:id', getRateLimiter("basic"), authorize("admin"), UserController.remove);

export default router;