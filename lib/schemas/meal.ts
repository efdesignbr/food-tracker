import { z } from 'zod';

export const MealType = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

export const AnalyzeTextSchema = z.object({
  description: z.string().min(3),
  meal_type: MealType.optional(),
  // Contexto opcional para melhorar a análise
  location_type: z.enum(['home','out']).optional(),
  restaurant_name: z.string().max(255).optional()
});

export const FoodItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(0.01),
  unit: z.string().max(50),
  calories: z.number().min(0).optional(),
  protein_g: z.number().min(0).optional(),
  carbs_g: z.number().min(0).optional(),
  fat_g: z.number().min(0).optional(),
  fiber_g: z.number().min(0).nullable().optional(),
  sodium_mg: z.number().min(0).nullable().optional(),
  sugar_g: z.number().min(0).nullable().optional()
});

export const ApproveMealSchema = z.object({
  meal_type: MealType,
  consumed_at: z.coerce.date(),
  notes: z.string().max(500).optional(),
  foods: z.array(FoodItemSchema).min(1),
  location_type: z.enum(['home','out']).optional(),
  restaurant_id: z.string().uuid().nullable().optional()
});

export type AnalyzeTextInput = z.infer<typeof AnalyzeTextSchema>;
export type ApproveMealInput = z.infer<typeof ApproveMealSchema>;
export type FoodItemInput = z.infer<typeof FoodItemSchema>;
