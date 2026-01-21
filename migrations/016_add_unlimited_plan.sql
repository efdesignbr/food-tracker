-- 🔐 Migration: Adicionar plano UNLIMITED e status LIFETIME
-- Data: 2025-10-25
-- Descrição: Permite plano unlimited (admin) e premium grátis (lifetime)

-- ============================================================================
-- PARTE 1: Atualizar constraint de PLAN para aceitar 'unlimited'
-- ============================================================================

-- Remover constraint antiga (que só aceita 'free' e 'premium')
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_plan_check;

-- Adicionar nova constraint (aceita 'free', 'premium' e 'unlimited')
ALTER TABLE users
  ADD CONSTRAINT users_plan_check
  CHECK (plan IN ('free', 'premium', 'unlimited'));

-- ============================================================================
-- PARTE 2: Atualizar constraint de SUBSCRIPTION_STATUS para aceitar 'lifetime'
-- ============================================================================

-- Remover constraint antiga
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_subscription_status_check;

-- Adicionar nova constraint (inclui 'lifetime')
ALTER TABLE users
  ADD CONSTRAINT users_subscription_status_check
  CHECK (subscription_status IN ('active', 'canceled', 'expired', 'trial', 'lifetime'));

-- ============================================================================
-- PARTE 3: Adicionar campo para PREMIUM grátis
-- ============================================================================

-- Adicionar campo para marcar usuários com PREMIUM grátis (vitalício ou trial)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_lifetime_premium BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN users.is_lifetime_premium IS
  'Indica se o usuário tem PREMIUM grátis (vitalício ou trial). Quando TRUE, não verifica Stripe.';

-- Índice para buscar usuários lifetime rapidamente
CREATE INDEX IF NOT EXISTS idx_users_lifetime_premium
  ON users(is_lifetime_premium)
  WHERE is_lifetime_premium = TRUE;

-- ============================================================================
-- ✅ PRONTO! Agora você pode:
-- ============================================================================
-- 1. Ativar usuários como 'unlimited'
-- 2. Dar subscription_status 'lifetime' para PREMIUM grátis
-- 3. Marcar is_lifetime_premium = TRUE para quem não paga
