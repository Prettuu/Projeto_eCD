import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();

router.get('/', NotificationController.getAll);
router.get('/:id', NotificationController.getById);
router.put('/:id/read', NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);

router.post('/', NotificationController.create);
router.delete('/:id', NotificationController.delete);

export default router;

