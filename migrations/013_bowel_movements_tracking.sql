-- Migration 013: Bowel movements tracking
-- Date: 2025-10-14
-- Purpose: Track bowel movements for intestinal inflammation monitoring

-- Create bowel_movements table
CREATE TABLE IF NOT EXISTS bowel_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Dados do movimento intestinal
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Bristol Stool Scale (1-7)
  -- 1: Pedaços duros separados (constipação severa)
  -- 2: Formato de salsicha mas irregular (constipação leve)
  -- 3: Formato de salsicha com rachaduras na superfície (normal)
  -- 4: Formato de salsicha, liso e macio (ideal/normal)
  -- 5: Pedaços macios com bordas bem definidas (falta de fibras)
  -- 6: Pedaços moles com bordas irregulares (diarreia leve)
  -- 7: Aquoso, sem pedaços sólidos (diarreia severa)
  bristol_type INT NOT NULL CHECK (bristol_type BETWEEN 1 AND 7),

  -- Notas opcionais (dor, urgência, sangue, cor anormal, etc)
  notes TEXT,

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes para queries rápidas (por usuário e data)
CREATE INDEX IF NOT EXISTS idx_bowel_movements_user_id ON bowel_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_bowel_movements_tenant_id ON bowel_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bowel_movements_occurred_at ON bowel_movements(occurred_at);
CREATE INDEX IF NOT EXISTS idx_bowel_movements_user_occurred ON bowel_movements(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_bowel_movements_user_date ON bowel_movements(user_id, DATE(occurred_at));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_bowel_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bowel_movements_updated_at ON bowel_movements;
CREATE TRIGGER bowel_movements_updated_at
  BEFORE UPDATE ON bowel_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_bowel_movements_updated_at();

-- Comentários
COMMENT ON TABLE bowel_movements IS 'Registros de evacuações para monitoramento de inflamação intestinal';
COMMENT ON COLUMN bowel_movements.occurred_at IS 'Data/hora da evacuação';
COMMENT ON COLUMN bowel_movements.bristol_type IS 'Tipo de fezes segundo Escala de Bristol (1-7)';
COMMENT ON COLUMN bowel_movements.notes IS 'Notas opcionais (dor, urgência, sangue, etc)';
