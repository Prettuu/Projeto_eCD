import { Router } from 'express';
import { CartController } from '../controllers/CartController';

const router = Router();

router.post('/cart-item', CartController.addItem);
router.get('/', CartController.getCart);

export default router;

