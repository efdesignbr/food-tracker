-- MIGRAÇÃO #2: Adicionar campos de localização na tabela meals
-- Data: 16/10/2025
-- Feature: Local da refeição (casa/rua) + Restaurantes
-- Executar: MANUALMENTE no dashboard do Supabase

-- ⚠️ IMPORTANTE:
-- 1. Executar MIGRAÇÃO #1 primeiro (001_create_restaurants.sql)
-- 2. Executar esta migração ANTES de implementar Feature #2

-- Adicionar campos de localização na tabela meals
ALTER TABLE meals
  ADD COLUMN location_type VARCHAR(10) CHECK (location_type IN ('home', 'out')),
  ADD COLUMN restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL;

-- Índice para filtrar por tipo de local
CREATE INDEX idx_meals_location_type ON meals(location_type);

-- Índice para buscar refeições por restaurante
CREATE INDEX idx_meals_restaurant_id ON meals(restaurant_id);

COMMENT ON COLUMN meals.location_type IS 'Tipo de local: home (em casa) ou out (fora de casa)';
COMMENT ON COLUMN meals.restaurant_id IS 'Referência ao restaurante se location_type = out';
