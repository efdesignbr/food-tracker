import { z } from 'zod';

export const FoodItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  confidence: z.number().min(0).max(1),
  nutrition: z.object({
    calories: z.number().nonnegative(),
    protein_g: z.number().nonnegative(),
    carbs_g: z.number().nonnegative(),
    fat_g: z.number().nonnegative(),
    fiber_g: z.number().nonnegative(),
    sodium_mg: z.number().nonnegative().nullable().optional(),
    sugar_g: z.number().nonnegative().nullable().optional(),
  }),
});

export const AIAnalysisSchema = z.object({
  foods: z.array(FoodItemSchema).min(1),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  notes: z.string().optional(),
});

export const ApproveMealSchema = z.object({
  foods: z.array(FoodItemSchema).min(1),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  consumed_at: z.string().datetime(),
  notes: z.string().optional(),
});

export type AIAnalysisInput = z.infer<typeof AIAnalysisSchema>;
export type ApproveMealInput = z.infer<typeof ApproveMealSchema>;
