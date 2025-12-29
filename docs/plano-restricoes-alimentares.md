# Plano de Implementacao: Restricoes Alimentares

**Data:** 28/12/2024
**Versao:** 1.0
**Status:** Aguardando aprovacao

---

## 1. VISAO GERAL

Implementar sistema de restricoes alimentares que permita aos usuarios cadastrar alergias, intolerancias, dietas especiais e condicoes medicas. Esses dados serao utilizados pelo Coach IA para personalizar recomendacoes e pelo sistema de analise de refeicoes para alertar sobre alimentos incompativeis.

---

## 2. MODELO DE DADOS

### 2.1 Nova Tabela: `user_dietary_restrictions`

```sql
CREATE TABLE user_dietary_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Tipo da restricao
  restriction_type VARCHAR(20) NOT NULL,
  -- Valores: 'allergy', 'intolerance', 'diet', 'religious', 'medical', 'preference'

  -- Nome/valor da restricao
  restriction_value VARCHAR(100) NOT NULL,
  -- Ex: 'gluten', 'lactose', 'vegetarian', 'diabetes'

  -- Severidade (principalmente para alergias)
  severity VARCHAR(20) DEFAULT 'moderate',
  -- Valores: 'mild', 'moderate', 'severe'

  -- Observacoes adicionais
  notes TEXT,

  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_restriction UNIQUE (user_id, tenant_id, restriction_type, restriction_value)
);

-- Indices
CREATE INDEX idx_dietary_restrictions_user ON user_dietary_restrictions(user_id, tenant_id);
CREATE INDEX idx_dietary_restrictions_type ON user_dietary_restrictions(restriction_type);

-- RLS (Row Level Security)
ALTER TABLE user_dietary_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own restrictions" ON user_dietary_restrictions
  USING (user_id = current_setting('app.user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.user_id')::uuid);
```

### 2.2 Valores Pre-definidos

| Tipo | Valores | Descricao |
|------|---------|-----------|
| **allergy** | gluten, lactose, peanut, tree_nuts, shellfish, fish, egg, soy, wheat, sesame | Alergias alimentares |
| **intolerance** | lactose, fructose, histamine, fodmap | Intolerancias |
| **diet** | vegetarian, vegan, pescatarian, low_carb, keto, paleo, mediterranean | Dietas |
| **religious** | halal, kosher, no_pork, no_beef | Restricoes religiosas |
| **medical** | diabetes, hypertension, celiac, phenylketonuria, gout, kidney_disease | Condicoes medicas |
| **preference** | no_sugar, organic_only, no_processed | Preferencias pessoais |

---

## 3. ARQUIVOS A CRIAR/MODIFICAR

### 3.1 Novos Arquivos

| Arquivo | Proposito |
|---------|-----------|
| `lib/repos/dietary-restrictions.repo.ts` | Repository CRUD para restricoes |
| `app/api/dietary-restrictions/route.ts` | API REST (GET, POST, DELETE) |
| `app/restricoes/page.tsx` | Pagina de gerenciamento de restricoes |
| `lib/constants/dietary-restrictions.ts` | Constantes com valores pre-definidos |

### 3.2 Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `lib/services/coach.service.ts` | Adicionar coleta e uso de restricoes no prompt |
| `app/onboarding/page.tsx` | Adicionar step opcional para restricoes |
| `app/account/page.tsx` | Link para pagina de restricoes |
| `docs/documentacao-completa.md` | Documentar nova funcionalidade |

---

## 4. IMPLEMENTACAO DETALHADA

### 4.1 Repository (`lib/repos/dietary-restrictions.repo.ts`)

```typescript
// Funcoes a implementar:
export async function getUserRestrictions(params: {
  userId: string;
  tenantId: string;
}): Promise<DietaryRestriction[]>

export async function addRestriction(params: {
  userId: string;
  tenantId: string;
  restrictionType: RestrictionType;
  restrictionValue: string;
  severity?: Severity;
  notes?: string;
}): Promise<DietaryRestriction>

export async function removeRestriction(params: {
  id: string;
  userId: string;
  tenantId: string;
}): Promise<void>

export async function updateRestriction(params: {
  id: string;
  userId: string;
  tenantId: string;
  severity?: Severity;
  notes?: string;
}): Promise<DietaryRestriction>
```

### 4.2 API (`app/api/dietary-restrictions/route.ts`)

| Metodo | Acao | Body/Query |
|--------|------|------------|
| GET | Listar restricoes do usuario | - |
| POST | Adicionar restricao | `{ restriction_type, restriction_value, severity?, notes? }` |
| DELETE | Remover restricao | `?id=UUID` |
| PATCH | Atualizar restricao | `{ id, severity?, notes? }` |

### 4.3 Pagina de Restricoes (`app/restricoes/page.tsx`)

**Layout:**
- Header com titulo "Restricoes Alimentares"
- Abas por categoria (Alergias, Intolerancias, Dietas, etc.)
- Chips selecionaveis para opcoes pre-definidas
- Campo de texto para adicionar restricao customizada
- Lista de restricoes ativas com botao de remover
- Para alergias: seletor de severidade (Leve, Moderada, Grave)

**Fluxo:**
1. Usuario acessa pagina
2. Sistema carrega restricoes existentes (GET)
3. Usuario clica em chip para adicionar (POST)
4. Usuario clica em X para remover (DELETE)
5. Mudancas salvas automaticamente

### 4.4 Integracao com Coach IA

**Modificar `gatherUserContext()`:**
```typescript
// Adicionar apos buscar userGoals (linha ~299)
const { rows: restrictions } = await pool.query(
  `SELECT restriction_type, restriction_value, severity, notes
   FROM user_dietary_restrictions
   WHERE user_id = $1 AND tenant_id = $2
   ORDER BY restriction_type, restriction_value`,
  [params.userId, params.tenantId]
);

context.dietaryRestrictions = restrictions.map(r => ({
  type: r.restriction_type,
  value: r.restriction_value,
  severity: r.severity,
  notes: r.notes
}));
```

**Modificar `buildCoachPrompt()`:**
```typescript
// Adicionar nova secao apos OBJETIVOS
if (context.dietaryRestrictions && context.dietaryRestrictions.length > 0) {
  prompt += `## RESTRICOES ALIMENTARES DO USUARIO\n\n`;
  prompt += `**IMPORTANTE:** O usuario possui as seguintes restricoes que DEVEM ser consideradas em TODAS as recomendacoes:\n\n`;

  const byType = groupBy(context.dietaryRestrictions, 'type');

  if (byType.allergy) {
    prompt += `**ALERGIAS (EVITAR COMPLETAMENTE):**\n`;
    byType.allergy.forEach(r => {
      prompt += `- ${formatRestrictionName(r.value)}`;
      if (r.severity === 'severe') prompt += ` [GRAVE - risco de anafilaxia]`;
      prompt += `\n`;
    });
  }

  if (byType.intolerance) {
    prompt += `\n**INTOLERANCIAS:**\n`;
    byType.intolerance.forEach(r => {
      prompt += `- ${formatRestrictionName(r.value)}\n`;
    });
  }

  if (byType.diet) {
    prompt += `\n**DIETA:**\n`;
    byType.diet.forEach(r => {
      prompt += `- ${formatRestrictionName(r.value)}\n`;
    });
  }

  if (byType.religious) {
    prompt += `\n**RESTRICOES RELIGIOSAS:**\n`;
    byType.religious.forEach(r => {
      prompt += `- ${formatRestrictionName(r.value)}\n`;
    });
  }

  if (byType.medical) {
    prompt += `\n**CONDICOES MEDICAS:**\n`;
    byType.medical.forEach(r => {
      prompt += `- ${formatRestrictionName(r.value)}\n`;
    });
  }

  prompt += `\n**DIRETRIZES:**\n`;
  prompt += `- NUNCA sugira alimentos que violem alergias (risco de saude)\n`;
  prompt += `- Adapte sugestoes de proteina para vegetarianos/veganos\n`;
  prompt += `- Considere restricoes religiosas em todas sugestoes\n`;
  prompt += `- Para condicoes medicas, foque em alimentos beneficos\n\n`;
}
```

### 4.5 Onboarding (Opcional)

**Adicionar Step 4 (opcional) em `app/onboarding/page.tsx`:**
- Titulo: "Restricoes Alimentares (opcional)"
- Subtitulo: "Voce tem alguma alergia, intolerancia ou dieta especial?"
- Opcoes rapidas: Gluten, Lactose, Vegetariano, Vegano
- Link "Pular" para quem nao tem restricoes
- Link "Configurar depois" para acessar via /restricoes

---

## 5. CONSTANTES (`lib/constants/dietary-restrictions.ts`)

```typescript
export const RESTRICTION_TYPES = {
  allergy: { label: 'Alergias', icon: '⚠️', color: '#ef4444' },
  intolerance: { label: 'Intolerancias', icon: '🚫', color: '#f59e0b' },
  diet: { label: 'Dietas', icon: '🥗', color: '#10b981' },
  religious: { label: 'Religiosas', icon: '🙏', color: '#6366f1' },
  medical: { label: 'Medicas', icon: '💊', color: '#ec4899' },
  preference: { label: 'Preferencias', icon: '👍', color: '#8b5cf6' }
} as const;

export const PREDEFINED_RESTRICTIONS = {
  allergy: [
    { value: 'gluten', label: 'Gluten' },
    { value: 'lactose', label: 'Lactose' },
    { value: 'peanut', label: 'Amendoim' },
    { value: 'tree_nuts', label: 'Castanhas/Nozes' },
    { value: 'shellfish', label: 'Frutos do Mar' },
    { value: 'fish', label: 'Peixes' },
    { value: 'egg', label: 'Ovo' },
    { value: 'soy', label: 'Soja' },
    { value: 'wheat', label: 'Trigo' },
    { value: 'sesame', label: 'Gergelim' }
  ],
  intolerance: [
    { value: 'lactose', label: 'Lactose' },
    { value: 'fructose', label: 'Frutose' },
    { value: 'histamine', label: 'Histamina' },
    { value: 'fodmap', label: 'FODMAPs' }
  ],
  diet: [
    { value: 'vegetarian', label: 'Vegetariano' },
    { value: 'vegan', label: 'Vegano' },
    { value: 'pescatarian', label: 'Pescatariano' },
    { value: 'low_carb', label: 'Low Carb' },
    { value: 'keto', label: 'Cetogenica' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'mediterranean', label: 'Mediterranea' }
  ],
  religious: [
    { value: 'halal', label: 'Halal' },
    { value: 'kosher', label: 'Kosher' },
    { value: 'no_pork', label: 'Sem Carne de Porco' },
    { value: 'no_beef', label: 'Sem Carne Bovina' }
  ],
  medical: [
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'hypertension', label: 'Hipertensao' },
    { value: 'celiac', label: 'Doenca Celiaca' },
    { value: 'phenylketonuria', label: 'Fenilcetonuria' },
    { value: 'gout', label: 'Gota' },
    { value: 'kidney_disease', label: 'Doenca Renal' }
  ],
  preference: [
    { value: 'no_sugar', label: 'Sem Acucar Refinado' },
    { value: 'organic_only', label: 'Apenas Organicos' },
    { value: 'no_processed', label: 'Sem Ultraprocessados' }
  ]
} as const;

export const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Leve', color: '#fef3c7' },
  { value: 'moderate', label: 'Moderada', color: '#fed7aa' },
  { value: 'severe', label: 'Grave', color: '#fecaca' }
] as const;
```

---

## 6. ORDEM DE IMPLEMENTACAO

| Etapa | Tarefa | Dependencias |
|-------|--------|--------------|
| 1 | Fornecer script SQL para usuario executar manualmente | - |
| 2 | Criar constantes (`dietary-restrictions.ts`) | - |
| 3 | Criar repository (`dietary-restrictions.repo.ts`) | Etapa 1 |
| 4 | Criar API (`/api/dietary-restrictions`) | Etapa 3 |
| 5 | Criar pagina (`/restricoes`) | Etapa 4 |
| 6 | Integrar com Coach IA | Etapa 3 |
| 7 | Adicionar link em `/account` | Etapa 5 |
| 8 | (Opcional) Adicionar step no onboarding | Etapa 5 |
| 9 | Atualizar documentacao | Todas |
| 10 | Testes e validacao | Todas |

**Nota:** O script SQL sera fornecido para execucao manual no Supabase (nao usamos migrations automaticas).

---

## 7. CASOS DE USO DO COACH IA

### 7.1 Exemplos de Comportamento Esperado

**Usuario Vegetariano:**
- Recomendacao: "Aumente proteina para 140g/dia com **leguminosas, tofu, ovos e laticinios**"
- NAO recomendar: carnes, peixes

**Usuario com Alergia a Gluten (Grave):**
- Recomendacao: "Para aumentar carboidratos, inclua **arroz, batata, quinoa, mandioca**"
- NAO recomendar: pao, massas, cereais com gluten
- Warning: "Atencao: evitar contaminacao cruzada com gluten"

**Usuario Diabetico:**
- Recomendacao: "Prefira carboidratos de baixo indice glicemico"
- Insight: "Seu consumo de acucar esta adequado para controle glicemico"
- Warning se consumo de acucar alto

**Usuario Halal:**
- Recomendacao: "Para aumentar proteina, inclua **frango, carne bovina halal, peixes, ovos**"
- NAO recomendar: carne de porco, derivados

---

## 8. FUTURAS EXPANSOES (Fora do Escopo Atual)

- **Analise de Refeicoes:** Alertar quando alimento contem ingrediente restrito
- **Sugestoes de Compras:** Filtrar sugestoes baseadas nas restricoes
- **Banco de Alimentos:** Marcar alimentos como compativeis/incompativeis
- **Historico:** Rastrear violacoes de restricoes ao longo do tempo
- **IA na Captura:** Gemini alertar sobre ingredientes restritos na foto

---

## 9. ESTIMATIVA DE ARQUIVOS

| Tipo | Quantidade | Linhas Estimadas |
|------|------------|------------------|
| Script SQL (manual) | 1 | ~30 |
| Constantes TS | 1 | ~80 |
| Repository TS | 1 | ~120 |
| API Route TS | 1 | ~150 |
| Pagina TSX | 1 | ~400 |
| Modificacoes | 3 | ~100 |
| **Total** | **8** | **~880** |

---

## 10. APROVACAO

- [ ] Modelo de dados aprovado
- [ ] Fluxo de UI aprovado
- [ ] Integracao com Coach IA aprovada
- [ ] Ordem de implementacao aprovada

---

*Plano elaborado em 28/12/2024*
