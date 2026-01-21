-- Migration 011: Add User Preferences (phone + daily goals)
-- Date: 2025-10-09
-- Purpose: Allow users to customize their profile and daily nutritional goals

-- Add phone field for contact
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add daily nutritional goals (defaults based on standard 2000 kcal diet)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS goal_calories INT DEFAULT 2000 CHECK (goal_calories > 0 AND goal_calories <= 10000),
  ADD COLUMN IF NOT EXISTS goal_protein_g INT DEFAULT 150 CHECK (goal_protein_g > 0 AND goal_protein_g <= 500),
  ADD COLUMN IF NOT EXISTS goal_carbs_g INT DEFAULT 250 CHECK (goal_carbs_g > 0 AND goal_carbs_g <= 1000),
  ADD COLUMN IF NOT EXISTS goal_fat_g INT DEFAULT 65 CHECK (goal_fat_g > 0 AND goal_fat_g <= 300);

-- Comment for documentation
COMMENT ON COLUMN users.phone IS 'User contact phone number (optional)';
COMMENT ON COLUMN users.goal_calories IS 'Daily calorie goal in kcal (default: 2000)';
COMMENT ON COLUMN users.goal_protein_g IS 'Daily protein goal in grams (default: 150)';
COMMENT ON COLUMN users.goal_carbs_g IS 'Daily carbohydrate goal in grams (default: 250)';
COMMENT ON COLUMN users.goal_fat_g IS 'Daily fat goal in grams (default: 65)';
