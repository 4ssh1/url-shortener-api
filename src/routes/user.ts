import { Router } from 'express';
import { UserController } from '@/controllers/user';
import { protect } from '@/middleware/protect';
import { authorize } from '@/middleware/authorization';

const router = Router();

router.use(protect);

router.get('/', authorize("admin"), UserController.getAll);
router.get('/:id', UserController.getOne);
router.patch('/:id', UserController.update);
router.delete('/:id', authorize("admin"), UserController.remove);

export default router;