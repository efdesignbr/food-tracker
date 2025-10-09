-- Migration 012: Water intake tracking
-- Date: 2025-10-09
-- Purpose: Track daily water consumption for hydration monitoring

-- Create water_intake table
CREATE TABLE IF NOT EXISTS water_intake (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Dados da ingestão
  amount_ml INT NOT NULL DEFAULT 250,
  consumed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Nota opcional (ex: "com limão", "gelada")
  notes TEXT,

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes para queries rápidas (por usuário e data)
CREATE INDEX IF NOT EXISTS idx_water_intake_user_id ON water_intake(user_id);
CREATE INDEX IF NOT EXISTS idx_water_intake_tenant_id ON water_intake(tenant_id);
CREATE INDEX IF NOT EXISTS idx_water_intake_consumed_at ON water_intake(consumed_at);
CREATE INDEX IF NOT EXISTS idx_water_intake_user_consumed ON water_intake(user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_intake_user_date ON water_intake(user_id, DATE(consumed_at));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_water_intake_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS water_intake_updated_at ON water_intake;
CREATE TRIGGER water_intake_updated_at
  BEFORE UPDATE ON water_intake
  FOR EACH ROW
  EXECUTE FUNCTION update_water_intake_updated_at();

-- Adicionar meta de água na tabela de usuários
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS goal_water_ml INT DEFAULT 2000;

-- Comentários
COMMENT ON TABLE water_intake IS 'Registros de ingestão de água por usuário - zera a cada dia';
COMMENT ON COLUMN water_intake.amount_ml IS 'Quantidade em mililitros (padrão 250ml = 1 copo)';
COMMENT ON COLUMN water_intake.consumed_at IS 'Data/hora da ingestão';
COMMENT ON COLUMN water_intake.notes IS 'Notas opcionais sobre a ingestão';
COMMENT ON COLUMN users.goal_water_ml IS 'Meta diária de água em ml (padrão 2000ml = 8 copos)';
