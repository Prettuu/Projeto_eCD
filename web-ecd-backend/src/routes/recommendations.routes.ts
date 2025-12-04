import { Router } from 'express';
import { RecommendationController } from '../controllers/RecommendationController';

const router = Router();

router.get('/', RecommendationController.getPersonalized);

export default router;

