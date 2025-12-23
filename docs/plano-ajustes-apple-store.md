# Plano de Implementação - Ajustes para Submissão na Apple Store

## Resumo das Tarefas

| # | Tarefa | Prioridade | Complexidade |
|---|--------|------------|--------------|
| 1 | Bloquear IA para plano FREE | Alta | Baixa |
| 2 | Definir estrutura de planos | Alta | Baixa |
| 3 | Bug da foto na captura | Alta | Baixa |
| 4 | Erro de escrita no dashboard | Alta | Trivial |
| 5 | Expandir refeição no dashboard | Média | Média |
| 6 | Bloquear Exportar CSV | Média | Baixa |
| 7 | Bloquear Coach IA | Média | Baixa |
| 8 | Bloquear análise IA em relatórios | Média | Baixa |
| 9 | Melhorar Meus Alimentos | Média | Média |
| 10 | Espaço para banner AdMob | Média | Baixa |

---

## Tarefa 1: Bloquear toda IA para plano FREE

**Arquivos a modificar:**
- `/app/api/meals/analyze-image/route.ts` - Já bloqueia (verificar)
- `/app/api/meals/analyze-text/route.ts` - PRECISA BLOQUEAR
- `/app/api/food-bank/analyze-label/route.ts` - Já bloqueia (verificar)
- `/app/api/coach/analyze/route.ts` - Já bloqueia (verificar)
- `/app/api/reports/analysis/route.ts` - PRECISA BLOQUEAR
- `/app/capture/page.tsx` - Bloquear UI de análise para FREE

**Implementação:**
- Adicionar verificação de plano nos endpoints que faltam
- Padrão: Retornar 403 com `error: 'upgrade_required'`

---

## Tarefa 2: Definir estrutura de planos

**Arquivos a modificar:**
- `/lib/constants.ts` - Atualizar PLAN_LIMITS
- `/app/upgrade/page.tsx` - Criar/atualizar página de upgrade

**Estrutura proposta:**
```typescript
PLAN_LIMITS = {
  free: {
    photo_analyses_per_month: 0,
    ocr_analyses_per_month: 0,
    text_analyses_per_month: 0,
    coach_ai: false,
    ai_reports: false,
    advanced_reports: false,  // Relatórios básicos OK, análise IA não
    data_export: false,
    history_days: 30,
  },
  premium: {
    photo_analyses_per_month: 90,
    ocr_analyses_per_month: 30,
    text_analyses_per_month: 999999,
    coach_ai: true,
    ai_reports: true,
    advanced_reports: true,
    data_export: true,
    history_days: null,  // ilimitado
  }
}
```

**Página de Upgrade:**
- Mostrar comparativo FREE vs PREMIUM
- Botão de upgrade (por enquanto link para contato ou "Em breve")
- Preparar estrutura para RevenueCat/Stripe futuramente

---

## Tarefa 3: Bug da foto na captura

**Problema identificado:**
- Linha 499: `{!analysis && foodList.length > 0 && (...)`
- O botão "Analisar com IA" só aparece se `foodList.length > 0`
- Se usuário só tira foto, não vê o botão

**Arquivo:** `/app/capture/page.tsx`

**Solução:**
Adicionar botão "Analisar Foto com IA" que aparece quando:
- `file !== null` (tem foto)
- `!analysis` (ainda não analisou)
- `plan !== 'free'` (plano permite)

```tsx
{/* Botão de Análise de Foto (quando tem foto mas não tem alimentos) */}
{!analysis && file && foodList.length === 0 && plan !== 'free' && (
  <button onClick={analyzePhotoOnly} disabled={loading}>
    Analisar Foto com IA
  </button>
)}
```

Criar função `analyzePhotoOnly()` que chama `/api/meals/analyze-image` direto.

---

## Tarefa 4: Erro de escrita no dashboard

**Arquivo:** `/app/page.tsx`
**Linha:** 233

**Problema:**
```tsx
{todayStats.meals.length} refeição{todayStats.meals.length !== 1 ? 'ões' : ''}
// Gera: "2 refeiçãoões" (incorreto)
```

**Solução:** Remover totalmente (conforme solicitado)

---

## Tarefa 5: Expandir refeição no dashboard

**Arquivo:** `/app/page.tsx`
**Linhas:** 712-754

**Implementação:**
1. Adicionar estado `expandedMealId`
2. Ao clicar no card, expandir para mostrar:
   - Lista de alimentos da refeição
   - Valores nutricionais detalhados
   - Horário completo
   - Notas (se houver)
3. Toggle para expandir/colapsar

```tsx
const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

// No card da refeição:
<div onClick={() => setExpandedMealId(expandedMealId === meal.id ? null : meal.id)}>
  {/* Card existente */}
  {expandedMealId === meal.id && (
    <div>
      {/* Detalhes expandidos */}
      <h4>Alimentos:</h4>
      {meal.foods.map(food => (
        <div>{food.name} - {food.quantity} {food.unit}</div>
      ))}
    </div>
  )}
</div>
```

---

## Tarefa 6: Bloquear Exportar CSV

**Arquivo:** `/app/history/page.tsx`
**Componente:** `/components/ExportMealsButton.tsx`

**Implementação:**
1. No `ExportMealsButton`, adicionar prop `plan`
2. Se `plan === 'free'`, mostrar botão com cadeado e abrir paywall ao clicar
3. Ou esconder botão completamente para FREE

```tsx
// ExportMealsButton.tsx
if (plan === 'free') {
  return (
    <button onClick={() => setShowPaywall(true)}>
      🔒 Exportar CSV (Premium)
    </button>
  );
}
```

---

## Tarefa 7: Bloquear Coach IA

**Arquivos:**
- `/app/coach/page.tsx` - Frontend
- `/app/api/coach/analyze/route.ts` - Backend (já bloqueia, verificar)

**Verificar se já está bloqueado no backend e adicionar bloqueio no frontend se necessário.**

---

## Tarefa 8: Bloquear análise IA em relatórios

**Arquivos:**
- `/app/reports/page.tsx` - Frontend
- `/app/api/reports/analysis/route.ts` - Backend

**Implementação:**
1. Backend: Adicionar verificação de plano antes de chamar IA
2. Frontend: Esconder/bloquear botão "Analisar com IA" para FREE
3. Relatórios básicos (gráficos, estatísticas) continuam disponíveis

---

## Tarefa 9: Melhorar Meus Alimentos

**Arquivo:** `/app/meus-alimentos/page.tsx`

**Melhorias:**
1. **Filtro por tipo de alimento:**
   - Adicionar campo `food_type` ou usar categorização
   - Criar select com tipos: Todos, Proteínas, Carboidratos, Gorduras, etc.

2. **Cards colapsáveis:**
   - Exibir apenas nome do alimento por padrão
   - Expandir ao clicar mostrando detalhes nutricionais

3. **Busca rápida:**
   - Input de busca no topo da lista
   - Filtrar em tempo real pelo nome

```tsx
const [searchQuery, setSearchQuery] = useState('');
const [filterType, setFilterType] = useState('all');
const [expandedId, setExpandedId] = useState<string | null>(null);

const filteredFoods = foods
  .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  .filter(f => filterType === 'all' || f.type === filterType);
```

---

## Tarefa 10: Espaço para banner AdMob

**Arquivos:**
- `/components/AppLayout.tsx` - Adicionar espaço do banner
- `/app/layout.tsx` - Ajustar padding-top global

**Implementação:**
1. Criar componente `AdBanner` placeholder (50px altura)
2. Posicionar ACIMA do header, fixo no topo
3. Ajustar safe-area-inset para iOS
4. Passar padding-top ao conteúdo

```tsx
// components/AdBanner.tsx
export default function AdBanner() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 50,
      background: '#f0f0f0',  // placeholder
      zIndex: 200,
      paddingTop: 'env(safe-area-inset-top)'
    }}>
      {/* Aqui entrará o AdMob */}
      <div style={{ textAlign: 'center', lineHeight: '50px', color: '#999' }}>
        Ad Space
      </div>
    </div>
  );
}

// AppLayout.tsx - adicionar padding-top
<div style={{ paddingTop: 'calc(50px + env(safe-area-inset-top))' }}>
  <header>...</header>
  {children}
</div>
```

---

## Ordem de Implementação Sugerida

### Fase 1 - Crítico para Apple Store
1. Tarefa 4: Erro de escrita (trivial, 2 min)
2. Tarefa 3: Bug da foto (15 min)
3. Tarefa 1: Bloquear IA para FREE (30 min)
4. Tarefa 2: Estrutura de planos (30 min)

### Fase 2 - Funcionalidades Premium
5. Tarefa 6: Bloquear Export CSV (10 min)
6. Tarefa 7: Bloquear Coach IA (10 min)
7. Tarefa 8: Bloquear análise IA relatórios (15 min)

### Fase 3 - UX Improvements
8. Tarefa 5: Expandir refeição dashboard (30 min)
9. Tarefa 9: Melhorar Meus Alimentos (1h)
10. Tarefa 10: Espaço banner AdMob (20 min)

---

## Arquivos Principais a Modificar

| Arquivo | Tarefas |
|---------|---------|
| `/app/page.tsx` | 4, 5 |
| `/app/capture/page.tsx` | 3 |
| `/app/history/page.tsx` | 6 |
| `/app/coach/page.tsx` | 7 |
| `/app/reports/page.tsx` | 8 |
| `/app/meus-alimentos/page.tsx` | 9 |
| `/app/upgrade/page.tsx` | 2 |
| `/components/AppLayout.tsx` | 10 |
| `/components/ExportMealsButton.tsx` | 6 |
| `/lib/constants.ts` | 2 |
| `/app/api/meals/analyze-text/route.ts` | 1 |
| `/app/api/reports/analysis/route.ts` | 1, 8 |

---

## Notas sobre Pagamento

**Para submissão na Apple Store:**
- Por enquanto, a página de upgrade pode mostrar os planos e um botão "Em breve" ou "Contato"
- Apple exige In-App Purchase para compras dentro do app
- Recomendo implementar RevenueCat numa etapa posterior (simplifica iOS + Android + Web)

**Alternativa temporária:**
- Permitir upgrade manual via contato
- Admin pode alterar plano do usuário no banco
