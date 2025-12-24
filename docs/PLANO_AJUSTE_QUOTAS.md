# Plano de Ajuste de Quotas

**Data:** 2025-12-24
**Objetivo:** Liberar 15 análises gráficas (foto + OCR) por mês para todos os planos
**Regra especial:** UNLIMITED mantém sem limite

---

## Contexto

### Situação Atual
| Plano | Foto/mês | OCR/mês | Bloqueio |
|-------|----------|---------|----------|
| FREE | 0 | 0 | Bloqueado no backend e frontend |
| PREMIUM | 90 | 30 | Liberado com quota |
| UNLIMITED | 999999 | 999999 | Sem limite |

### Situação Desejada
| Plano | Foto/mês | OCR/mês | Bloqueio |
|-------|----------|---------|----------|
| FREE | 15 | 15 | Liberado com quota |
| PREMIUM | 15 | 15 | Liberado com quota |
| UNLIMITED | 999999 | 999999 | Sem limite |

---

## Arquivos Afetados

1. `lib/constants.ts` - Definição das quotas
2. `lib/quota.ts` - Lógica de verificação de quota
3. `app/api/meals/analyze-image/route.ts` - API de análise de foto
4. `app/api/meals/analyze-meal/route.ts` - API de análise de refeição
5. `app/api/food-bank/analyze-label/route.ts` - API de OCR
6. `app/capture/page.tsx` - Frontend de captura
7. `app/meus-alimentos/page.tsx` - Frontend de meus alimentos

---

## Passos de Implementação

### Passo 1: Alterar Quotas em `lib/constants.ts`

**Arquivo:** `lib/constants.ts`

**Alteração:**
```typescript
// ANTES
free: {
  photo_analyses_per_month: 0,
  ocr_analyses_per_month: 0,
  // ...
}

// DEPOIS
free: {
  photo_analyses_per_month: 15,
  ocr_analyses_per_month: 15,
  // ...
}
```

**Também ajustar PREMIUM:**
```typescript
// ANTES
premium: {
  photo_analyses_per_month: 90,
  ocr_analyses_per_month: 30,
  // ...
}

// DEPOIS
premium: {
  photo_analyses_per_month: 15,
  ocr_analyses_per_month: 15,
  // ...
}
```

**Validação:**
1. Executar `npm run build`
2. Verificar se compila sem erros

**Status:** [ ] Pendente

---

### Passo 2: Ajustar `lib/quota.ts`

**Arquivo:** `lib/quota.ts`

**Alteração:** Remover bloqueio de FREE na função `checkQuota` (linhas 86-93)

```typescript
// ANTES
export async function checkQuota(...) {
  // FREE não tem acesso a recursos visuais
  if (plan === 'free') {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      remaining: 0,
    };
  }
  // ... resto do código
}

// DEPOIS
export async function checkQuota(...) {
  // UNLIMITED: sempre permite
  if (plan === 'unlimited') {
    // ... código existente
  }

  // FREE e PREMIUM: verifica quota baseado no plano
  const limits = PLAN_LIMITS[plan];
  // ... resto do código
}
```

**Validação:**
1. Executar `npm run build`
2. Iniciar localhost: `npm run dev`
3. Logar com usuário FREE
4. Verificar se consegue acessar a tela de captura

**Status:** [ ] Pendente

---

### Passo 3: Ajustar API `analyze-image`

**Arquivo:** `app/api/meals/analyze-image/route.ts`

**Alterações:**

1. Remover bloqueio de FREE (linhas 62-74):
```typescript
// REMOVER este bloco:
if (userPlan === 'free') {
  return NextResponse.json({
    error: 'upgrade_required',
    // ...
  }, { status: 403 });
}
```

2. Ajustar incremento de quota (linha 107):
```typescript
// ANTES
if (userPlan === 'premium') {
  await incrementQuota(session.userId, tenant.id, 'photo');
}

// DEPOIS
if (userPlan !== 'unlimited') {
  await incrementQuota(session.userId, tenant.id, 'photo');
}
```

**Validação:**
1. Executar `npm run build`
2. Iniciar localhost: `npm run dev`
3. Logar com usuário FREE
4. Tentar analisar uma foto de refeição
5. Verificar se a análise funciona
6. Verificar se a quota foi incrementada no banco

**Status:** [ ] Pendente

---

### Passo 4: Ajustar API `analyze-meal`

**Arquivo:** `app/api/meals/analyze-meal/route.ts`

**Alterações:**

1. Remover bloqueio de FREE (linhas 78-90):
```typescript
// REMOVER este bloco:
if (userPlan === 'free') {
  return NextResponse.json({
    error: 'upgrade_required',
    // ...
  }, { status: 403 });
}
```

2. Ajustar incremento de quota (linha 177):
```typescript
// ANTES
if (imageBase64 && userPlan === 'premium') {
  await incrementQuota(session.userId, tenant.id, 'photo');
}

// DEPOIS
if (imageBase64 && userPlan !== 'unlimited') {
  await incrementQuota(session.userId, tenant.id, 'photo');
}
```

**Validação:**
1. Executar `npm run build`
2. Iniciar localhost: `npm run dev`
3. Testar análise com lista de alimentos + foto opcional
4. Verificar se funciona para usuário FREE

**Status:** [ ] Pendente

---

### Passo 5: Ajustar API `analyze-label` (OCR)

**Arquivo:** `app/api/food-bank/analyze-label/route.ts`

**Alterações:**

1. Remover bloqueio de FREE (linhas 66-78):
```typescript
// REMOVER este bloco:
if (userPlan === 'free') {
  return NextResponse.json({
    error: 'upgrade_required',
    // ...
  }, { status: 403 });
}
```

2. Ajustar incremento de quota (linha 120):
```typescript
// ANTES
if (userPlan === 'premium') {
  await incrementQuota(session.userId, tenant.id, 'ocr');
}

// DEPOIS
if (userPlan !== 'unlimited') {
  await incrementQuota(session.userId, tenant.id, 'ocr');
}
```

**Validação:**
1. Executar `npm run build`
2. Iniciar localhost: `npm run dev`
3. Ir em "Meus Alimentos"
4. Tentar analisar um rótulo nutricional com usuário FREE
5. Verificar se funciona

**Status:** [ ] Pendente

---

### Passo 6: Ajustar Frontend `/capture`

**Arquivo:** `app/capture/page.tsx`

**Alterações:**

1. Remover bloqueio no `handleFileChange` (linhas 128-132):
```typescript
// REMOVER este bloco:
if (plan === 'free') {
  setShowPaywall(true);
  e.target.value = '';
  return;
}
```

2. Remover estilos condicionais de bloqueio (várias linhas):
   - Remover condicionais `plan === 'free' ? ... : ...` nos estilos
   - Simplificar para usar sempre os estilos de "liberado"

**Validação:**
1. Executar `npm run build`
2. Iniciar localhost: `npm run dev`
3. Acessar página de captura com usuário FREE
4. Verificar se o botão de foto aparece normal (não bloqueado)
5. Verificar se consegue selecionar foto

**Status:** [ ] Pendente

---

### Passo 7: Ajustar Frontend `/meus-alimentos`

**Arquivo:** `app/meus-alimentos/page.tsx`

**Alterações:**

1. Remover bloqueio no `handleAnalyzeImage` (linhas 168-172):
```typescript
// REMOVER este bloco:
if (plan === 'free') {
  setShowPaywall(true);
  return;
}
```

2. Remover bloqueio no botão "Analisar com IA" (linhas 408-411):
```typescript
// REMOVER esta condição:
if (plan === 'free' && !showAiForm) {
  setShowPaywall(true);
  return;
}
```

3. Simplificar estilos do botão (remover condicionais de FREE)

**Validação:**
1. Executar `npm run build`
2. Iniciar localhost: `npm run dev`
3. Acessar "Meus Alimentos" com usuário FREE
4. Verificar se botão "Analisar com IA" aparece verde (não amarelo)
5. Tentar analisar um rótulo

**Status:** [ ] Pendente

---

## Checklist Final

Após todos os passos:

- [ ] Build passa sem erros
- [ ] Usuário FREE consegue analisar foto de refeição
- [ ] Usuário FREE consegue analisar rótulo (OCR)
- [ ] Quota é incrementada corretamente para FREE
- [ ] Quota é incrementada corretamente para PREMIUM
- [ ] Usuário UNLIMITED não tem quota incrementada
- [ ] Quando quota atinge 15, mostra mensagem de limite
- [ ] UI não mostra mais bloqueios para FREE

---

## Rollback

Se algo der errado em qualquer passo:

```bash
git checkout -- <arquivo_alterado>
```

Ou para voltar tudo:

```bash
git reset --hard fd18d99
```

---

## Notas Importantes

1. **SEMPRE** testar no localhost antes de avançar para próximo passo
2. **NUNCA** fazer commit antes de validar que funciona
3. Fazer **UM passo de cada vez**
4. Se der erro, **parar e investigar** antes de continuar
