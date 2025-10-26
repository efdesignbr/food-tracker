# 🎯 Prompt para Continuar Implementação

Use este prompt em uma nova conversa para continuar de onde paramos:

---

## 📋 PROMPT

```
Continuar implementação de assinaturas no Food Tracker.

STATUS: Fase 3 - 80% concluída (4 de 5 sprints)
PRÓXIMO: Sprint 5 (última) - Polimento e testes finais

Leia /docs/FASE_3_STATUS.md para entender o contexto completo.

TAREFAS DA SPRINT 5:

1. Modificar /app/account/page.tsx:
   - Adicionar seção "Plano Atual" com PlanBadge
   - Para FREE: mostrar botão de upgrade
   - Para PREMIUM: mostrar QuotaCards de foto e OCR
   - Para UNLIMITED: mostrar indicador de acesso ilimitado

2. Testes completos:
   - Verificar fluxo FREE (paywalls funcionando)
   - Verificar fluxo PREMIUM (quotas aparecendo)
   - Testar todos os links entre páginas
   - Verificar responsividade mobile

3. Build final e validação

Stack: Next.js 14 + TypeScript + Tailwind
Componentes já criados: PlanBadge, UpgradeButton, PaywallModal, QuotaCard
Hooks já criados: useUserPlan(), useQuota()

Comece pela tarefa 1 (modificar /account).
```

---

## 📚 CONTEXTO ADICIONAL

Se precisar de mais contexto, mencione também:

- `/docs/FASE_3_UI_PAYWALLS.md` - Spec completa da Fase 3
- `/lib/types/subscription.ts` - Types de subscription
- `/lib/constants.ts` - Limites dos planos (PLAN_LIMITS)
- `/lib/quota.ts` - Sistema de quotas completo

---

## 🎯 RESULTADO ESPERADO

Ao final da Sprint 5, você terá:

1. Página `/account` mostrando:
   - Plano atual (FREE/PREMIUM/UNLIMITED)
   - Botão de upgrade (para FREE)
   - Cards de quota (para PREMIUM)
   - Indicador de acesso ilimitado (para UNLIMITED)

2. Testes validados:
   - Fluxo FREE funciona (paywalls bloqueiam)
   - Fluxo PREMIUM funciona (quotas aparecem)
   - Navegação entre páginas funciona
   - Build passa sem erros

3. Fase 3 100% concluída! ✅

Depois disso, você pode partir para a **Fase 4: Integração com Stripe**.

---

**Dica:** Se o Claude perguntar sobre o estado do projeto, responda que:
- Fase 1 (backend) = ✅ 100%
- Fase 2 (backend quotas) = ✅ 100%
- Fase 3 (UI) = 🟡 80% (falta apenas Sprint 5)
- Fase 4 (Stripe) = ⏸️ Não iniciada

---

Boa sorte! 🚀
