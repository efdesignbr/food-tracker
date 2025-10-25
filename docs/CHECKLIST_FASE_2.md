# ✅ Checklist: Fase 2 - Paywalls nos Endpoints

**Objetivo:** Proteger endpoints de recursos premium sem quebrar nada

---

## 📋 PRÉ-REQUISITOS

- [x] Fase 1 concluída (infraestrutura)
- [x] Migrations aplicadas no Supabase
- [x] Testes passaram (`npm run test:subscriptions`)
- [x] Código funcionando normalmente

---

## 🎯 FASE 2.1: Endpoint de Análise de Foto

### Arquivo: `/app/api/meals/analyze-meal/route.ts`

**Modificações necessárias:**

1. [ ] Importar funções de quota
```typescript
import { checkQuota, incrementQuota } from '@/lib/quota';
import { PLAN_LIMITS } from '@/lib/constants';
```

2. [ ] Buscar plano do usuário
```typescript
// Após auth/requireTenant
const { rows: userData } = await pool.query(
  'SELECT plan FROM users WHERE id = $1',
  [session.userId]
);
const userPlan = userData[0]?.plan || 'free';
```

3. [ ] Verificar se tem foto na request
```typescript
if (image) {
  // Tem foto → verificar quota
}
```

4. [ ] Bloquear FREE
```typescript
if (userPlan === 'free') {
  return Response.json(
    {
      error: 'upgrade_required',
      message: 'Análise de foto é um recurso PREMIUM',
      feature: 'photo_analysis',
      currentPlan: 'free',
      upgradeTo: 'premium'
    },
    { status: 403 }
  );
}
```

5. [ ] Verificar quota PREMIUM
```typescript
const quota = await checkQuota(userId, tenantId, userPlan, 'photo');

if (!quota.allowed) {
  return Response.json(
    {
      error: 'quota_exceeded',
      message: `Você atingiu o limite de ${quota.limit} análises de foto este mês`,
      used: quota.used,
      limit: quota.limit,
      remaining: 0,
      resetDate: /* calcular próximo dia 1º */
    },
    { status: 429 }
  );
}
```

6. [ ] Processar foto normalmente (código existente)

7. [ ] Incrementar quota APÓS sucesso
```typescript
// Só incrementa se processou com sucesso
if (userPlan === 'premium' && imageWasProcessed) {
  await incrementQuota(userId, tenantId, 'photo');
}
```

8. [ ] Testar manualmente
```bash
# 1. Testar com usuário FREE → deve retornar 403
# 2. Ativar PREMIUM via SQL
# 3. Testar com PREMIUM → deve funcionar
# 4. Usar 90 vezes → 91ª deve retornar 429
```

---

## 🎯 FASE 2.2: Endpoint de Análise de Imagem

### Arquivo: `/app/api/meals/analyze-image/route.ts`

**Mesmo padrão acima:**

1. [ ] Importar funções
2. [ ] Buscar plano do usuário
3. [ ] Bloquear FREE (403)
4. [ ] Verificar quota PREMIUM
5. [ ] Processar imagem
6. [ ] Incrementar quota após sucesso
7. [ ] Testar

---

## 🎯 FASE 2.3: Endpoint de OCR de Tabelas

### Arquivo: `/app/api/food-bank/analyze-label/route.ts` (ou similar)

**Mesmo padrão, mas quota type = 'ocr':**

1. [ ] Importar funções
2. [ ] Buscar plano do usuário
3. [ ] Bloquear FREE (403)
4. [ ] Verificar quota PREMIUM (tipo 'ocr', limite 30/mês)
5. [ ] Processar tabela
6. [ ] Incrementar quota tipo 'ocr' após sucesso
7. [ ] Testar

---

## 🧪 TESTES OBRIGATÓRIOS

### Para cada endpoint modificado:

1. [ ] **Usuário FREE tenta usar foto**
   - Espera: 403 com mensagem clara
   - Body deve ter: `error: 'upgrade_required'`

2. [ ] **Usuário PREMIUM com quota disponível**
   - Espera: 200 com resposta normal
   - Quota deve incrementar (verificar no banco)

3. [ ] **Usuário PREMIUM com quota esgotada**
   - Espera: 429 com mensagem de limite
   - Body deve ter: `error: 'quota_exceeded'`, `used`, `limit`

4. [ ] **Análise de texto sem foto (ambos planos)**
   - Espera: 200 normal
   - Não deve verificar quota (texto é grátis)

---

## 🛡️ SEGURANÇA

### Verificações antes de cada commit:

- [ ] App roda sem erros (`npm run dev`)
- [ ] Build passa (`npm run build`)
- [ ] Testes de quota passam (`npm run test:subscriptions`)
- [ ] Endpoints SEM foto ainda funcionam (FREE pode usar)
- [ ] Endpoints COM foto bloqueiam FREE
- [ ] PREMIUM consegue usar até quota

---

## 📊 VALIDAÇÃO FINAL

```bash
# 1. Rodar testes
npm run test:subscriptions

# 2. Dev local
npm run dev

# 3. Testar manualmente:
# - Login como FREE
# - Tentar adicionar foto → deve mostrar erro/paywall
# - Adicionar alimento manualmente → deve funcionar

# 4. Ativar PREMIUM via SQL:
UPDATE users
SET plan = 'premium',
    subscription_status = 'active',
    subscription_started_at = NOW()
WHERE email = 'seu-email@exemplo.com';

# 5. Testar novamente:
# - Adicionar foto → deve funcionar
# - Ver contador de quota

# 6. Verificar quota no banco:
SELECT * FROM usage_quotas
WHERE user_id = (SELECT id FROM users WHERE email = 'seu-email@exemplo.com');
```

---

## ⚠️ ROLLBACK RÁPIDO

Se algo quebrar, reverter o endpoint:

```typescript
// Remover:
// - Imports de quota
// - Verificação de plano
// - checkQuota()
// - incrementQuota()

// Voltar ao código original
```

**OU:** Fazer commit antes de cada mudança para poder reverter via git.

---

## ✅ CRITÉRIOS DE SUCESSO

Fase 2 está completa quando:

- [x] FREE não consegue usar fotos (403)
- [x] PREMIUM consegue usar fotos (até quota)
- [x] Quota incrementa corretamente
- [x] Quota bloqueia após limite (429)
- [x] Análise de texto continua funcionando para todos
- [x] App não quebrou nada existente
- [x] Testes passam
- [x] Build passa

---

## 🚀 PRÓXIMA FASE

Após Fase 2 completa → **Fase 3: UI e Paywalls**

1. Modificar `/app/capture/page.tsx`
2. Criar componente `<Paywall />`
3. Criar componente `<QuotaCard />`
4. Criar página `/app/upgrade/page.tsx`

---

**Criado:** 2025-10-25 23:20
**Para usar em:** Nova conversa (após compactação)
