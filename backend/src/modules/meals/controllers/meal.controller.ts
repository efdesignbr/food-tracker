import { Request, Response, NextFunction } from 'express';
import { mealService } from '../services/meal.service';
import { ApproveMealSchema } from '../schemas/meal.schema';
import { AppError } from '../../../shared/middleware/error-handler.middleware';
import { analyzeTextWithAI } from '../services/ai-text-analysis.service';

export class MealController {
  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'Image is required');
      }

      const analysis = await mealService.analyzeImage(req.file.buffer);

      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }

  async analyzeText(req: Request, res: Response, next: NextFunction) {
    try {
      const { description, meal_type } = req.body;

      if (!description) {
        throw new AppError(400, 'Description is required');
      }

      const analysis = await analyzeTextWithAI(description, meal_type);

      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'Image is required');
      }

      // Parse foods from JSON string (multipart form data)
      const body = {
        ...req.body,
        foods: JSON.parse(req.body.foods),
      };

      const validated = ApproveMealSchema.parse(body);

      const result = await mealService.approveMeal(validated, req.file.buffer);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        throw new AppError(400, 'start_date and end_date are required');
      }

      // Parse dates in local timezone (São Paulo)
      const startDate = new Date(start_date + 'T00:00:00-03:00');
      const endDate = new Date(end_date + 'T23:59:59-03:00');

      console.log('[History] Querying from', startDate, 'to', endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new AppError(400, 'Invalid date format');
      }

      const meals = await mealService.getMealsByDateRange(startDate, endDate);
      console.log('[History] Found meals:', meals.length);

      // Calculate totals
      const totals = meals.reduce(
        (acc, meal) => {
          meal.foods.forEach((food) => {
            acc.calories += food.nutrition.calories;
            acc.protein_g += food.nutrition.protein_g;
            acc.carbs_g += food.nutrition.carbs_g;
            acc.fat_g += food.nutrition.fat_g;
            acc.fiber_g += food.nutrition.fiber_g;
          });
          return acc;
        },
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
      );

      res.json({
        meals,
        totals,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await mealService.deleteMeal(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const mealController = new MealController();
