import { Router } from 'express';
import { ReturnController } from '../controllers/ReturnController';

const router = Router();

router.get('/', ReturnController.getAll);
router.get('/:id', ReturnController.getById);
router.post('/', ReturnController.create);
router.patch('/:id/status', ReturnController.updateStatus);
router.post('/:id/received', ReturnController.confirmReceived);

export default router;

