# 🔐 Como ativar seu usuário como UNLIMITED

**Objetivo:** Deixar seu usuário sem limite algum e poder oferecer PREMIUM grátis para outras pessoas.

---

## 📋 PASSO A PASSO

### 1. Aplicar Migration no Supabase

⚠️ **IMPORTANTE:** A migration atualiza as constraints de CHECK para aceitar os novos valores.

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole o conteúdo **COMPLETO** de `/migrations/016_add_unlimited_plan.sql`
4. Clique em **Run**

**Ou copie este SQL completo:**

```sql
-- Remover constraint antiga de PLAN
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_plan_check;

-- Adicionar nova constraint de PLAN (aceita 'unlimited')
ALTER TABLE users
  ADD CONSTRAINT users_plan_check
  CHECK (plan IN ('free', 'premium', 'unlimited'));

-- Remover constraint antiga de SUBSCRIPTION_STATUS
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_subscription_status_check;

-- Adicionar nova constraint de STATUS (aceita 'lifetime')
ALTER TABLE users
  ADD CONSTRAINT users_subscription_status_check
  CHECK (subscription_status IN ('active', 'canceled', 'expired', 'trial', 'lifetime'));

-- Adicionar campo para PREMIUM grátis
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_lifetime_premium BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.is_lifetime_premium IS
  'Indica se o usuário tem PREMIUM grátis (vitalício ou trial). Quando TRUE, não verifica Stripe.';

CREATE INDEX IF NOT EXISTS idx_users_lifetime_premium
  ON users(is_lifetime_premium)
  WHERE is_lifetime_premium = TRUE;
```

---

### 2. Ativar SEU usuário como UNLIMITED

No **SQL Editor** do Supabase:

```sql
UPDATE users
SET
  plan = 'unlimited',
  subscription_status = 'lifetime',
  subscription_started_at = NOW(),
  subscription_expires_at = NULL,
  is_lifetime_premium = TRUE
WHERE email = 'SEU-EMAIL-AQUI@exemplo.com';
```

**⚠️ IMPORTANTE:** Troque `SEU-EMAIL-AQUI@exemplo.com` pelo email que você usa no app!

---

### 3. Verificar se funcionou

```sql
SELECT
  id,
  email,
  plan,
  subscription_status,
  is_lifetime_premium
FROM users
WHERE email = 'SEU-EMAIL-AQUI@exemplo.com';
```

**Resultado esperado:**
- `plan = 'unlimited'`
- `subscription_status = 'lifetime'`
- `is_lifetime_premium = TRUE`

---

### 4. Fazer logout e login novamente

1. No app, faça **logout**
2. Faça **login** novamente
3. Agora você tem acesso ILIMITADO a tudo!

---

## 🎁 Como dar PREMIUM grátis para outras pessoas

### Opção 1: PREMIUM Vitalício (grátis para sempre)

```sql
UPDATE users
SET
  plan = 'premium',
  subscription_status = 'lifetime',
  subscription_started_at = NOW(),
  subscription_expires_at = NULL,
  is_lifetime_premium = TRUE
WHERE email = 'amigo@exemplo.com';
```

**Para múltiplos usuários:**

```sql
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
  'tester@exemplo.com'
);
```

---

### Opção 2: PREMIUM Trial (30 dias grátis)

```sql
UPDATE users
SET
  plan = 'premium',
  subscription_status = 'trial',
  subscription_started_at = NOW(),
  subscription_expires_at = NOW() + INTERVAL '30 days',
  is_lifetime_premium = FALSE
WHERE email = 'tester@exemplo.com';
```

---

## 📊 Ver todos usuários com PREMIUM grátis

```sql
SELECT
  email,
  plan,
  subscription_status,
  is_lifetime_premium,
  subscription_expires_at,
  CASE
    WHEN is_lifetime_premium = TRUE THEN '🎁 Vitalício'
    WHEN subscription_status = 'trial' THEN '⏱️ Trial'
    ELSE '💳 Pago'
  END as tipo
FROM users
WHERE plan IN ('premium', 'unlimited')
ORDER BY subscription_started_at DESC;
```

---

## ❌ Remover PREMIUM grátis (voltar para FREE)

```sql
UPDATE users
SET
  plan = 'free',
  subscription_status = 'expired',
  subscription_expires_at = NOW(),
  is_lifetime_premium = FALSE
WHERE email = 'usuario@exemplo.com';
```

---

## 🎯 O QUE VOCÊ TEM AGORA

### Plano UNLIMITED (seu usuário):
- ✅ **999.999 análises de foto/mês** (ilimitado)
- ✅ **999.999 análises OCR/mês** (ilimitado)
- ✅ Histórico ilimitado
- ✅ Coach IA
- ✅ Relatórios avançados
- ✅ Exportação de dados
- ✅ **NUNCA expira**
- ✅ **Sem custo algum**

### Diferença entre planos:

| Recurso | FREE | PREMIUM | UNLIMITED |
|---------|------|---------|-----------|
| Análise de foto | ❌ 0/mês | ✅ 90/mês | ✅ Ilimitado |
| OCR tabelas | ❌ 0/mês | ✅ 30/mês | ✅ Ilimitado |
| Histórico | 30 dias | Ilimitado | Ilimitado |
| Coach IA | ❌ | ✅ | ✅ |
| Relatórios | ❌ | ✅ | ✅ |

---

## 🔍 TROUBLESHOOTING

### Problema: Ainda aparece FREE no app

**Solução:**
1. Faça logout
2. Limpe cache do navegador (Ctrl+Shift+Delete)
3. Faça login novamente

### Problema: Erro ao aplicar migration

**Solução:**
- Se o erro for "column already exists", está tudo certo! A coluna já foi criada.
- Apenas pule para o passo 2 (ativar seu usuário)

### Problema: Não encontro meu email no banco

**Solução:**
```sql
-- Ver todos usuários
SELECT id, email, plan FROM users;
```

---

## 📁 ARQUIVOS RELACIONADOS

- `/migrations/016_add_lifetime_premium.sql` - Migration do campo
- `/scripts/activate-unlimited.sql` - Script para ativar UNLIMITED
- `/scripts/grant-free-premium.sql` - Script para dar PREMIUM grátis
- `/lib/types/subscription.ts` - Types atualizados
- `/lib/constants.ts` - Limites dos planos
- `/lib/quota.ts` - Função de verificação de quota

---

## ✅ CHECKLIST

- [ ] Aplicou migration 016
- [ ] Atualizou seu usuário para UNLIMITED
- [ ] Fez logout e login
- [ ] Testou análise de foto (deve funcionar)
- [ ] Verificou quota no banco (deve ter limit = 999999)

---

**Criado:** 2025-10-25
**Versão:** 1.0
**Autor:** Claude + Edson
