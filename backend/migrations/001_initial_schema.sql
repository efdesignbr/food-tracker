-- Migration: Initial Schema
-- Description: Creates core tables for food tracking MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (simplified for single user MVP)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    consumed_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Food items table
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Nutrition data table
CREATE TABLE IF NOT EXISTS nutrition_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    calories DECIMAL(10,2) NOT NULL DEFAULT 0,
    protein_g DECIMAL(10,2) NOT NULL DEFAULT 0,
    carbs_g DECIMAL(10,2) NOT NULL DEFAULT 0,
    fat_g DECIMAL(10,2) NOT NULL DEFAULT 0,
    fiber_g DECIMAL(10,2) NOT NULL DEFAULT 0,
    sodium_mg DECIMAL(10,2),
    sugar_g DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT nutrition_data_food_item_unique UNIQUE(food_item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meals_user_consumed ON meals(user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_consumed_date ON meals(user_id, DATE(consumed_at));
CREATE INDEX IF NOT EXISTS idx_food_items_meal_id ON food_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_data_food_item_id ON nutrition_data(food_item_id);

-- Insert default user for MVP (single user app)
INSERT INTO users (email, name)
VALUES ('user@foodtracker.local', 'Food Tracker User')
ON CONFLICT (email) DO NOTHING;
