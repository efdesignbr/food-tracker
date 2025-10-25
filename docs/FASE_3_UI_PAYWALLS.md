# 🎨 Fase 3: UI e Paywalls Visuais

**Data:** 2025-10-25
**Status:** 📋 PLANEJAMENTO
**Pré-requisito:** Fase 1 + Fase 2 concluídas ✅

---

## 🎯 OBJETIVO

Criar a interface visual para:
1. Mostrar paywalls para usuários FREE
2. Exibir contador de quota para PREMIUM
3. Criar página de upgrade/pricing
4. Adicionar indicadores de plano no app

---

## 📋 CHECKLIST GERAL

### Componentes a Criar
- [ ] `<PaywallModal />` - Modal de upgrade (FREE → PREMIUM)
- [ ] `<QuotaCard />` - Card com uso de quota (PREMIUM)
- [ ] `<PlanBadge />` - Badge mostrando plano atual
- [ ] `<UpgradeButton />` - Botão para fazer upgrade

### Páginas a Modificar
- [ ] `/app/capture/page.tsx` - Adicionar paywall e quota
- [ ] `/app/meus-alimentos/page.tsx` - Adicionar paywall no OCR
- [ ] `/app/account/page.tsx` - Mostrar plano atual

### Páginas a Criar
- [ ] `/app/upgrade/page.tsx` - Página de pricing/upgrade
- [ ] `/app/subscription/page.tsx` - Gerenciar assinatura (futuro)

### Hooks/Utils a Criar
- [ ] `useUserPlan()` - Hook para buscar plano do usuário
- [ ] `useQuota()` - Hook para buscar quota atual
- [ ] `lib/api/subscription.ts` - Funções de API

---

## 🧩 COMPONENTES DETALHADOS

### 1. `<PaywallModal />` - Modal de Upgrade

**Localização:** `/components/subscription/PaywallModal.tsx`

**Props:**
```typescript
interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'photo_analysis' | 'ocr_analysis';
  currentPlan: 'free' | 'premium' | 'unlimited';
}
```

**Design:**
```
╔════════════════════════════════════════╗
║  ✨ Recurso Premium                    ║
║  ────────────────────────────────────  ║
║  📸 Análise de Foto é exclusiva para   ║
║      usuários PREMIUM                  ║
║                                        ║
║  Com PREMIUM você tem:                 ║
║  ✓ 90 análises de foto/mês            ║
║  ✓ 30 análises de tabelas/mês         ║
║  ✓ Histórico ilimitado                ║
║                                        ║
║  [Ver Planos]  [Fechar]               ║
╚════════════════════════════════════════╝
```

**Comportamento:**
- Aparece quando FREE tenta usar recurso premium
- Botão "Ver Planos" → redireciona para `/upgrade`
- Pode ser fechado com X ou ESC

---

### 2. `<QuotaCard />` - Card de Uso de Quota

**Localização:** `/components/subscription/QuotaCard.tsx`

**Props:**
```typescript
interface QuotaCardProps {
  quotaType: 'photo' | 'ocr';
  used: number;
  limit: number;
  resetDate: Date;
}
```

**Design:**
```
┌────────────────────────────────────┐
│ 📸 Análise de Fotos                │
│ ──────────────────────────────────│
│ 45/90 usadas (50%)                 │
│ ████████████░░░░░░░░░░░░░         │
│                                    │
│ Restam: 45 análises                │
│ Renova em: 01/11/2025              │
└────────────────────────────────────┘
```

**Variações de cor:**
- 0-50%: Verde
- 51-80%: Amarelo
- 81-100%: Vermelho

**Comportamento:**
- Aparece no topo de páginas com recursos premium
- Atualiza em tempo real após uso
- Link para ver detalhes em `/subscription`

---

### 3. `<PlanBadge />` - Badge de Plano

**Localização:** `/components/subscription/PlanBadge.tsx`

**Props:**
```typescript
interface PlanBadgeProps {
  plan: 'free' | 'premium' | 'unlimited';
  size?: 'sm' | 'md' | 'lg';
}
```

**Design:**
```
FREE     → [FREE] (cinza)
PREMIUM  → [💎 PRO] (roxo/dourado)
UNLIMITED → [⭐ ADMIN] (azul)
```

**Onde usar:**
- Header do app (próximo ao nome do usuário)
- Página de configurações (`/account`)
- Página de upgrade (mostrar plano atual)

---

### 4. `<UpgradeButton />` - Botão de Upgrade

**Localização:** `/components/subscription/UpgradeButton.tsx`

**Props:**
```typescript
interface UpgradeButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  currentPlan: 'free' | 'premium' | 'unlimited';
}
```

**Comportamento:**
- Se FREE → "Fazer Upgrade"
- Se PREMIUM → "Gerenciar Assinatura"
- Se UNLIMITED → escondido ou "Admin"

---

## 📄 PÁGINAS A MODIFICAR

### 1. `/app/capture/page.tsx` - Adicionar Foto

**Modificações:**

```typescript
// 1. Buscar plano do usuário no load
const { plan, quota } = useUserPlan();

// 2. Mostrar QuotaCard se PREMIUM
{plan === 'premium' && (
  <QuotaCard
    quotaType="photo"
    used={quota.photo_analyses.used}
    limit={quota.photo_analyses.limit}
    resetDate={quota.resetDate}
  />
)}

// 3. Desabilitar upload de foto se FREE
<input
  type="file"
  disabled={plan === 'free'}
  onChange={handleImageUpload}
/>

// 4. Mostrar PaywallModal se FREE tentar usar
{showPaywall && (
  <PaywallModal
    isOpen={showPaywall}
    onClose={() => setShowPaywall(false)}
    feature="photo_analysis"
    currentPlan={plan}
  />
)}

// 5. Interceptar erro 403 da API
catch (error) {
  if (error.status === 403) {
    setShowPaywall(true);
  }
}
```

**Fluxo:**
1. Usuário FREE vê campo de foto **desabilitado**
2. Ao clicar, aparece tooltip: "Recurso Premium"
3. Ao clicar novamente, abre `<PaywallModal />`
4. PREMIUM vê `<QuotaCard />` no topo
5. Após 90 usos, API retorna 429 → mostrar mensagem de limite

---

### 2. `/app/meus-alimentos/page.tsx` - OCR de Tabelas

**Modificações:**

```typescript
// 1. Buscar plano
const { plan, quota } = useUserPlan();

// 2. Mostrar QuotaCard de OCR se PREMIUM
{plan === 'premium' && (
  <QuotaCard
    quotaType="ocr"
    used={quota.ocr_analyses.used}
    limit={quota.ocr_analyses.limit}
    resetDate={quota.resetDate}
  />
)}

// 3. Esconder botão "Analisar Tabela" se FREE
{plan !== 'free' ? (
  <button onClick={handleOCR}>📸 Analisar Tabela</button>
) : (
  <button onClick={() => setShowPaywall(true)}>
    🔒 Analisar Tabela (Premium)
  </button>
)}
```

---

### 3. `/app/account/page.tsx` - Configurações

**Adicionar seção:**

```typescript
<section>
  <h2>Plano Atual</h2>
  <div className="flex items-center gap-3">
    <PlanBadge plan={user.plan} size="lg" />
    {user.plan === 'free' && (
      <UpgradeButton currentPlan="free" />
    )}
  </div>

  {user.plan === 'premium' && (
    <div className="mt-4">
      <QuotaCard quotaType="photo" {...quota} />
      <QuotaCard quotaType="ocr" {...quota} />
    </div>
  )}

  {user.plan === 'unlimited' && (
    <p className="text-sm text-muted">
      ⭐ Você tem acesso ilimitado a todos recursos
    </p>
  )}
</section>
```

---

## 🆕 PÁGINAS A CRIAR

### 1. `/app/upgrade/page.tsx` - Pricing Table

**Design:**

```
╔═══════════════════════════════════════════════════════════╗
║              Escolha o Plano Ideal para Você             ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  ┌──────────────┐          ┌──────────────┐              ║
║  │   FREE       │          │  💎 PREMIUM  │              ║
║  │   Grátis     │          │  R$ 14,90/mês│              ║
║  ├──────────────┤          ├──────────────┤              ║
║  │ ❌ 0 fotos   │          │ ✅ 90 fotos  │              ║
║  │ ❌ 0 OCR     │          │ ✅ 30 OCR    │              ║
║  │ ✅ 30 dias   │          │ ✅ Ilimitado │              ║
║  │ ❌ Coach IA  │          │ ✅ Coach IA  │              ║
║  │              │          │              │              ║
║  │ [Atual]      │          │ [Assinar]    │              ║
║  └──────────────┘          └──────────────┘              ║
║                                                            ║
║  ══════════════════════════════════════════════           ║
║                                                            ║
║  ❓ Perguntas Frequentes                                  ║
║  • Como funciona o período de teste?                      ║
║  • Posso cancelar a qualquer momento?                     ║
║  • O que acontece se eu atingir o limite?                 ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```

**Seções:**
1. **Hero** - Título + descrição
2. **Pricing Cards** - FREE vs PREMIUM
3. **Feature Comparison Table** - Tabela detalhada
4. **FAQ** - Perguntas frequentes
5. **CTA Final** - "Começar agora"

**Botão "Assinar":**
- Por enquanto: Mock (alert ou toast)
- Futuro (Fase 4): Integração com Stripe

---

## 🪝 HOOKS A CRIAR

### 1. `useUserPlan()` - Hook de Plano

**Localização:** `/hooks/useUserPlan.ts`

```typescript
interface UserPlan {
  plan: 'free' | 'premium' | 'unlimited';
  subscription_status: string;
  quota: {
    photo_analyses: { used: number; limit: number; percentage: number };
    ocr_analyses: { used: number; limit: number; percentage: number };
    resetDate: Date;
  };
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUserPlan(): UserPlan {
  // Busca plano e quota do usuário logado
  // Atualiza automaticamente após ações
}
```

**Uso:**
```typescript
const { plan, quota, isLoading } = useUserPlan();

if (isLoading) return <Skeleton />;

return (
  <div>
    <PlanBadge plan={plan} />
    {plan === 'premium' && <QuotaCard {...quota.photo_analyses} />}
  </div>
);
```

---

### 2. `useQuota()` - Hook de Quota

**Localização:** `/hooks/useQuota.ts`

```typescript
interface UseQuotaResult {
  canUseFeature: (feature: 'photo' | 'ocr') => boolean;
  remaining: {
    photo: number;
    ocr: number;
  };
  percentage: {
    photo: number;
    ocr: number;
  };
  resetDate: Date;
}

export function useQuota(): UseQuotaResult {
  // Verifica se usuário pode usar recurso
  // Retorna quantas análises restam
}
```

---

## 🔌 API ENDPOINTS (Frontend)

### `/lib/api/subscription.ts`

```typescript
export async function getUserPlan(): Promise<UserPlan> {
  const res = await fetch('/api/user/profile');
  return res.json();
}

export async function getQuotaUsage(): Promise<QuotaUsage> {
  const res = await fetch('/api/subscription/quota');
  return res.json();
}

export async function createCheckoutSession(): Promise<{ url: string }> {
  // Futuro: Criar sessão de checkout Stripe
  const res = await fetch('/api/subscription/checkout', { method: 'POST' });
  return res.json();
}
```

---

## 📊 FLUXOS DE USUÁRIO

### Fluxo 1: FREE tenta usar foto

```
1. FREE acessa /capture
2. Vê campo de foto DESABILITADO
3. Clica no campo → Tooltip "Recurso Premium"
4. Clica novamente → PaywallModal abre
5. Clica "Ver Planos" → Redireciona para /upgrade
6. Vê pricing table com FREE vs PREMIUM
7. Clica "Assinar" → (mock por enquanto)
```

### Fluxo 2: PREMIUM usa foto

```
1. PREMIUM acessa /capture
2. Vê QuotaCard no topo: "45/90 usadas (50%)"
3. Upload de foto funciona normalmente
4. Após enviar, quota atualiza: "46/90 usadas (51%)"
5. QuotaCard muda de cor (verde → amarelo)
6. Quando chegar em 90/90 (100%):
   → API retorna 429
   → Mensagem: "Limite atingido. Renova em 01/11"
```

### Fluxo 3: UNLIMITED usa sem limites

```
1. UNLIMITED acessa /capture
2. Vê badge "⭐ ADMIN" no header
3. NÃO vê QuotaCard (ou vê "Ilimitado")
4. Usa fotos sem restrições
5. Quota incrementa mas nunca bloqueia
```

---

## 🎨 DESIGN TOKENS

### Cores por Plano

```css
/* FREE */
--plan-free-bg: #f3f4f6;
--plan-free-text: #6b7280;
--plan-free-border: #d1d5db;

/* PREMIUM */
--plan-premium-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--plan-premium-text: #ffffff;
--plan-premium-border: #667eea;

/* UNLIMITED */
--plan-unlimited-bg: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--plan-unlimited-text: #ffffff;
--plan-unlimited-border: #f093fb;
```

### Cores de Quota

```css
--quota-low: #10b981;      /* 0-50% - Verde */
--quota-medium: #f59e0b;   /* 51-80% - Amarelo */
--quota-high: #ef4444;     /* 81-100% - Vermelho */
```

---

## ✅ CRITÉRIOS DE SUCESSO

Fase 3 está completa quando:

- [ ] FREE vê paywalls ao tentar usar recursos premium
- [ ] PREMIUM vê contadores de quota funcionando
- [ ] Quota atualiza após cada uso
- [ ] Página `/upgrade` está acessível e bonita
- [ ] Badge de plano aparece no header/account
- [ ] Mensagens de erro 403/429 são tratadas na UI
- [ ] Build passa sem erros
- [ ] App continua funcionando para todos usuários

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

### Sprint 1: Componentes Base (2-3h)
1. Criar `<PlanBadge />`
2. Criar `<UpgradeButton />`
3. Criar `useUserPlan()` hook
4. Adicionar badge no header

### Sprint 2: Paywalls (2-3h)
5. Criar `<PaywallModal />`
6. Modificar `/app/capture/page.tsx`
7. Modificar `/app/meus-alimentos/page.tsx`
8. Testar fluxo FREE

### Sprint 3: Quotas (2-3h)
9. Criar `<QuotaCard />`
10. Criar `useQuota()` hook
11. Adicionar QuotaCard em páginas
12. Testar fluxo PREMIUM

### Sprint 4: Página de Upgrade (2-3h)
13. Criar `/app/upgrade/page.tsx`
14. Pricing table FREE vs PREMIUM
15. FAQ section
16. Botão mock de checkout

### Sprint 5: Polimento (1-2h)
17. Adicionar seção de plano em `/account`
18. Testes finais
19. Ajustes de UX/UI
20. Documentação

**Total estimado:** 9-14 horas

---

## 📁 ESTRUTURA DE ARQUIVOS

```
components/
└─ subscription/
   ├─ PaywallModal.tsx
   ├─ QuotaCard.tsx
   ├─ PlanBadge.tsx
   └─ UpgradeButton.tsx

hooks/
├─ useUserPlan.ts
└─ useQuota.ts

lib/
└─ api/
   └─ subscription.ts

app/
├─ upgrade/
│  └─ page.tsx
└─ subscription/
   └─ page.tsx (futuro)
```

---

## 📝 NOTAS IMPORTANTES

1. **Todos componentes devem ser client-side** (`'use client'`)
2. **Usar shadcn/ui** para componentes base (Dialog, Card, Badge)
3. **Responsivo** - Funcionar bem em mobile
4. **Acessível** - ARIA labels, keyboard navigation
5. **Loading states** - Skeleton loaders enquanto carrega
6. **Error handling** - Tratar erros da API gracefully

---

## 🔗 PRÓXIMA FASE

**Fase 4: Integração com Stripe**
- Setup de Stripe
- Webhook de pagamentos
- Ativação automática de PREMIUM
- Gerenciamento de assinaturas
- Portal do cliente

---

**Criado:** 2025-10-25 18:50
**Versão:** 1.0
**Autor:** Claude + Edson
**Status:** 📋 Pronto para implementação
