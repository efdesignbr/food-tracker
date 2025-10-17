-- MIGRAÇÃO #3: Criar tabela food_bank (Banco de Alimentos)
-- Data: 16/10/2025
-- Feature: Banco de Alimentos com análise de IA
-- Executar: MANUALMENTE no dashboard do Supabase

-- ⚠️ IMPORTANTE: Executar esta migração ANTES de implementar Feature #3

-- Tabela de banco de alimentos
CREATE TABLE food_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  serving_size VARCHAR(100),
  photo_url TEXT,

  -- Informações nutricionais (por porção)
  calories DECIMAL(10,2),
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fat DECIMAL(10,2),
  fiber DECIMAL(10,2),
  sodium DECIMAL(10,2),
  sugar DECIMAL(10,2),
  saturated_fat DECIMAL(10,2),

  -- Controle de uso
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,

  -- Metadados
  source VARCHAR(50) DEFAULT 'manual', -- 'manual' ou 'ai_analyzed'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_food_bank_tenant_id ON food_bank(tenant_id);
CREATE INDEX idx_food_bank_user_id ON food_bank(user_id);
CREATE INDEX idx_food_bank_name ON food_bank(name);
CREATE INDEX idx_food_bank_usage_count ON food_bank(usage_count DESC);

-- Comentários
COMMENT ON TABLE food_bank IS 'Banco de alimentos frequentes com informações nutricionais';
COMMENT ON COLUMN food_bank.tenant_id IS 'ID do tenant (multi-tenancy)';
COMMENT ON COLUMN food_bank.user_id IS 'Usuário que cadastrou o alimento';
COMMENT ON COLUMN food_bank.name IS 'Nome do alimento';
COMMENT ON COLUMN food_bank.brand IS 'Marca do alimento (opcional)';
COMMENT ON COLUMN food_bank.serving_size IS 'Tamanho da porção (ex: 100g, 1 unidade)';
COMMENT ON COLUMN food_bank.photo_url IS 'URL da foto da tabela nutricional (opcional)';
COMMENT ON COLUMN food_bank.source IS 'Origem dos dados: manual ou ai_analyzed (tabela nutricional)';
COMMENT ON COLUMN food_bank.usage_count IS 'Contador de quantas vezes o alimento foi usado';
COMMENT ON COLUMN food_bank.last_used_at IS 'Data da última vez que o alimento foi usado';
