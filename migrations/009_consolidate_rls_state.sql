-- =============================================================================
-- Migration 009: Consolidação do Estado de RLS (Row Level Security)
-- =============================================================================
-- Data: 2025-10-09
-- Autor: Dev Team
-- Tipo: Documentação
--
-- OBJETIVO:
-- Esta migration documenta o estado final do RLS após as migrations anteriores
-- e explica as decisões arquiteturais tomadas.
--
-- HISTÓRICO DE RLS:
-- - Migration 004: Desabilitou RLS inicialmente
-- - Migration 005: Habilitou RLS e criou policies
-- - Migration 008: Removeu todas as policies e desabilitou RLS definitivamente
--
-- ESTADO ATUAL (consolidado):
-- - RLS está DESABILITADO em todas as tabelas
-- - Isolamento multi-tenant é feito via application-level
-- - tenant_id é sempre verificado nas queries da aplicação
--
-- DECISÃO ARQUITETURAL:
-- Optamos por desabilitar RLS devido a:
-- 1. Complexidade na gestão de session variables (app.tenant_id)
-- 2. Dificuldade em debugging quando policies bloqueiam operações
-- 3. Melhor controle via application-level usando repositórios
-- 4. Maior flexibilidade para operações administrativas
--
-- SEGURANÇA:
-- O isolamento multi-tenant é garantido por:
-- 1. Todas as queries incluem WHERE tenant_id = $1
-- 2. Middleware de autenticação valida tenant em cada request
-- 3. Foreign keys garantem integridade referencial
-- 4. Indexes otimizam queries filtradas por tenant_id
--
-- TABELAS AFETADAS:
-- - tenants (RLS desabilitado)
-- - users (RLS desabilitado)
-- - meals (RLS desabilitado)
-- - food_items (RLS desabilitado)
-- - nutrition_data (RLS desabilitado)
--
-- =============================================================================

-- Verificação: Confirma que RLS está desabilitado (não faz alterações)
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  -- Verifica se RLS está desabilitado em todas as tabelas críticas
  SELECT bool_or(relrowsecurity) INTO rls_enabled
  FROM pg_class
  WHERE relname IN ('tenants', 'users', 'meals', 'food_items', 'nutrition_data');

  IF rls_enabled THEN
    RAISE WARNING 'RLS está habilitado em uma ou mais tabelas. Estado inconsistente com decisão arquitetural.';
  ELSE
    RAISE NOTICE 'Estado de RLS confirmado: DESABILITADO em todas as tabelas (conforme esperado)';
  END IF;
END $$;

-- Esta migration não faz alterações no schema.
-- Serve apenas como documentação e checkpoint do estado atual.
