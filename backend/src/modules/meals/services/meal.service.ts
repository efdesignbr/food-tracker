import { mealRepository } from '../repositories/meal.repository';
import { analyzeImageWithAI } from './ai-analysis.service';
import { processAndSaveImage } from '../../../shared/utils/image-processor';
import { ApproveMealInput } from '../schemas/meal.schema';
import { logger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

class MealService {
  async analyzeImage(imageBuffer: Buffer) {
    logger.info('Analyzing meal image');
    return await analyzeImageWithAI(imageBuffer);
  }

  async approveMeal(input: ApproveMealInput, imageBuffer: Buffer) {
    const client = await (await import('../../../config/database')).db.getClient();

    try {
      await client.query('BEGIN');

      // Save image
      const filename = `${uuidv4()}.jpg`;
      const imagePath = await processAndSaveImage(imageBuffer, filename);

      // Create meal
      const meal = await mealRepository.create(
        imagePath,
        input.meal_type,
        new Date(input.consumed_at),
        input.notes
      );

      // Add food items and nutrition
      for (const food of input.foods) {
        const foodItem = await mealRepository.addFoodItem(
          meal.id,
          food.name,
          food.quantity,
          food.unit,
          food.confidence
        );

        await mealRepository.addNutritionData(foodItem.id, food.nutrition);
      }

      await client.query('COMMIT');

      logger.info('Meal approved and saved', { mealId: meal.id });

      return { mealId: meal.id, status: 'approved' };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to approve meal', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  async getMealsByDateRange(startDate: Date, endDate: Date) {
    return await mealRepository.findByDateRange(startDate, endDate);
  }

  async deleteMeal(mealId: string) {
    await mealRepository.delete(mealId);
  }
}

export const mealService = new MealService();
