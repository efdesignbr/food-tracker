# Plano de Implementacao: RevenueCat para Food Tracker

**Data:** 03/01/2026
**Status:** Pendente aprovacao

## Contexto

- **Objetivo**: Integrar RevenueCat para assinaturas in-app (iOS e Android)
- **Product IDs**: `premium_monthly` (R$14,90/mes) e `premium_annual` (R$59,90/ano = R$4,99/mes)
- **Banco de Dados**: JA PREPARADO (campos RevenueCat na tabela `users` + tabela `webhook_events`)
- **RevenueCat SDK**: JA INSTALADO no node_modules (v12.0.1), mas NAO integrado

## Restricoes do Usuario

1. **Sprints pequenos** - uma alteracao por vez, validacao constante
2. **ZERO migrations** - scripts SQL fornecidos para execucao manual
3. **Verificar tipos e build** a cada alteracao
4. **Nao quebrar nada** existente
5. **Qualidade > Velocidade**

---

## FASE 1: Configuracao Base (Backend)

### Sprint 1.1: Criar tipos TypeScript para RevenueCat
**Arquivos a criar/modificar:**
- `lib/types/revenuecat.ts` (NOVO)

**O que fazer:**
- Criar tipos para eventos de webhook do RevenueCat
- Criar tipos para CustomerInfo
- Criar interface para configuracao

**Validacao:** `npx tsc --noEmit`

---

### Sprint 1.2: Criar constantes de produtos
**Arquivos a modificar:**
- `lib/constants.ts`

**O que fazer:**
- Adicionar objeto `REVENUECAT_PRODUCTS` com IDs dos produtos
- Adicionar `REVENUECAT_ENTITLEMENT_ID` (ex: "premium")

**Validacao:** `npx tsc --noEmit`

---

### Sprint 1.3: Criar repositorio de webhook events
**Arquivos a criar:**
- `lib/repos/webhook-events.repo.ts` (NOVO)

**O que fazer:**
- Funcao `saveWebhookEvent()` para salvar evento
- Funcao `getEventById()` para verificar duplicidade

**Validacao:** `npx tsc --noEmit`

---

### Sprint 1.4: Criar servico de subscription
**Arquivos a criar:**
- `lib/services/subscription.service.ts` (NOVO)

**O que fazer:**
- Funcao `updateUserSubscription()` para atualizar plan/status do usuario
- Funcao `handleRevenueCatEvent()` para processar eventos

**Validacao:** `npx tsc --noEmit`

---

### Sprint 1.5: Criar API de webhook
**Arquivos a criar:**
- `app/api/webhooks/revenuecat/route.ts` (NOVO)

**O que fazer:**
- Endpoint POST para receber webhooks
- Verificar assinatura do webhook (Authorization header)
- Chamar `handleRevenueCatEvent()`
- Retornar 200 OK

**Validacao:** `npx tsc --noEmit` + `npm run build`

---

## FASE 2: Integracao Mobile (Frontend)

### Sprint 2.1: Adicionar RevenueCat como dependencia explicita
**Arquivos a modificar:**
- `package.json`

**O que fazer:**
- Adicionar `"@revenuecat/purchases-capacitor": "^12.0.1"` em dependencies

**Validacao:** `npm install` + verificar se funciona

---

### Sprint 2.2: Criar hook de inicializacao RevenueCat
**Arquivos a criar:**
- `hooks/useRevenueCat.ts` (NOVO)

**O que fazer:**
- Hook para inicializar RevenueCat SDK
- Detectar se e mobile (Capacitor)
- Configurar com API Key
- Login anonimo ou com userId

**Validacao:** `npx tsc --noEmit`

---

### Sprint 2.3: Criar hook de compra
**Arquivos a criar:**
- `hooks/usePurchase.ts` (NOVO)

**O que fazer:**
- Hook para listar offerings/packages
- Funcao para executar compra
- Funcao para restaurar compras

**Validacao:** `npx tsc --noEmit`

---

### Sprint 2.4: Criar componente PaywallScreen
**Arquivos a criar:**
- `components/subscription/PaywallScreen.tsx` (NOVO)

**O que fazer:**
- Exibir planos disponiveis (do RevenueCat offerings)
- Botoes de compra
- Loading states
- Error handling

**Validacao:** `npx tsc --noEmit`

---

### Sprint 2.5: Atualizar pagina /upgrade
**Arquivos a modificar:**
- `app/upgrade/page.tsx`

**O que fazer:**
- Integrar com `usePurchase` hook
- Substituir alert mockado por compra real
- Detectar se e mobile para mostrar PaywallScreen

**Validacao:** `npx tsc --noEmit` + `npm run build`

---

## FASE 3: Sincronizacao e Verificacao

### Sprint 3.1: Criar API para sincronizar status
**Arquivos a criar:**
- `app/api/subscription/sync/route.ts` (NOVO)

**O que fazer:**
- Endpoint POST para sincronizar status do RevenueCat com banco
- Util quando app abre (verificar se assinatura ainda valida)

**Validacao:** `npx tsc --noEmit` + `npm run build`

---

### Sprint 3.2: Atualizar hook useUserPlan
**Arquivos a modificar:**
- `hooks/useUserPlan.ts`

**O que fazer:**
- Chamar sync ao inicializar (se mobile)
- Atualizar estado apos compra bem-sucedida

**Validacao:** `npx tsc --noEmit`

---

### Sprint 3.3: Integrar na inicializacao do app
**Arquivos a modificar:**
- `components/AuthenticatedLayout.mobile.tsx`

**O que fazer:**
- Inicializar RevenueCat ao montar layout
- Configurar userId do RevenueCat com userId do banco

**Validacao:** `npx tsc --noEmit` + `npm run build`

---

## FASE 4: Configuracao Nativa

### Sprint 4.1: Configurar iOS
**Arquivos a modificar:**
- `ios/App/Podfile`

**O que fazer:**
- Adicionar pod do RevenueCat (se necessario apos cap sync)
- `pod install`

**Validacao:** `npx cap sync ios` + abrir Xcode e verificar

---

### Sprint 4.2: Configurar Android
**Arquivos a verificar:**
- `android/app/capacitor.build.gradle`

**O que fazer:**
- Verificar se RevenueCat foi adicionado apos cap sync
- Ajustar dependencias se necessario

**Validacao:** `npx cap sync android` + verificar gradle sync

---

## FASE 5: Variaveis de Ambiente

### Sprint 5.1: Adicionar variaveis de ambiente
**Arquivos a modificar:**
- `.env.example` (documentacao)
- `.env.local` (valores reais - nao commitar)

**Variaveis necessarias:**
```
NEXT_PUBLIC_REVENUECAT_API_KEY_IOS=appl_xxxxx
NEXT_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_xxxxx
REVENUECAT_WEBHOOK_AUTH_KEY=whsec_xxxxx
```

**Validacao:** Verificar se app carrega sem erros

---

## Arquivos Criticos (Resumo)

### Novos arquivos:
- `lib/types/revenuecat.ts`
- `lib/repos/webhook-events.repo.ts`
- `lib/services/subscription.service.ts`
- `app/api/webhooks/revenuecat/route.ts`
- `app/api/subscription/sync/route.ts`
- `hooks/useRevenueCat.ts`
- `hooks/usePurchase.ts`
- `components/subscription/PaywallScreen.tsx`

### Arquivos a modificar:
- `lib/constants.ts`
- `package.json`
- `app/upgrade/page.tsx`
- `hooks/useUserPlan.ts`
- `components/AuthenticatedLayout.mobile.tsx`

### Arquivos nativos:
- `ios/App/Podfile` (se necessario)
- `android/app/capacitor.build.gradle` (se necessario)

---

## SQL para Execucao Manual

O banco JA ESTA PREPARADO. Os seguintes campos ja existem:

**Tabela `users`:**
- `revenuecat_app_user_id` VARCHAR(255)
- `revenuecat_original_transaction_id` VARCHAR(255)
- `subscription_product_id` VARCHAR(100)
- `subscription_store` VARCHAR(20) - constraint: 'app_store' | 'play_store'

**Tabela `webhook_events`:** Ja existe completa.

**Indices:** Ja criados (`idx_users_revenuecat`, `idx_webhook_events_*`)

**Nenhum SQL adicional necessario.**

---

## Ordem de Execucao

1. Sprint 1.1 -> 1.5 (Backend) - **commits intermediarios**
2. Sprint 2.1 -> 2.5 (Frontend hooks/componentes) - **commits intermediarios**
3. Sprint 3.1 -> 3.3 (Sincronizacao) - **commits intermediarios**
4. Sprint 4.1 -> 4.2 (Nativo) - **commits intermediarios**
5. Sprint 5.1 (Env vars) - **commit final**

Total: ~15 sprints pequenos, cada um validado antes de prosseguir.

---

## Configuracao RevenueCat (Painel)

Antes de iniciar, voce precisa configurar no painel do RevenueCat:

1. **Criar App** para iOS e Android
2. **Criar Products:**
   - `premium_monthly` - Assinatura mensal R$14,90
   - `premium_annual` - Assinatura anual R$59,90
3. **Criar Entitlement:** `premium`
4. **Criar Offering:** `default` com os 2 packages
5. **Configurar Webhook URL:** `https://seu-dominio.com/api/webhooks/revenuecat`
6. **Copiar API Keys:** iOS (appl_xxx) e Android (goog_xxx)

---

*Documento gerado em 03/01/2026*
