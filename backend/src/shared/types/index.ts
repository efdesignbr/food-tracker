export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Meal {
  id: string;
  user_id: string;
  image_url: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  consumed_at: Date;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FoodItem {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  unit: string;
  confidence_score: number;
  created_at: Date;
}

export interface NutritionData {
  id: string;
  food_item_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg?: number;
  sugar_g?: number;
  created_at: Date;
}

export interface AIFoodAnalysis {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sodium_mg?: number;
    sugar_g?: number;
  };
}

export interface AIAnalysisResponse {
  foods: AIFoodAnalysis[];
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
}

export interface MealWithDetails extends Meal {
  foods: Array<FoodItem & { nutrition: NutritionData }>;
}

export interface DailyStats {
  date: string;
  meals: MealWithDetails[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
}

export interface InflammationReport {
  period_start: string;
  period_end: string;
  total_meals: number;
  potential_triggers: Array<{
    food: string;
    occurrences: number;
    dates: string[];
  }>;
  patterns: {
    most_common_meal_type: string;
    average_meals_per_day: number;
  };
  recommendations: string[];
}
