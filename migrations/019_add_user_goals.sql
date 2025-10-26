-- Migration: Adicionar objetivos e metas do usuário
-- Data: 2025-10-26
-- Objetivo: Permitir que usuário defina meta (perder/ganhar/manter peso) e dados pessoais

-- Adicionar campos de objetivos e dados pessoais
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_goal_kg DECIMAL(4,2);

-- Comentários
COMMENT ON COLUMN users.goal_type IS 'Objetivo: lose_weight (emagrecer), gain_weight (ganhar peso), maintain_weight (manter peso)';
COMMENT ON COLUMN users.height_cm IS 'Altura em centímetros';
COMMENT ON COLUMN users.age IS 'Idade em anos';
COMMENT ON COLUMN users.gender IS 'Gênero: male, female, other';
COMMENT ON COLUMN users.activity_level IS 'Nível de atividade: sedentary, light, moderate, active, very_active';
COMMENT ON COLUMN users.target_weight_kg IS 'Peso alvo em kg';
COMMENT ON COLUMN users.weekly_goal_kg IS 'Meta de ganho/perda semanal em kg (ex: -0.5 para perder 500g/semana)';

-- Índice para queries por objetivo
CREATE INDEX IF NOT EXISTS idx_users_goal_type ON users(goal_type);
