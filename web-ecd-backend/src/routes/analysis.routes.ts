import { Router } from 'express';
import { SalesAnalysisController } from '../controllers/SalesAnalysisController';

const router = Router();

router.get('/products', SalesAnalysisController.compareProductsByDateRange);
router.get('/products-by-date', SalesAnalysisController.getProductsByDate);
router.get('/categories', SalesAnalysisController.compareCategoriesByDateRange);
router.get('/categories-by-date', SalesAnalysisController.getCategoriesByDate);
router.get('/summary', SalesAnalysisController.getSalesSummary);

export default router;

