-- MIGRAÇÃO #1: Criar tabela de restaurantes
-- Data: 16/10/2025
-- Feature: Local da refeição (casa/rua) + Restaurantes
-- Executar: MANUALMENTE no dashboard do Supabase

-- ⚠️ IMPORTANTE: Executar esta migração ANTES de implementar Feature #2

-- Tabela de restaurantes
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Índice para busca rápida por tenant
CREATE INDEX idx_restaurants_tenant_id ON restaurants(tenant_id);

-- Índice para autocomplete por nome
CREATE INDEX idx_restaurants_name ON restaurants(name);

COMMENT ON TABLE restaurants IS 'Cadastro de restaurantes para rastreamento de refeições externas';
COMMENT ON COLUMN restaurants.tenant_id IS 'ID do tenant (multi-tenancy)';
COMMENT ON COLUMN restaurants.name IS 'Nome do restaurante';
COMMENT ON COLUMN restaurants.address IS 'Endereço do restaurante (opcional)';
