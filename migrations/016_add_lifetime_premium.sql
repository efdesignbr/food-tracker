-- 🎁 Migration: Adicionar suporte para PREMIUM grátis (lifetime/trial)
-- Data: 2025-10-25
-- Descrição: Permite oferecer PREMIUM vitalício ou trial para usuários específicos

-- Adicionar campo para marcar usuários com PREMIUM grátis
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_lifetime_premium BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN users.is_lifetime_premium IS
  'Indica se o usuário tem PREMIUM grátis (vitalício ou trial). Quando TRUE, não verifica Stripe.';

-- Índice para buscar usuários lifetime rapidamente
CREATE INDEX IF NOT EXISTS idx_users_lifetime_premium
  ON users(is_lifetime_premium)
  WHERE is_lifetime_premium = TRUE;

-- ✅ SEGURO: Não altera dados existentes (default FALSE)
