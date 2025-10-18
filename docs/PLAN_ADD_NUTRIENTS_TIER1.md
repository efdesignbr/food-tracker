# 🎯 PLANO: Adicionar 7 Nutrientes Essenciais (Tier 1)

**Data de Criação**: 18/10/2025, 14:10
**Data de Atualização**: 18/10/2025, 14:10
**Status**: 📋 Planejamento Completo
**Objetivo**: Adicionar rastreamento de 7 nutrientes essenciais de forma segura e incremental

---

## 📊 Contexto

### Situação Atual
- ✅ Rastreamos 7 nutrientes básicos: calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g
- ✅ `saturated_fat` existe APENAS na tabela `food_bank`
- ❌ Vários nutrientes importantes NÃO são rastreados em refeições
- ✅ Sistema já funciona bem, mas incompleto

### Por que adicionar AGORA?
1. **Momento ideal**: Pouco dado no sistema ainda (migração simples)
2. **Saúde completa**: Rastrear deficiências e excessos importantes
3. **Profissionalismo**: Sistema completo e competitivo
4. **Uma migração só**: Melhor fazer tudo de uma vez
5. **Diferencial**: Poucos apps rastreiam isso tudo

---

## 🎯 Objetivo

### Adicionar 7 Nutrientes Essenciais (Tier 1):

1. ✅ **Gordura Saturada** (saturated_fat_g) - Saúde cardiovascular
2. ✅ **Gordura Trans** (trans_fat_g) - Altamente prejudicial
3. ✅ **Colesterol** (cholesterol_mg) - Saúde cardíaca
4. ✅ **Cálcio** (calcium_mg) - Saúde óssea
5. ✅ **Ferro** (iron_mg) - Prevenção de anemia
6. ✅ **Potássio** (potassium_mg) - Pressão arterial
7. ✅ **Vitamina D** (vitamin_d_mcg) - Deficiência muito comum

### Onde adicionar:
- ✅ Tabela `nutrition_data` (refeições)
- ✅ Tabela `food_bank` (banco de alimentos)
- ✅ Interface de captura `/capture`
- ✅ Interface `/meus-alimentos`
- ✅ Análise de IA
- ✅ Repositórios e APIs

**SEM QUEBRAR NADA DO QUE JÁ FUNCIONA**

---

## 🔍 Análise de Impacto

### Arquivos que PRECISAM ser modificados:

1. **Banco de Dados** (1 arquivo)
   - `migrations/014_add_tier1_nutrients.sql` (NOVO)

2. **Types/Schemas** (3 arquivos)
   - `lib/ai.ts` - tipo `AiFood`
   - `lib/schemas/meal.ts` - schema de validação
   - `lib/repos/meal.repo.ts` - tipo `DbFoodItem` e queries
   - `lib/repos/food-bank.repo.ts` - queries

3. **APIs** (3 arquivos)
   - `app/api/meals/analyze-meal/route.ts` - passar para IA
   - `app/api/meals/approve/route.ts` - salvar no banco
   - `app/api/food-bank/route.ts` - criar/atualizar alimentos

4. **Frontend** (2 arquivos)
   - `app/capture/page.tsx` - adicionar 7 campos editáveis
   - `app/meus-alimentos/page.tsx` - adicionar 7 campos

### Arquivos que NÃO precisam mudar (por enquanto):
- ❌ Dashboard (pode usar valores se existirem)
- ❌ Relatórios (podem incluir depois)
- ❌ Histórico (já mostra o que existe)

---

## 📋 PLANO DE EXECUÇÃO (7 ETAPAS)

### 🔷 ETAPA 1: Criar e Aplicar Migração no Banco
**Objetivo**: Adicionar 7 colunas nas tabelas `nutrition_data` e `food_bank`

#### Passos:
1. Criar arquivo `migrations/014_add_tier1_nutrients.sql`
2. Migração deve ser ADITIVA (não remove nada)
3. Todas as colunas devem ser NULLABLE (não quebra dados existentes)
4. Testar localmente primeiro

#### Código da Migração:

```sql
-- Migration #014: Add Tier 1 Essential Nutrients
-- Date: 18/10/2025
-- Description: Add 7 essential nutrients to nutrition tracking
-- SAFE: Additive only, nullable columns, backwards compatible

-- ============================================================
-- PART 1: Update nutrition_data (meals)
-- ============================================================

ALTER TABLE nutrition_data
ADD COLUMN saturated_fat_g NUMERIC(10,2) NULL,
ADD COLUMN trans_fat_g NUMERIC(10,2) NULL,
ADD COLUMN cholesterol_mg NUMERIC(10,2) NULL,
ADD COLUMN calcium_mg NUMERIC(10,2) NULL,
ADD COLUMN iron_mg NUMERIC(10,2) NULL,
ADD COLUMN potassium_mg NUMERIC(10,2) NULL,
ADD COLUMN vitamin_d_mcg NUMERIC(10,2) NULL;

-- Add comments
COMMENT ON COLUMN nutrition_data.saturated_fat_g IS 'Gordura saturada em gramas';
COMMENT ON COLUMN nutrition_data.trans_fat_g IS 'Gordura trans em gramas';
COMMENT ON COLUMN nutrition_data.cholesterol_mg IS 'Colesterol em miligramas';
COMMENT ON COLUMN nutrition_data.calcium_mg IS 'Cálcio em miligramas';
COMMENT ON COLUMN nutrition_data.iron_mg IS 'Ferro em miligramas';
COMMENT ON COLUMN nutrition_data.potassium_mg IS 'Potássio em miligramas';
COMMENT ON COLUMN nutrition_data.vitamin_d_mcg IS 'Vitamina D em microgramas';

-- ============================================================
-- PART 2: Update food_bank (user's food database)
-- ============================================================
-- Note: saturated_fat already exists in food_bank, so we skip it

ALTER TABLE food_bank
ADD COLUMN trans_fat NUMERIC(10,2) NULL,
ADD COLUMN cholesterol NUMERIC(10,2) NULL,
ADD COLUMN calcium NUMERIC(10,2) NULL,
ADD COLUMN iron NUMERIC(10,2) NULL,
ADD COLUMN potassium NUMERIC(10,2) NULL,
ADD COLUMN vitamin_d NUMERIC(10,2) NULL;

-- Add comments
COMMENT ON COLUMN food_bank.trans_fat IS 'Gordura trans em gramas';
COMMENT ON COLUMN food_bank.cholesterol IS 'Colesterol em miligramas';
COMMENT ON COLUMN food_bank.calcium IS 'Cálcio em miligramas';
COMMENT ON COLUMN food_bank.iron IS 'Ferro em miligramas';
COMMENT ON COLUMN food_bank.potassium IS 'Potássio em miligramas';
COMMENT ON COLUMN food_bank.vitamin_d IS 'Vitamina D em microgramas';

-- ============================================================
-- VERIFICATION QUERIES (optional, for testing)
-- ============================================================

-- Verify nutrition_data columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nutrition_data'
  AND column_name IN (
    'saturated_fat_g', 'trans_fat_g', 'cholesterol_mg',
    'calcium_mg', 'iron_mg', 'potassium_mg', 'vitamin_d_mcg'
  )
ORDER BY column_name;

-- Verify food_bank columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'food_bank'
  AND column_name IN (
    'saturated_fat', 'trans_fat', 'cholesterol',
    'calcium', 'iron', 'potassium', 'vitamin_d'
  )
ORDER BY column_name;
```

#### Teste desta etapa:
```bash
# 1. Executar migração
npx dotenv-cli -e .env.local -- npx tsx scripts/apply-migrations.ts

# 2. Verificar que colunas foram criadas
npx dotenv-cli -e .env.local -- npx tsx scripts/extract-schema.ts

# 3. Verificar em docs/database/CURRENT_SCHEMA.md que os 7 campos aparecem

# 4. TESTAR APP: Tudo deve continuar funcionando normalmente!
# - Capturar foto de refeição
# - Aprovar refeição
# - Ver no dashboard
# - Cadastrar alimento
```

#### Critério de Sucesso:
- ✅ Migração aplicada sem erros
- ✅ 7 colunas existem em `nutrition_data`
- ✅ 6 colunas novas existem em `food_bank` (saturated_fat já existia)
- ✅ App continua funcionando (refeições antigas sem os campos)
- ✅ Nenhum erro no console

#### Rollback se der errado:
```sql
-- nutrition_data
ALTER TABLE nutrition_data
DROP COLUMN saturated_fat_g,
DROP COLUMN trans_fat_g,
DROP COLUMN cholesterol_mg,
DROP COLUMN calcium_mg,
DROP COLUMN iron_mg,
DROP COLUMN potassium_mg,
DROP COLUMN vitamin_d_mcg;

-- food_bank
ALTER TABLE food_bank
DROP COLUMN trans_fat,
DROP COLUMN cholesterol,
DROP COLUMN calcium,
DROP COLUMN iron,
DROP COLUMN potassium,
DROP COLUMN vitamin_d;
```

---

### 🔷 ETAPA 2: Atualizar Type `AiFood` (lib/ai.ts)
**Objetivo**: IA saber que pode retornar os 7 novos nutrientes

#### Modificação em `lib/ai.ts`:

```typescript
// ANTES:
export type AiFood = {
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  sugar_g?: number;
};

// DEPOIS:
export type AiFood = {
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  sugar_g?: number;
  saturated_fat_g?: number;     // 🆕 NOVO
  trans_fat_g?: number;          // 🆕 NOVO
  cholesterol_mg?: number;       // 🆕 NOVO
  calcium_mg?: number;           // 🆕 NOVO
  iron_mg?: number;              // 🆕 NOVO
  potassium_mg?: number;         // 🆕 NOVO
  vitamin_d_mcg?: number;        // 🆕 NOVO
};
```

#### Teste desta etapa:
```bash
# 1. Compilar TypeScript
npm run build

# 2. Verificar que não há erros de tipo
# 3. App deve continuar funcionando
```

#### Critério de Sucesso:
- ✅ TypeScript compila sem erros
- ✅ App continua funcionando
- ✅ Nenhum erro no console

---

### 🔷 ETAPA 3: Atualizar Prompts da IA
**Objetivo**: IA começar a retornar os 7 novos nutrientes

#### 3A - Modificar `app/api/meals/analyze-meal/route.ts` (linha ~50):

**ANTES**:
```typescript
return `${f.name} (${f.quantity} ${f.unit}) - Do banco de alimentos: ${f.calories} kcal, ${f.protein_g}g proteína, ${f.carbs_g}g carboidrato, ${f.fat_g}g gordura, ${f.fiber_g}g fibras, ${f.sodium_mg}mg sódio, ${f.sugar_g}g açúcar`;
```

**DEPOIS**:
```typescript
const parts = [
  `${f.name} (${f.quantity} ${f.unit}) - Do banco de alimentos:`,
  `${f.calories} kcal`,
  `${f.protein_g}g proteína`,
  `${f.carbs_g}g carboidrato`,
  `${f.fat_g}g gordura`
];

// Adiciona nutrientes se existirem
if (f.fiber_g !== undefined && f.fiber_g !== null) {
  parts.push(`${f.fiber_g}g fibras`);
}
if (f.sodium_mg !== undefined && f.sodium_mg !== null) {
  parts.push(`${f.sodium_mg}mg sódio`);
}
if (f.sugar_g !== undefined && f.sugar_g !== null) {
  parts.push(`${f.sugar_g}g açúcar`);
}
// 🆕 NOVOS NUTRIENTES
if (f.saturated_fat !== undefined && f.saturated_fat !== null) {
  parts.push(`${f.saturated_fat}g gordura saturada`);
}
if (f.trans_fat !== undefined && f.trans_fat !== null) {
  parts.push(`${f.trans_fat}g gordura trans`);
}
if (f.cholesterol !== undefined && f.cholesterol !== null) {
  parts.push(`${f.cholesterol}mg colesterol`);
}
if (f.calcium !== undefined && f.calcium !== null) {
  parts.push(`${f.calcium}mg cálcio`);
}
if (f.iron !== undefined && f.iron !== null) {
  parts.push(`${f.iron}mg ferro`);
}
if (f.potassium !== undefined && f.potassium !== null) {
  parts.push(`${f.potassium}mg potássio`);
}
if (f.vitamin_d !== undefined && f.vitamin_d !== null) {
  parts.push(`${f.vitamin_d}mcg vitamina D`);
}

return parts.join(', ');
```

#### 3B - Atualizar exemplo JSON no prompt (linha ~65):

**ADICIONAR no exemplo**:
```typescript
{
  "name": "Arroz",
  "quantity": 2,
  "unit": "colheres",
  "calories": 130,
  "protein_g": 2.7,
  "carbs_g": 28,
  "fat_g": 0.3,
  "fiber_g": 0.4,
  "sodium_mg": 1,
  "sugar_g": 0.1,
  "saturated_fat_g": 0.1,      // 🆕 ADICIONAR
  "trans_fat_g": 0,            // 🆕 ADICIONAR
  "cholesterol_mg": 0,         // 🆕 ADICIONAR
  "calcium_mg": 10,            // 🆕 ADICIONAR
  "iron_mg": 0.2,              // 🆕 ADICIONAR
  "potassium_mg": 35,          // 🆕 ADICIONAR
  "vitamin_d_mcg": 0           // 🆕 ADICIONAR
}
```

#### 3C - Atualizar análise de rótulos `lib/ai/nutrition-label-analyzer.ts`:

Adicionar instruções para extrair os 7 novos campos no prompt.

#### Teste desta etapa:
```bash
# 1. Testar análise de refeição (foto ou texto)
# 2. Verificar no console do navegador o JSON retornado pela IA
# 3. Verificar se os novos campos aparecem (podem ser null/0)
# 4. App deve continuar funcionando
```

#### Critério de Sucesso:
- ✅ IA retorna os novos campos (mesmo que 0 ou null)
- ✅ Análise continua funcionando
- ✅ Nenhum erro no console

---

### 🔷 ETAPA 4: Adicionar Campos no Frontend `/capture`
**Objetivo**: Usuário poder visualizar e editar os 7 nutrientes

#### Modificação em `app/capture/page.tsx`:

**Reorganizar campos por CATEGORIAS** (depois de `sugar_g`, linha ~784):

```tsx
{/* CATEGORIAS ORGANIZADAS */}

{/* 1. MACRONUTRIENTES PRINCIPAIS - já existem */}
<div style={{...}}>
  <h4>Macronutrientes Principais</h4>
  {/* calories, protein_g, carbs_g, fat_g */}
</div>

{/* 2. 🆕 GORDURAS DETALHADAS */}
<div style={{ marginTop: 20 }}>
  <h4 style={{
    fontSize: 14,
    fontWeight: 700,
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }}>
    🧈 Gorduras Detalhadas
  </h4>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12
  }}>
    {/* Gordura Saturada */}
    <div>
      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
        🔴 Gord. Sat. (g)
      </label>
      <input
        type="number"
        step="0.1"
        value={food.saturated_fat_g || ''}
        onChange={e => {
          const updated = [...analysis.foods];
          updated[i].saturated_fat_g = Number(e.target.value) || undefined;
          setAnalysis({ ...analysis, foods: updated });
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 14,
          border: '1px solid #d1d5db',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box'
        }}
        placeholder="0"
      />
    </div>

    {/* Gordura Trans */}
    <div>
      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
        ⚠️ Gord. Trans (g)
      </label>
      <input
        type="number"
        step="0.1"
        value={food.trans_fat_g || ''}
        onChange={e => {
          const updated = [...analysis.foods];
          updated[i].trans_fat_g = Number(e.target.value) || undefined;
          setAnalysis({ ...analysis, foods: updated });
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 14,
          border: '1px solid #d1d5db',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box'
        }}
        placeholder="0"
      />
    </div>

    {/* Colesterol */}
    <div>
      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
        💊 Colesterol (mg)
      </label>
      <input
        type="number"
        step="1"
        value={food.cholesterol_mg || ''}
        onChange={e => {
          const updated = [...analysis.foods];
          updated[i].cholesterol_mg = Number(e.target.value) || undefined;
          setAnalysis({ ...analysis, foods: updated });
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 14,
          border: '1px solid #d1d5db',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box'
        }}
        placeholder="0"
      />
    </div>
  </div>
</div>

{/* 3. CARBOIDRATOS E FIBRAS - já existem */}
<div style={{ marginTop: 20 }}>
  <h4>🌾 Carboidratos e Fibras</h4>
  {/* fiber_g, sugar_g */}
</div>

{/* 4. 🆕 MINERAIS */}
<div style={{ marginTop: 20 }}>
  <h4 style={{
    fontSize: 14,
    fontWeight: 700,
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }}>
    ⚛️ Minerais Essenciais
  </h4>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12
  }}>
    {/* Cálcio */}
    <div>
      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
        🦴 Cálcio (mg)
      </label>
      <input
        type="number"
        step="1"
        value={food.calcium_mg || ''}
        onChange={e => {
          const updated = [...analysis.foods];
          updated[i].calcium_mg = Number(e.target.value) || undefined;
          setAnalysis({ ...analysis, foods: updated });
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 14,
          border: '1px solid #d1d5db',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box'
        }}
        placeholder="0"
      />
    </div>

    {/* Ferro */}
    <div>
      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
        🩸 Ferro (mg)
      </label>
      <input
        type="number"
        step="0.1"
        value={food.iron_mg || ''}
        onChange={e => {
          const updated = [...analysis.foods];
          updated[i].iron_mg = Number(e.target.value) || undefined;
          setAnalysis({ ...analysis, foods: updated });
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 14,
          border: '1px solid #d1d5db',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box'
        }}
        placeholder="0"
      />
    </div>

    {/* Potássio */}
    <div>
      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
        💚 Potássio (mg)
      </label>
      <input
        type="number"
        step="1"
        value={food.potassium_mg || ''}
        onChange={e => {
          const updated = [...analysis.foods];
          updated[i].potassium_mg = Number(e.target.value) || undefined;
          setAnalysis({ ...analysis, foods: updated });
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 14,
          border: '1px solid #d1d5db',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box'
        }}
        placeholder="0"
      />
    </div>
  </div>
</div>

{/* 5. 🆕 VITAMINAS E OUTROS */}
<div style={{ marginTop: 20 }}>
  <h4 style={{
    fontSize: 14,
    fontWeight: 700,
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }}>
    💊 Vitaminas e Outros
  </h4>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12
  }}>
    {/* Sódio - já existe, mover para cá */}
    <div>
      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
        🧂 Sódio (mg)
      </label>
      {/* ... código existente ... */}
    </div>

    {/* Vitamina D */}
    <div>
      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
        ☀️ Vitamina D (mcg)
      </label>
      <input
        type="number"
        step="0.1"
        value={food.vitamin_d_mcg || ''}
        onChange={e => {
          const updated = [...analysis.foods];
          updated[i].vitamin_d_mcg = Number(e.target.value) || undefined;
          setAnalysis({ ...analysis, foods: updated });
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 14,
          border: '1px solid #d1d5db',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box'
        }}
        placeholder="0"
      />
    </div>
  </div>
</div>
```

#### Teste desta etapa:
```bash
# 1. Capturar foto de refeição
# 2. Verificar que TODAS as categorias aparecem:
#    - Macronutrientes Principais (4 campos)
#    - Gorduras Detalhadas (3 campos) 🆕
#    - Carboidratos e Fibras (2 campos)
#    - Minerais Essenciais (3 campos) 🆕
#    - Vitaminas e Outros (2 campos) 🆕
# 3. Editar valores manualmente
# 4. Verificar que valores são mantidos
# 5. NÃO APROVAR ainda (próxima etapa)
```

#### Critério de Sucesso:
- ✅ 14 campos aparecem na tela (7 antigos + 7 novos)
- ✅ Organizados em 5 categorias
- ✅ Pode editar todos os valores
- ✅ Valores são mantidos no estado
- ✅ CSS responsivo (não vaza em mobile)

---

### 🔷 ETAPA 5: Atualizar Schema de Validação
**Objetivo**: Validar que os 7 novos campos são aceitos

#### Modificar `lib/schemas/meal.ts`:

```typescript
const FoodItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  calories: z.number().optional(),
  protein_g: z.number().optional(),
  carbs_g: z.number().optional(),
  fat_g: z.number().optional(),
  fiber_g: z.number().optional(),
  sodium_mg: z.number().optional(),
  sugar_g: z.number().optional(),
  saturated_fat_g: z.number().optional(),   // 🆕
  trans_fat_g: z.number().optional(),       // 🆕
  cholesterol_mg: z.number().optional(),    // 🆕
  calcium_mg: z.number().optional(),        // 🆕
  iron_mg: z.number().optional(),           // 🆕
  potassium_mg: z.number().optional(),      // 🆕
  vitamin_d_mcg: z.number().optional()      // 🆕
});
```

#### Teste desta etapa:
```bash
# 1. Verificar que TypeScript compila
# 2. Tentar aprovar refeição (pode falhar ainda, normal)
# 3. Verificar mensagem de erro (deve ser clara)
```

#### Critério de Sucesso:
- ✅ TypeScript compila
- ✅ Schema aceita os novos campos
- ✅ Validação funciona

---

### 🔷 ETAPA 6: Salvar no Banco (APIs + Repos)
**Objetivo**: Persistir os 7 nutrientes no banco de dados

#### 6.1 - Modificar `app/api/meals/approve/route.ts` (linha ~69):

```typescript
foods: data.foods.map((f: any) => ({
  name: f.name,
  quantity: f.quantity,
  unit: f.unit,
  calories: f.calories ?? undefined,
  protein_g: f.protein_g ?? undefined,
  carbs_g: f.carbs_g ?? undefined,
  fat_g: f.fat_g ?? undefined,
  fiber_g: f.fiber_g ?? undefined,
  sodium_mg: f.sodium_mg ?? undefined,
  sugar_g: f.sugar_g ?? undefined,
  saturated_fat_g: f.saturated_fat_g ?? undefined,     // 🆕
  trans_fat_g: f.trans_fat_g ?? undefined,             // 🆕
  cholesterol_mg: f.cholesterol_mg ?? undefined,       // 🆕
  calcium_mg: f.calcium_mg ?? undefined,               // 🆕
  iron_mg: f.iron_mg ?? undefined,                     // 🆕
  potassium_mg: f.potassium_mg ?? undefined,           // 🆕
  vitamin_d_mcg: f.vitamin_d_mcg ?? undefined          // 🆕
}))
```

#### 6.2 - Modificar `lib/repos/meal.repo.ts`:

**A) Tipo (linha ~38)**:
```typescript
foods: Array<{
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
  confidence?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  sugar_g?: number;
  saturated_fat_g?: number;      // 🆕
  trans_fat_g?: number;          // 🆕
  cholesterol_mg?: number;       // 🆕
  calcium_mg?: number;           // 🆕
  iron_mg?: number;              // 🆕
  potassium_mg?: number;         // 🆕
  vitamin_d_mcg?: number;        // 🆕
}>;
```

**B) Condição hasAny (linha ~82)**:
```typescript
const hasAny = (
  typeof f.calories === 'number' ||
  typeof (f as any).protein_g === 'number' ||
  typeof (f as any).carbs_g === 'number' ||
  typeof (f as any).fat_g === 'number' ||
  typeof (f as any).fiber_g === 'number' ||
  typeof (f as any).sodium_mg === 'number' ||
  typeof (f as any).sugar_g === 'number' ||
  typeof (f as any).saturated_fat_g === 'number' ||    // 🆕
  typeof (f as any).trans_fat_g === 'number' ||        // 🆕
  typeof (f as any).cholesterol_mg === 'number' ||     // 🆕
  typeof (f as any).calcium_mg === 'number' ||         // 🆕
  typeof (f as any).iron_mg === 'number' ||            // 🆕
  typeof (f as any).potassium_mg === 'number' ||       // 🆕
  typeof (f as any).vitamin_d_mcg === 'number'         // 🆕
);
```

**C) Query INSERT (linha ~93)**:
```sql
INSERT INTO nutrition_data (
  food_item_id, tenant_id,
  calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g,
  saturated_fat_g, trans_fat_g, cholesterol_mg,
  calcium_mg, iron_mg, potassium_mg, vitamin_d_mcg
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
ON CONFLICT (food_item_id)
DO UPDATE SET
  calories = COALESCE(EXCLUDED.calories, nutrition_data.calories),
  protein_g = COALESCE(EXCLUDED.protein_g, nutrition_data.protein_g),
  carbs_g = COALESCE(EXCLUDED.carbs_g, nutrition_data.carbs_g),
  fat_g = COALESCE(EXCLUDED.fat_g, nutrition_data.fat_g),
  fiber_g = COALESCE(EXCLUDED.fiber_g, nutrition_data.fiber_g),
  sodium_mg = COALESCE(EXCLUDED.sodium_mg, nutrition_data.sodium_mg),
  sugar_g = COALESCE(EXCLUDED.sugar_g, nutrition_data.sugar_g),
  saturated_fat_g = COALESCE(EXCLUDED.saturated_fat_g, nutrition_data.saturated_fat_g),
  trans_fat_g = COALESCE(EXCLUDED.trans_fat_g, nutrition_data.trans_fat_g),
  cholesterol_mg = COALESCE(EXCLUDED.cholesterol_mg, nutrition_data.cholesterol_mg),
  calcium_mg = COALESCE(EXCLUDED.calcium_mg, nutrition_data.calcium_mg),
  iron_mg = COALESCE(EXCLUDED.iron_mg, nutrition_data.iron_mg),
  potassium_mg = COALESCE(EXCLUDED.potassium_mg, nutrition_data.potassium_mg),
  vitamin_d_mcg = COALESCE(EXCLUDED.vitamin_d_mcg, nutrition_data.vitamin_d_mcg)
```

**D) Parâmetros (linha ~104)**:
```typescript
[
  foodItem.id,
  args.tenantId,
  f.calories ?? 0,
  (f as any).protein_g ?? 0,
  (f as any).carbs_g ?? 0,
  (f as any).fat_g ?? 0,
  (f as any).fiber_g ?? 0,
  (f as any).sodium_mg ?? null,
  (f as any).sugar_g ?? null,
  (f as any).saturated_fat_g ?? null,      // 🆕
  (f as any).trans_fat_g ?? null,          // 🆕
  (f as any).cholesterol_mg ?? null,       // 🆕
  (f as any).calcium_mg ?? null,           // 🆕
  (f as any).iron_mg ?? null,              // 🆕
  (f as any).potassium_mg ?? null,         // 🆕
  (f as any).vitamin_d_mcg ?? null         // 🆕
]
```

**E) Repetir TUDO para `insertMealWithItemsTx`** (segunda função)

#### 6.3 - Modificar `app/api/food-bank/route.ts`:

Adicionar os 6 novos campos (saturated_fat já existe):
- `createSchema` (linha ~19)
- `updateSchema` (linha ~38)
- Funções POST e PATCH

#### 6.4 - Modificar `lib/repos/food-bank.repo.ts`:

Adicionar os 6 campos nas queries de create/update

#### Teste desta etapa:
```bash
# TESTE COMPLETO END-TO-END:

# 1. Capturar foto de refeição
# 2. Verificar que IA retorna os novos campos
# 3. Editar valores se necessário
# 4. Aprovar refeição
# 5. Verificar que salvou sem erros
# 6. Verificar no Supabase dashboard que os valores estão no banco
# 7. Capturar outra refeição SEM preencher novos campos
# 8. Aprovar e verificar que funciona (null)
# 9. Cadastrar alimento no banco com todos os campos
# 10. Usar esse alimento em uma refeição
```

#### Critério de Sucesso:
- ✅ Refeição salva COM todos os 7 nutrientes
- ✅ Refeição salva SEM os novos campos (vazios)
- ✅ Dados corretos no banco
- ✅ Alimentos do banco com 7 campos
- ✅ Nenhum erro no console
- ✅ Refeições antigas continuam funcionando

---

### 🔷 ETAPA 7: Atualizar `/meus-alimentos` + Testes Finais
**Objetivo**: Adicionar os 7 campos no banco de alimentos e testar tudo

#### 7.1 - Modificar `app/meus-alimentos/page.tsx`:

Adicionar os 7 campos em:
- Formulário manual
- Formulário com IA (análise de rótulo)
- Modal de edição

Usar a mesma estrutura de categorias do `/capture`.

#### 7.2 - Testes de Regressão Completos:

1. ✅ Cadastrar alimento manual com TODOS os campos
2. ✅ Cadastrar alimento via IA (foto de rótulo)
3. ✅ Editar alimento existente e adicionar novos nutrientes
4. ✅ Capturar refeição do banco de alimentos
5. ✅ Capturar refeição nova (foto)
6. ✅ Capturar refeição manual
7. ✅ Aprovar refeição com todos os campos preenchidos
8. ✅ Aprovar refeição com campos vazios
9. ✅ Verificar refeições antigas (devem continuar visíveis)
10. ✅ Verificar dashboard (não deve quebrar)

#### 7.3 - Documentação:
1. Atualizar `docs/database/CURRENT_SCHEMA.md` (rodar script)
2. Marcar este plano como ✅ CONCLUÍDO
3. Atualizar `TECHNICAL_DOCUMENTATION.md`

---

## 🚨 Pontos de Atenção (CUIDADO!)

### ⚠️ Riscos e Como Mitigar:

1. **Migração falhar**
   - ✅ Migração é ADITIVA (não remove nada)
   - ✅ Todas as colunas são NULLABLE
   - ✅ Testar em local primeiro
   - ✅ Ter rollback pronto

2. **TypeScript não compilar**
   - ✅ Todos os campos OPTIONAL (`?`)
   - ✅ Testar build antes de commit

3. **Query SQL com número errado de parâmetros**
   - ✅ Contar os `$1, $2, ...` vs. array
   - ✅ Testar inserção real no banco

4. **Refeições antigas quebrarem**
   - ✅ Campos NULLABLE no banco
   - ✅ Campos OPTIONAL no TypeScript
   - ✅ Usar `?? null` em queries

5. **Interface muito poluída**
   - ✅ Organizados em 5 categorias
   - ✅ Seções com títulos claros
   - ✅ Grid responsivo

6. **IA não preencher tudo**
   - ✅ Campos OPTIONAL
   - ✅ Aceita null/undefined
   - ✅ Usuário edita manualmente

---

## 📝 Checklist de Segurança

Antes de cada commit:

- [ ] TypeScript compila sem erros
- [ ] Next.js inicia sem erros
- [ ] Nenhum erro no console
- [ ] Testar fluxo completo (foto → análise → aprovação)
- [ ] Testar com campos vazios
- [ ] Testar com campos preenchidos
- [ ] Verificar banco de dados
- [ ] Refeições antigas funcionam
- [ ] Banco de alimentos funciona

---

## 🎯 Ordem de Execução

```
ETAPA 1: Migração (7 colunas)
   ↓ TESTAR
ETAPA 2: Types (AiFood)
   ↓ TESTAR
ETAPA 3: Prompts IA
   ↓ TESTAR
ETAPA 4: Frontend /capture (14 campos)
   ↓ TESTAR
ETAPA 5: Schema Validação
   ↓ TESTAR
ETAPA 6: Salvar Banco (APIs + Repos)
   ↓ TESTAR TUDO
ETAPA 7: /meus-alimentos + Testes
   ↓
✅ CONCLUÍDO
```

**NUNCA pular etapas!**
**SEMPRE testar após cada modificação!**

---

## 📊 Estimativa de Tempo

- ETAPA 1: ~5 min (migração + teste)
- ETAPA 2: ~2 min (types)
- ETAPA 3: ~10 min (prompts IA)
- ETAPA 4: ~15 min (frontend capture - 7 campos)
- ETAPA 5: ~2 min (schema)
- ETAPA 6: ~20 min (repos + APIs)
- ETAPA 7: ~25 min (meus-alimentos + testes completos)

**TOTAL: ~80 minutos** (1h20min com testes cuidadosos)

---

## ✅ Critérios de Conclusão

Projeto estará concluído quando:

1. ✅ 7 campos existem em `nutrition_data`
2. ✅ 6 campos novos em `food_bank`
3. ✅ IA retorna os 7 campos
4. ✅ Frontend permite editar 14 campos (7+7)
5. ✅ API valida e salva tudo
6. ✅ Refeições COM nutrientes funcionam
7. ✅ Refeições SEM nutrientes funcionam
8. ✅ Refeições ANTIGAS funcionam
9. ✅ Banco de alimentos completo
10. ✅ Todos os testes passam
11. ✅ Documentação atualizada
12. ✅ Zero erros no console

---

## 📞 Em Caso de Problemas

Se algo der errado:

1. **PARE imediatamente**
2. **NÃO prossiga** para próxima etapa
3. **Reverta** a mudança
4. **Teste** que voltou ao normal
5. **Analise** o que deu errado
6. **Corrija** e tente novamente

**Lembre-se**: É melhor demorar mais e fazer certo! 🛡️

---

**Documento criado por**: Claude Code
**Última atualização**: 18/10/2025, 14:10
**Status**: 📋 Aguardando aprovação para execução
**Versão**: 2.0 (expandido para 7 nutrientes Tier 1)
