-- 🎁 Script: Oferecer PREMIUM grátis para usuários específicos
-- Data: 2025-10-25
-- Uso: Para dar PREMIUM vitalício ou trial para amigos/beta testers

-- ============================================================================
-- OPÇÃO 1: PREMIUM VITALÍCIO (grátis para sempre)
-- ============================================================================
-- Use para: Amigos, família, beta testers VIP

UPDATE users
SET
  plan = 'premium',
  subscription_status = 'lifetime',
  subscription_started_at = NOW(),
  subscription_expires_at = NULL, -- Nunca expira
  is_lifetime_premium = TRUE
WHERE email = 'amigo@exemplo.com'; -- ⬅️ TROCAR AQUI

-- Exemplo com múltiplos usuários de uma vez:
UPDATE users
SET
  plan = 'premium',
  subscription_status = 'lifetime',
  subscription_started_at = NOW(),
  subscription_expires_at = NULL,
  is_lifetime_premium = TRUE
WHERE email IN (
  'amigo1@exemplo.com',
  'amigo2@exemplo.com',
  'betaTester@exemplo.com'
);

-- ============================================================================
-- OPÇÃO 2: PREMIUM TRIAL (grátis por 30 dias)
-- ============================================================================
-- Use para: Testers temporários, promoções

UPDATE users
SET
  plan = 'premium',
  subscription_status = 'trial',
  subscription_started_at = NOW(),
  subscription_expires_at = NOW() + INTERVAL '30 days', -- Expira em 30 dias
  is_lifetime_premium = FALSE -- Vai expirar
WHERE email = 'tester@exemplo.com'; -- ⬅️ TROCAR AQUI

-- ============================================================================
-- VERIFICAR USUÁRIOS COM PREMIUM GRÁTIS
-- ============================================================================
SELECT
  id,
  email,
  plan,
  subscription_status,
  is_lifetime_premium,
  subscription_started_at,
  subscription_expires_at,
  CASE
    WHEN is_lifetime_premium = TRUE THEN '🎁 Vitalício'
    WHEN subscription_status = 'trial' THEN '⏱️ Trial'
    WHEN subscription_expires_at IS NOT NULL THEN
      CONCAT('Expira em: ', DATE(subscription_expires_at))
    ELSE '♾️ Sem expiração'
  END as status_descricao
FROM users
WHERE
  plan IN ('premium', 'unlimited')
  AND (
    is_lifetime_premium = TRUE
    OR subscription_status IN ('trial', 'lifetime')
  )
ORDER BY subscription_started_at DESC;

-- ============================================================================
-- REMOVER PREMIUM GRÁTIS (se necessário)
-- ============================================================================
-- Volta o usuário para FREE

UPDATE users
SET
  plan = 'free',
  subscription_status = 'expired',
  subscription_expires_at = NOW(),
  is_lifetime_premium = FALSE
WHERE email = 'usuario@exemplo.com'; -- ⬅️ TROCAR AQUI

-- ============================================================================
-- ESTATÍSTICAS
-- ============================================================================
SELECT
  plan,
  subscription_status,
  is_lifetime_premium,
  COUNT(*) as total_usuarios
FROM users
GROUP BY plan, subscription_status, is_lifetime_premium
ORDER BY plan, subscription_status;
