import { Router } from 'express';
import { ExchangeCouponController } from '../controllers/ExchangeCouponController';

const router = Router();

router.get('/client/:clientId', ExchangeCouponController.getByClientId);
router.get('/code/:code', ExchangeCouponController.getByCode);
router.post('/validate', ExchangeCouponController.validateCoupon);
router.patch('/:code/use', ExchangeCouponController.markAsUsed);

export default router;

