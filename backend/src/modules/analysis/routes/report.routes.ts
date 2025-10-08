import { Router } from 'express';
import { reportController } from '../controllers/report.controller';

const router = Router();

router.get('/inflammation', reportController.generateReport.bind(reportController));

export default router;
