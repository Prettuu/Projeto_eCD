import { Router } from 'express';
import { ExchangeController } from '../controllers/ExchangeController';

const router = Router();

router.get('/', ExchangeController.getAll);
router.get('/:id', ExchangeController.getById);
router.post('/', ExchangeController.create);
router.patch('/:id/status', ExchangeController.updateStatus);
router.post('/:id/confirm-received', ExchangeController.confirmReceived);

export default router;

