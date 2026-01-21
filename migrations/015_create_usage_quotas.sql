-- Migration: Criar tabela de quotas de uso mensal
-- Data: 2025-10-25
-- Objetivo: Rastrear uso de recursos premium por usuário/mês
-- SEGURANÇA: Tabela nova, não afeta nada existente

-- Tabela para rastrear uso mensal de recursos premium
CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Formato: '2025-10' (YYYY-MM)

  -- Contadores de uso
  photo_analyses INTEGER NOT NULL DEFAULT 0,
  ocr_analyses INTEGER NOT NULL DEFAULT 0,

  -- Metadados
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Garante 1 registro por usuário por mês
  UNIQUE (user_id, month)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_month ON usage_quotas(user_id, month);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_tenant ON usage_quotas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_month ON usage_quotas(month);

-- Comentários para documentação
COMMENT ON TABLE usage_quotas IS 'Rastreamento de uso mensal de recursos premium por usuário';
COMMENT ON COLUMN usage_quotas.month IS 'Mês de referência no formato YYYY-MM';
COMMENT ON COLUMN usage_quotas.photo_analyses IS 'Quantidade de análises de foto de refeições usadas no mês';
COMMENT ON COLUMN usage_quotas.ocr_analyses IS 'Quantidade de análises de tabela nutricional (OCR) usadas no mês';
