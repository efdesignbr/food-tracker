import { Router } from 'express';
import multer from 'multer';
import { mealController } from '../controllers/meal.controller';
import { config } from '../../../config/environment';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed'));
    }
  },
});

router.post('/analyze', upload.single('image'), mealController.analyze.bind(mealController));
router.post('/analyze-text', mealController.analyzeText.bind(mealController));
router.post('/approve', upload.single('image'), mealController.approve.bind(mealController));
router.get('/history', mealController.getHistory.bind(mealController));
router.delete('/:id', mealController.delete.bind(mealController));

export default router;
