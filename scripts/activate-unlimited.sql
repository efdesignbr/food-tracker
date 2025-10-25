-- 🔐 Script: Ativar usuário como UNLIMITED (sem limites)
-- Data: 2025-10-25
-- Uso: Apenas para o owner/admin do sistema

-- ============================================================================
-- PASSO 1: Aplicar migration 016 COMPLETA (OBRIGATÓRIO!)
-- ============================================================================
-- IMPORTANTE: Cole TODO o conteúdo de migrations/016_add_unlimited_plan.sql
-- no Supabase SQL Editor e execute PRIMEIRO.
--
-- A migration atualiza as constraints de CHECK para aceitar:
-- - plan: 'unlimited'
-- - subscription_status: 'lifetime'
--
-- SEM essa migration, o UPDATE abaixo vai dar erro!

-- ============================================================================
-- PASSO 2: Ativar SEU usuário como UNLIMITED
-- ============================================================================
-- ⚠️ IMPORTANTE: Substitua 'seu-email@exemplo.com' pelo seu email real!

UPDATE users
SET
  plan = 'unlimited',
  subscription_status = 'lifetime',
  subscription_started_at = NOW(),
  subscription_expires_at = NULL, -- Nunca expira
  is_lifetime_premium = TRUE
WHERE email = 'seu-email@exemplo.com'; -- ⬅️ TROCAR AQUI

-- Verificar se foi ativado:
SELECT
  id,
  email,
  plan,
  subscription_status,
  is_lifetime_premium,
  subscription_started_at
FROM users
WHERE email = 'seu-email@exemplo.com'; -- ⬅️ TROCAR AQUI

-- ✅ Esperado:
-- plan = 'unlimited'
-- subscription_status = 'lifetime'
-- is_lifetime_premium = TRUE

-- ============================================================================
-- RESULTADO
-- ============================================================================
-- Agora você tem:
-- ✅ Análises de foto ILIMITADAS (999999/mês)
-- ✅ OCR de tabelas ILIMITADO (999999/mês)
-- ✅ Todos recursos PREMIUM
-- ✅ Sem necessidade de pagamento
-- ✅ Nunca expira
