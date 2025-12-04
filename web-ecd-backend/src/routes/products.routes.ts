import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { ProductAutoInactivationController } from '../controllers/ProductAutoInactivationController';

const router = Router();

router.get('/', ProductController.getAll);
router.get('/admin', ProductController.getAllAdmin);
router.get('/:id', ProductController.getById);
router.post('/', ProductController.create);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);
router.patch('/:id/stock', ProductController.updateStock);

router.post('/auto-inactivation/run', ProductAutoInactivationController.runManually);
router.get('/:id/auto-inactivation/check', ProductAutoInactivationController.checkProduct);

export default router;

