# 💳 Fase 4: In-App Purchase com RevenueCat

**Data:** 2025-10-25
**Status:** 📋 PLANEJAMENTO
**Pré-requisito:** Fase 3 concluída (UI pronta)

---

## 🎯 OBJETIVO

Implementar sistema de pagamento via **In-App Purchase (IAP)** para:
- Apple App Store (iOS)
- Google Play Store (Android)

**Usando:** [RevenueCat](https://www.revenuecat.com/) para simplificar integração.

---

## 💰 MODELO DE RECEITA

### Comissões das Stores

**Apple App Store:**
- **15%** se faturar < $1M/ano (Small Business Program)
- **30%** acima de $1M/ano

**Google Play Store:**
- **15%** nos primeiros $1M/ano
- **30%** acima de $1M

### Exemplo de Receita

**Cenário:** 100 usuários PREMIUM × R$ 14,90/mês

```
Receita bruta:  R$ 1.490,00
Comissão (15%): R$   223,50
Receita líquida: R$ 1.266,50  ✅

Custo de IA:    R$   240,00
Lucro:          R$ 1.026,50  (69% margem)
```

**Break-even:** ~19 usuários pagantes

---

## 🏗️ ARQUITETURA

```
┌──────────────────────────────────────────────────────┐
│              App Mobile (React Native)               │
│                                                       │
│  ┌────────────────────────────────────────────┐     │
│  │  /app/upgrade                              │     │
│  │  ┌──────────────┐                          │     │
│  │  │ [Assinar]    │ ──┐                      │     │
│  │  └──────────────┘   │                      │     │
│  └─────────────────────┼──────────────────────┘     │
│                        │                             │
│         RevenueCat.purchasePackage(package)         │
│                        │                             │
└────────────────────────┼─────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │   RevenueCat     │
              │   (Servidor)     │
              └────────┬─────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
         ▼                            ▼
   ┌──────────┐              ┌──────────────┐
   │  Apple   │              │   Google     │
   │ StoreKit │              │ Play Billing │
   └──────────┘              └──────────────┘
         │                            │
         └─────────────┬──────────────┘
                       │
                       │ Webhook
                       ▼
              ┌─────────────────┐
              │  Seu Backend    │
              │  (Next.js API)  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    Supabase     │
              │  (users table)  │
              └─────────────────┘
```

---

## 📦 SETUP DO REVENUECAT

### 1. Criar Conta

1. Acesse [app.revenuecat.com](https://app.revenuecat.com)
2. Cadastre-se (grátis até $2.5k MRR)
3. Crie um projeto: "Food Tracker"

### 2. Configurar Plataformas

**iOS (Apple App Store):**
1. Criar App ID no Apple Developer
2. Configurar In-App Purchase no App Store Connect
3. Criar produto de assinatura: `premium_monthly`
   - ID: `com.foodtracker.premium.monthly`
   - Preço: R$ 14,90/mês
4. Conectar ao RevenueCat (Shared Secret + API Key)

**Android (Google Play):**
1. Criar app no Google Play Console
2. Configurar produtos de assinatura
3. Criar produto: `premium_monthly`
   - ID: `premium_monthly`
   - Preço: R$ 14,90/mês
4. Conectar ao RevenueCat (Service Account JSON)

### 3. Criar Offerings no RevenueCat

```
Offering: default
├─ Package: monthly
│  ├─ iOS: com.foodtracker.premium.monthly
│  └─ Android: premium_monthly
└─ Package: annual (futuro)
```

---

## 🔧 IMPLEMENTAÇÃO

### 1. Instalar SDK (React Native)

```bash
npm install react-native-purchases
npx pod-install  # iOS only
```

### 2. Configurar SDK

**`lib/revenuecat.ts`:**
```typescript
import Purchases from 'react-native-purchases';

const REVENUECAT_API_KEY_IOS = process.env.NEXT_PUBLIC_REVENUECAT_IOS;
const REVENUECAT_API_KEY_ANDROID = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID;

export async function initRevenueCat(userId: string) {
  await Purchases.configure({
    apiKey: Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID,
    appUserID: userId, // ID do Supabase
  });
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePremium() {
  const offering = await getOfferings();
  const packageToBuy = offering?.monthly;

  if (!packageToBuy) throw new Error('Package not found');

  const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
  return customerInfo;
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getCustomerInfo() {
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo;
}
```

### 3. Modificar Página de Upgrade

**`/app/upgrade/page.tsx`:**
```typescript
'use client';

import { useState } from 'react';
import { purchasePremium } from '@/lib/revenuecat';

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    try {
      await purchasePremium();
      // RevenueCat vai notificar o webhook
      // Webhook vai ativar PREMIUM no Supabase
      // Redirecionar para success
      window.location.href = '/subscription/success';
    } catch (error: any) {
      if (error.userCancelled) {
        // Usuário cancelou
      } else {
        alert('Erro ao processar pagamento');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Upgrade para Premium</h1>

      <div className="pricing-card">
        <h2>💎 Premium</h2>
        <p className="price">R$ 14,90/mês</p>
        <ul>
          <li>✅ 90 análises de foto/mês</li>
          <li>✅ 30 análises de tabelas/mês</li>
          <li>✅ Histórico ilimitado</li>
        </ul>
        <button onClick={handlePurchase} disabled={loading}>
          {loading ? 'Processando...' : 'Assinar Agora'}
        </button>
      </div>
    </div>
  );
}
```

### 4. Criar Webhook para Receber Notificações

**`/app/api/webhooks/revenuecat/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(req: NextRequest) {
  // Validar webhook (Authorization header)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const event = await req.json();
  const { type, app_user_id, entitlements } = event.event;

  const pool = getPool();

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
      // Ativar PREMIUM
      await pool.query(
        `UPDATE users
         SET plan = 'premium',
             subscription_status = 'active',
             subscription_started_at = NOW(),
             subscription_expires_at = $1
         WHERE id = $2`,
        [new Date(entitlements.premium.expires_date), app_user_id]
      );
      break;

    case 'CANCELLATION':
      // Marcar como cancelado (mas mantém ativo até expirar)
      await pool.query(
        `UPDATE users
         SET subscription_status = 'canceled'
         WHERE id = $1`,
        [app_user_id]
      );
      break;

    case 'EXPIRATION':
      // Expirou → voltar para FREE
      await pool.query(
        `UPDATE users
         SET plan = 'free',
             subscription_status = 'expired',
             subscription_expires_at = NOW()
         WHERE id = $1`,
        [app_user_id]
      );
      break;

    case 'PRODUCT_CHANGE':
      // Mudou de plano (ex: mensal → anual)
      // Implementar se tiver múltiplos planos
      break;
  }

  return NextResponse.json({ ok: true });
}
```

### 5. Configurar Webhook no RevenueCat

1. RevenueCat Dashboard → Integrations → Webhooks
2. URL: `https://seu-app.vercel.app/api/webhooks/revenuecat`
3. Secret: Gerar e salvar em `.env.local`
4. Eventos: Marcar todos

---

## 🧪 TESTES

### 1. Sandbox (Desenvolvimento)

**iOS (TestFlight):**
1. Criar Sandbox Tester no App Store Connect
2. Fazer login no device com conta sandbox
3. Testar compra (não cobra de verdade)

**Android (Internal Testing):**
1. Criar tester no Google Play Console
2. Adicionar email do tester
3. Testar compra (não cobra)

### 2. Fluxo de Teste

```bash
# 1. Usuário FREE
- Login no app
- Ver plano: FREE
- Tentar usar foto → Paywall

# 2. Comprar PREMIUM
- Clicar "Assinar" em /upgrade
- Modal da Apple/Google abre
- Completar compra (sandbox)
- Aguardar webhook (5-30s)

# 3. Verificar ativação
- Refresh do app
- Plano agora: PREMIUM
- Consegue usar fotos
- QuotaCard aparece

# 4. Cancelar assinatura
- Settings → Manage Subscription
- Cancelar (via Apple/Google)
- Webhook recebido
- Status: canceled (mas ativo até expirar)

# 5. Expiração
- Aguardar data de expiração
- Webhook EXPIRATION recebido
- Plano volta para FREE
```

---

## 💡 FUNCIONALIDADES EXTRAS

### 1. Trials (Teste grátis)

**No RevenueCat:**
- Configurar 7 dias grátis
- Usuário não paga nos primeiros 7 dias
- Após 7 dias, cobra automaticamente

**No código:**
```typescript
const offering = await getOfferings();
const trial = offering?.monthly; // Já inclui trial
await Purchases.purchasePackage(trial);
```

### 2. Promoções

**Criar códigos promocionais:**
- App Store Connect → Promo Codes
- Google Play → Promotional Offers
- Distribuir em redes sociais

### 3. Restore Purchases

**Para quem reinstalou o app:**
```typescript
<button onClick={async () => {
  const customerInfo = await restorePurchases();
  if (customerInfo.entitlements.active.premium) {
    alert('Assinatura restaurada!');
  }
}}>
  Restaurar Compras
</button>
```

---

## 📊 ANALYTICS

### Dashboard do RevenueCat

- MRR (Monthly Recurring Revenue)
- Churn rate
- Conversão de trial → pago
- Lifetime Value (LTV)

### Integrar com Analytics

**Amplitude, Mixpanel, etc:**
```typescript
Purchases.setAttributes({
  '$email': user.email,
  'tenant_id': user.tenantId,
});
```

---

## 💰 CUSTOS

### RevenueCat
- **Grátis** até $2.5k MRR
- **$300/mês** acima de $2.5k MRR
- Sem taxas por transação

### Stores
- **Apple:** 15-30% por transação
- **Google:** 15-30% por transação

### Exemplo (100 usuários × R$ 14,90):
```
Receita bruta:     R$ 1.490,00
Comissão stores:   R$   223,50 (15%)
RevenueCat:        R$     0,00 (grátis até $2.5k)
Receita líquida:   R$ 1.266,50

Custos IA:         R$   240,00
Lucro:             R$ 1.026,50  💰
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Setup
- [ ] Criar conta no RevenueCat
- [ ] Configurar Apple App Store Connect
- [ ] Configurar Google Play Console
- [ ] Criar produtos de assinatura (iOS + Android)
- [ ] Conectar stores ao RevenueCat

### Código
- [ ] Instalar `react-native-purchases`
- [ ] Criar `lib/revenuecat.ts`
- [ ] Modificar `/app/upgrade/page.tsx`
- [ ] Criar webhook `/api/webhooks/revenuecat/route.ts`
- [ ] Adicionar botão "Restaurar Compras"

### Testes
- [ ] Testar compra no sandbox (iOS)
- [ ] Testar compra no sandbox (Android)
- [ ] Testar webhook de ativação
- [ ] Testar cancelamento
- [ ] Testar expiração
- [ ] Testar restore purchases

### Produção
- [ ] Deploy do webhook
- [ ] Configurar webhook no RevenueCat
- [ ] Enviar app para revisão (Apple + Google)
- [ ] Aguardar aprovação
- [ ] Lançar! 🚀

---

## 🔗 RECURSOS

- [RevenueCat Docs](https://docs.revenuecat.com/)
- [React Native SDK](https://docs.revenuecat.com/docs/reactnative)
- [Webhook Events](https://docs.revenuecat.com/docs/webhooks)
- [App Store In-App Purchase](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)

---

**Criado:** 2025-10-25
**Versão:** 1.0
**Autor:** Claude + Edson
**Status:** 📋 Pronto para implementação
