import { Router } from 'express';
import { LinkController } from '@/controllers/link';
import { protect } from '@/middleware/auth';
import getRateLimiter from '@/middleware/rate-limiter';

const router = Router();

router.use(protect);
router.use(getRateLimiter('basic'))

router.post('/', LinkController.create);
router.get('/my-links', LinkController.getMyLinks);
router.delete('/:id', LinkController.remove);
router.get('/:id/analytics', LinkController.getAnalytics);

export default router;