-- Migration: Criar tabela de medidas corporais
-- Data: 2025-10-26
-- Objetivo: Rastrear medidas corporais do usuário ao longo do tempo
-- SEGURANÇA: Tabela nova, não afeta nada existente

CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Data e hora da medição
  measurement_date DATE NOT NULL,
  measurement_time TIME NOT NULL DEFAULT CURRENT_TIME,

  -- Medidas do tronco (em centímetros)
  waist DECIMAL(5,1), -- Cintura
  neck DECIMAL(5,1), -- Pescoço
  chest DECIMAL(5,1), -- Peitoral
  hips DECIMAL(5,1), -- Quadril

  -- Medidas dos membros (em centímetros)
  left_thigh DECIMAL(5,1), -- Coxa esquerda
  right_thigh DECIMAL(5,1), -- Coxa direita
  left_bicep DECIMAL(5,1), -- Bíceps esquerdo
  right_bicep DECIMAL(5,1), -- Bíceps direito
  left_calf DECIMAL(5,1), -- Panturrilha esquerda
  right_calf DECIMAL(5,1), -- Panturrilha direita

  -- Observações opcionais
  notes TEXT,

  -- Metadados
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Índices para performance
  CONSTRAINT body_measurements_tenant_user_fk
    FOREIGN KEY (tenant_id, user_id)
    REFERENCES users(tenant_id, id)
    ON DELETE CASCADE
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_body_measurements_user ON body_measurements(user_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_body_measurements_tenant ON body_measurements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(measurement_date DESC);

-- Comentários para documentação
COMMENT ON TABLE body_measurements IS 'Registro de medidas corporais do usuário ao longo do tempo';
COMMENT ON COLUMN body_measurements.waist IS 'Circunferência da cintura em centímetros';
COMMENT ON COLUMN body_measurements.neck IS 'Circunferência do pescoço em centímetros';
COMMENT ON COLUMN body_measurements.chest IS 'Circunferência do peitoral em centímetros';
COMMENT ON COLUMN body_measurements.hips IS 'Circunferência do quadril em centímetros';
COMMENT ON COLUMN body_measurements.left_thigh IS 'Circunferência da coxa esquerda em centímetros';
COMMENT ON COLUMN body_measurements.right_thigh IS 'Circunferência da coxa direita em centímetros';
COMMENT ON COLUMN body_measurements.left_bicep IS 'Circunferência do bíceps esquerdo em centímetros';
COMMENT ON COLUMN body_measurements.right_bicep IS 'Circunferência do bíceps direito em centímetros';
COMMENT ON COLUMN body_measurements.left_calf IS 'Circunferência da panturrilha esquerda em centímetros';
COMMENT ON COLUMN body_measurements.right_calf IS 'Circunferência da panturrilha direita em centímetros';
