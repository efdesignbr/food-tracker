-- Migration: Adicionar campos de assinatura na tabela users
-- Data: 2025-10-25
-- Objetivo: Suportar planos FREE e PREMIUM por usuário
-- SEGURANÇA: Usa ADD COLUMN IF NOT EXISTS para não quebrar nada existente

-- Adiciona campos de assinatura na tabela users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'premium')),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'canceled', 'expired', 'trial')),
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100);

-- Índices para performance (cria apenas se não existir)
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires ON users(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- Comentários para documentação
COMMENT ON COLUMN users.plan IS 'Plano do usuário: free ou premium (user-level, não tenant-level)';
COMMENT ON COLUMN users.subscription_status IS 'Status da assinatura: active, canceled, expired, trial';
COMMENT ON COLUMN users.subscription_started_at IS 'Data de início da assinatura premium (null para free)';
COMMENT ON COLUMN users.subscription_expires_at IS 'Data de expiração da assinatura (null = ilimitado para free)';
COMMENT ON COLUMN users.stripe_customer_id IS 'ID do cliente no Stripe (futuro)';
COMMENT ON COLUMN users.stripe_subscription_id IS 'ID da assinatura no Stripe (futuro)';
