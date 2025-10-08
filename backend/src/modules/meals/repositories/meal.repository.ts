import { db } from '../../../config/database';
import { Meal, FoodItem, NutritionData, MealWithDetails } from '../../../shared/types';
import { logger } from '../../../shared/utils/logger';

const DEFAULT_USER_ID = 'user@foodtracker.local'; // MVP: single user

export class MealRepository {
  async getUserId(): Promise<string> {
    const result = await db.query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [DEFAULT_USER_ID]
    );
    return result[0].id;
  }

  async create(
    imageUrl: string,
    mealType: string,
    consumedAt: Date,
    notes?: string
  ): Promise<Meal> {
    const userId = await this.getUserId();

    const result = await db.query<Meal>(
      `INSERT INTO meals (user_id, image_url, meal_type, consumed_at, status, notes)
       VALUES ($1, $2, $3, $4, 'approved', $5)
       RETURNING *`,
      [userId, imageUrl, mealType, consumedAt, notes]
    );

    logger.info('Meal created', { mealId: result[0].id });
    return result[0];
  }

  async addFoodItem(
    mealId: string,
    name: string,
    quantity: number,
    unit: string,
    confidenceScore: number
  ): Promise<FoodItem> {
    const result = await db.query<FoodItem>(
      `INSERT INTO food_items (meal_id, name, quantity, unit, confidence_score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [mealId, name, quantity, unit, confidenceScore]
    );

    return result[0];
  }

  async addNutritionData(
    foodItemId: string,
    nutrition: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g: number;
      sodium_mg?: number;
      sugar_g?: number;
    }
  ): Promise<NutritionData> {
    const result = await db.query<NutritionData>(
      `INSERT INTO nutrition_data (food_item_id, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        foodItemId,
        nutrition.calories,
        nutrition.protein_g,
        nutrition.carbs_g,
        nutrition.fat_g,
        nutrition.fiber_g,
        nutrition.sodium_mg ?? null,
        nutrition.sugar_g ?? null,
      ]
    );

    return result[0];
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<MealWithDetails[]> {
    const userId = await this.getUserId();

    const result = await db.query<MealWithDetails & {
      food_id: string;
      food_name: string;
      food_quantity: number;
      food_unit: string;
      food_confidence: number;
      nutrition_id: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g: number;
      sodium_mg: number | null;
      sugar_g: number | null;
    }>(
      `SELECT
        m.*,
        f.id as food_id,
        f.name as food_name,
        f.quantity as food_quantity,
        f.unit as food_unit,
        f.confidence_score as food_confidence,
        n.id as nutrition_id,
        n.calories,
        n.protein_g,
        n.carbs_g,
        n.fat_g,
        n.fiber_g,
        n.sodium_mg,
        n.sugar_g
       FROM meals m
       LEFT JOIN food_items f ON f.meal_id = m.id
       LEFT JOIN nutrition_data n ON n.food_item_id = f.id
       WHERE m.user_id = $1
         AND m.consumed_at >= $2
         AND m.consumed_at <= $3
         AND m.status = 'approved'
       ORDER BY m.consumed_at DESC, f.name ASC`,
      [userId, startDate, endDate]
    );

    // Group foods by meal
    const mealsMap = new Map<string, MealWithDetails>();

    result.forEach((row) => {
      if (!mealsMap.has(row.id)) {
        mealsMap.set(row.id, {
          id: row.id,
          user_id: row.user_id,
          image_url: row.image_url,
          meal_type: row.meal_type,
          consumed_at: row.consumed_at,
          status: row.status,
          notes: row.notes,
          created_at: row.created_at,
          updated_at: row.updated_at,
          foods: [],
        });
      }

      if (row.food_id) {
        const meal = mealsMap.get(row.id)!;
        meal.foods.push({
          id: row.food_id,
          meal_id: row.id,
          name: row.food_name,
          quantity: row.food_quantity,
          unit: row.food_unit,
          confidence_score: row.food_confidence,
          created_at: row.created_at,
          nutrition: {
            id: row.nutrition_id,
            food_item_id: row.food_id,
            calories: row.calories,
            protein_g: row.protein_g,
            carbs_g: row.carbs_g,
            fat_g: row.fat_g,
            fiber_g: row.fiber_g,
            sodium_mg: row.sodium_mg ?? undefined,
            sugar_g: row.sugar_g ?? undefined,
            created_at: row.created_at,
          },
        });
      }
    });

    return Array.from(mealsMap.values());
  }

  async delete(mealId: string): Promise<void> {
    await db.query('DELETE FROM meals WHERE id = $1', [mealId]);
    logger.info('Meal deleted', { mealId });
  }
}

export const mealRepository = new MealRepository();
