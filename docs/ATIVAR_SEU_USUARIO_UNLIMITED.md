# 🚀 ATIVAR SEU USUÁRIO COMO UNLIMITED

**Problema resolvido:** O erro de constraint foi porque o banco não conhecia o valor `'unlimited'`.

---

## ✅ SOLUÇÃO COMPLETA EM 3 PASSOS

### PASSO 1: Aplicar Migration Completa

1. Abra **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole **TODO** o código abaixo:

```sql
-- 🔐 Migration: Adicionar plano UNLIMITED e status LIFETIME

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

-- Índice de performance
CREATE INDEX IF NOT EXISTS idx_users_lifetime_premium
  ON users(is_lifetime_premium)
  WHERE is_lifetime_premium = TRUE;
```

4. Clique em **RUN** (ou pressione Ctrl+Enter)

✅ **Esperado:** Mensagem de sucesso sem erros

---

### PASSO 2: Ativar SEU Usuário como UNLIMITED

No **SQL Editor**, cole:

```sql
UPDATE users
SET
  plan = 'unlimited',
  subscription_status = 'lifetime',
  subscription_started_at = NOW(),
  subscription_expires_at = NULL,
  is_lifetime_premium = TRUE
WHERE email = 'contato@edsonferreira.com';
```

⚠️ **TROQUE** `contato@edsonferreira.com` pelo SEU email!

✅ **Esperado:** `UPDATE 1` (1 linha atualizada)

---

### PASSO 3: Verificar se Funcionou

```sql
SELECT
  email,
  plan,
  subscription_status,
  is_lifetime_premium,
  subscription_started_at
FROM users
WHERE email = 'contato@edsonferreira.com';
```

✅ **Resultado esperado:**

| email | plan | subscription_status | is_lifetime_premium |
|-------|------|---------------------|---------------------|
| contato@... | unlimited | lifetime | true |

---

## 🧪 TESTAR NO APP

1. Faça **logout** do app
2. Limpe o **cache** do navegador (Ctrl+Shift+Delete)
3. Faça **login** novamente
4. Vá em `/capture` e tente adicionar uma **foto**
5. ✅ Deve funcionar sem limites!

---

## 🎁 DAR PREMIUM GRÁTIS PARA AMIGOS

Agora que a migration foi aplicada, você pode dar PREMIUM para outros:

### PREMIUM Vitalício (grátis para sempre):

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

### PREMIUM Trial (30 dias grátis):

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

## ❓ TROUBLESHOOTING

### Erro: "constraint violation" ao atualizar usuário

**Causa:** A migration do PASSO 1 não foi aplicada.

**Solução:** Volte ao PASSO 1 e execute a migration completa.

---

### Erro: "column is_lifetime_premium does not exist"

**Causa:** Parte da migration não foi executada.

**Solução:** Execute a migration completa do PASSO 1 novamente.

---

### Erro: Ainda aparece FREE no app

**Solução:**
1. Faça logout
2. Limpe cache (Ctrl+Shift+Delete → selecione "Cookies e cache")
3. Feche e abra o navegador
4. Faça login novamente

---

### Verificar quotas no banco:

```sql
SELECT
  u.email,
  u.plan,
  q.photo_analyses,
  q.ocr_analyses
FROM users u
LEFT JOIN usage_quotas q ON u.id = q.user_id
WHERE u.email = 'contato@edsonferreira.com';
```

---

## 📊 O QUE VOCÊ TEM AGORA

### Plano UNLIMITED:
- ✅ **999.999 análises de foto/mês** (ilimitado)
- ✅ **999.999 OCR de tabelas/mês** (ilimitado)
- ✅ Histórico ilimitado
- ✅ Coach IA
- ✅ Relatórios avançados
- ✅ Exportação de dados
- ✅ **NUNCA expira**
- ✅ **Sem custo algum**

---

## 📁 ARQUIVOS CRIADOS

```
✅ /migrations/016_add_unlimited_plan.sql           (migration completa)
✅ /scripts/activate-unlimited.sql                   (script de ativação)
✅ /scripts/grant-free-premium.sql                   (dar PREMIUM grátis)
✅ /docs/ATIVAR_SEU_USUARIO_UNLIMITED.md            (este arquivo)
```

---

## ✅ CHECKLIST

- [ ] Aplicou migration completa (PASSO 1)
- [ ] Atualizou seu usuário (PASSO 2)
- [ ] Verificou no banco (PASSO 3)
- [ ] Fez logout e login
- [ ] Testou análise de foto
- [ ] Funcionou! 🎉

---

**Se tudo funcionou, você está pronto!** 🚀

Próximos passos: Continuar para Fase 3 (UI e paywalls visuais).
