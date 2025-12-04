import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';

const router = Router();

router.get('/', ClientController.getAll);
router.get('/:id', ClientController.getById);
router.post('/', ClientController.create);
router.put('/:id', ClientController.update);
router.put('/:id/password', ClientController.updatePassword);
router.delete('/:id', ClientController.delete);

export default router;
