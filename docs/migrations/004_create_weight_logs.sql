-- MIGRAÇÃO #4: Criar tabela weight_logs (Registro de Peso)
-- Data: 16/10/2025
-- Feature: Registro de peso diário
-- Executar: MANUALMENTE no dashboard do Supabase

-- ⚠️ IMPORTANTE: Executar esta migração ANTES de implementar Feature #5

-- Tabela de registro de peso
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight < 500),
  log_date DATE NOT NULL,
  log_time TIME DEFAULT CURRENT_TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),

  -- Um usuário pode ter múltiplos registros por dia (manhã/noite)
  UNIQUE(user_id, log_date, log_time, tenant_id)
);

-- Índices para performance
CREATE INDEX idx_weight_logs_tenant_id ON weight_logs(tenant_id);
CREATE INDEX idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX idx_weight_logs_date ON weight_logs(log_date DESC);

-- Comentários
COMMENT ON TABLE weight_logs IS 'Registro diário de peso dos usuários';
COMMENT ON COLUMN weight_logs.tenant_id IS 'ID do tenant (multi-tenancy)';
COMMENT ON COLUMN weight_logs.user_id IS 'Usuário que registrou o peso';
COMMENT ON COLUMN weight_logs.weight IS 'Peso em kg, limite entre 0 e 500kg';
COMMENT ON COLUMN weight_logs.log_date IS 'Data do registro';
COMMENT ON COLUMN weight_logs.log_time IS 'Hora do registro (permite múltiplos por dia)';
COMMENT ON COLUMN weight_logs.notes IS 'Observações sobre o registro (opcional)';
