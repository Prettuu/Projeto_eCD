import { Router } from 'express';
import { ChatbotController } from '../controllers/ChatbotController';

const router = Router();

router.post('/chat', ChatbotController.chat);
router.get('/search', ChatbotController.search);

export default router;

