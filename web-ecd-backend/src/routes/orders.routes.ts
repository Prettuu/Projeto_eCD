import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();

router.get('/', OrderController.getAll);
router.get('/:id', OrderController.getById);
router.post('/', OrderController.create);
router.patch('/:id/status', OrderController.updateStatus);
router.delete('/:id', OrderController.delete);

export default router;

