import { Router } from 'express';
import { FeedbackController } from '../controllers/FeedbackController';

const router = Router();

router.post('/', FeedbackController.create);
router.get('/client/:clientId', FeedbackController.getByClient);

export default router;

