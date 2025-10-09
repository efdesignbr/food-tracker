-- =============================================================================
-- Migration 010: Allow NULL in meals.image_url
-- =============================================================================
-- Data: 2025-10-09
-- Tipo: Schema Change
--
-- OBJETIVO:
-- Permitir que o campo image_url seja NULL, pois imagens não são mais
-- armazenadas (decisão arquitetural para reduzir custos e melhorar performance)
--
-- CONTEXTO:
-- Imagens são usadas apenas para análise de IA, não para armazenamento permanente.
-- Isso reduz custos de storage, melhora performance e simplifica compliance com LGPD.
-- =============================================================================

-- Allow NULL values in image_url
ALTER TABLE meals
  ALTER COLUMN image_url DROP NOT NULL;

-- Add comment explaining the decision
COMMENT ON COLUMN meals.image_url IS 'Image URL (nullable). Images are not stored - used only for AI analysis';
