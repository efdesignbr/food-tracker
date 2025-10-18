# 🎯 PLANO: Adicionar Campo `saturated_fat` nas Refeições

**Data de Criação**: 18/10/2025, 13:55
**Status**: 📋 Planejamento
**Objetivo**: Adicionar rastreamento de gordura saturada nas refeições de forma segura e incremental

---

## 📊 Contexto

### Situação Atual
- ✅ `saturated_fat` existe na tabela `food_bank` (banco de alimentos)
- ❌ `saturated_fat` NÃO existe na tabela `nutrition_data` (refeições)
- ✅ Já rastreamos 7 nutrientes: calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g
- ✅ Gordura saturada é importante para saúde cardiovascular

### Por que adicionar?
1. Nutriente importante para saúde
2. Consistência: já existe no banco de alimentos
3. Dados já disponíveis via IA (pode extrair de fotos)
4. Completar perfil nutricional completo

---

## 🎯 Objetivo

Adicionar campo `saturated_fat` em:
- ✅ Tabela `nutrition_data` (banco de dados)
- ✅ Interface de captura `/capture`
- ✅ Análise de IA
- ✅ Repositórios e APIs

**SEM QUEBRAR NADA DO QUE JÁ FUNCIONA**

---

## 🔍 Análise de Impacto

### Arquivos que PRECISAM ser modificados:

1. **Banco de Dados** (1 arquivo)
   - `migrations/014_add_saturated_fat_to_nutrition.sql` (NOVO)

2. **Types/Schemas** (3 arquivos)
   - `lib/ai.ts` - tipo `AiFood`
   - `lib/schemas/meal.ts` - schema de validação
   - `lib/repos/meal.repo.ts` - tipo `DbFoodItem` e queries

3. **APIs** (2 arquivos)
   - `app/api/meals/analyze-meal/route.ts` - passar para IA
   - `app/api/meals/approve/route.ts` - salvar no banco

4. **Frontend** (1 arquivo)
   - `app/capture/page.tsx` - adicionar campo editável

### Arquivos que NÃO precisam mudar:
- ❌ `food_bank` (já tem o campo)
- ❌ `meus-alimentos` (já funciona)
- ❌ Dashboard/relatórios (podem vir depois)

---

## 📋 PLANO DE EXECUÇÃO (7 ETAPAS)

### 🔷 ETAPA 1: Criar e Aplicar Migração no Banco
**Objetivo**: Adicionar coluna `saturated_fat` na tabela `nutrition_data`

#### Passos:
1. Criar arquivo `migrations/014_add_saturated_fat_to_nutrition.sql`
2. Migração deve ser ADITIVA (não remove nada)
3. Coluna deve ser NULLABLE (não quebra dados existentes)
4. Testar localmente primeiro

#### Código da Migração:
```sql
-- Migration: Add saturated_fat to nutrition_data
-- Date: 18/10/2025
-- SAFE: Aditiva, não quebra dados existentes

ALTER TABLE nutrition_data
ADD COLUMN saturated_fat NUMERIC(10,2) NULL;

COMMENT ON COLUMN nutrition_data.saturated_fat IS 'Gordura saturada em gramas';
```

#### Teste desta etapa:
```bash
# 1. Executar migração
npx tsx scripts/apply-migrations.ts

# 2. Verificar que coluna foi criada
npx tsx scripts/extract-schema.ts

# 3. Verificar em docs/database/CURRENT_SCHEMA.md que saturated_fat aparece

# 4. TESTAR APP: Tudo deve continuar funcionando normalmente!
# - Capturar foto de refeição
# - Aprovar refeição
# - Ver no dashboard
```

#### Critério de Sucesso:
- ✅ Migração aplicada sem erros
- ✅ Coluna existe no schema
- ✅ App continua funcionando (refeições antigas sem o campo)
- ✅ Nenhum erro no console

#### Rollback se der errado:
```sql
ALTER TABLE nutrition_data DROP COLUMN saturated_fat;
```

---

### 🔷 ETAPA 2: Atualizar Type `AiFood` (lib/ai.ts)
**Objetivo**: IA saber que pode retornar `saturated_fat`

#### Modificação:
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
  saturated_fat_g?: number;  // 🆕 NOVO CAMPO
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

### 🔷 ETAPA 3: Atualizar Prompt da IA (api/meals/analyze-meal)
**Objetivo**: IA começar a retornar gordura saturada

#### Modificação em `/app/api/meals/analyze-meal/route.ts`:

**Linha ~50** (onde monta descrição do alimento do banco):
```typescript
// ADICIONAR saturated_fat na descrição:
if (f.saturated_fat !== undefined && f.saturated_fat !== null) {
  parts.push(`${f.saturated_fat}g gordura saturada`);
}
```

**Linha ~65** (prompt para a IA):
```typescript
// ADICIONAR no exemplo JSON:
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
  "saturated_fat_g": 0.1  // 🆕 ADICIONAR
}
```

#### Teste desta etapa:
```bash
# 1. Testar análise de refeição
# 2. Verificar no console do navegador o JSON retornado pela IA
# 3. Verificar se saturated_fat_g aparece (pode ser null/undefined por enquanto)
# 4. App deve continuar funcionando
```

#### Critério de Sucesso:
- ✅ IA retorna o novo campo (mesmo que 0 ou null)
- ✅ Análise continua funcionando
- ✅ Nenhum erro no console

---

### 🔷 ETAPA 4: Adicionar Campo no Frontend (/capture)
**Objetivo**: Usuário poder visualizar e editar gordura saturada

#### Modificação em `/app/capture/page.tsx`:

**Adicionar campo editável** (depois de `sugar_g`, linha ~784):
```tsx
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
```

#### Teste desta etapa:
```bash
# 1. Capturar foto de refeição
# 2. Verificar que campo "Gord. Sat." aparece
# 3. Editar o valor manualmente
# 4. Verificar que valor é mantido
# 5. NÃO APROVAR ainda (próxima etapa)
```

#### Critério de Sucesso:
- ✅ Campo aparece na tela
- ✅ Pode editar o valor
- ✅ Valor é mantido no estado
- ✅ CSS responsivo (não vaza do box em mobile)

---

### 🔷 ETAPA 5: Atualizar Schema de Validação (lib/schemas/meal.ts)
**Objetivo**: Validar que `saturated_fat_g` é aceito na API

#### Modificação em `/lib/schemas/meal.ts`:

Encontrar o schema do food e adicionar:
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
  saturated_fat_g: z.number().optional()  // 🆕 ADICIONAR
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
- ✅ Schema aceita o novo campo
- ✅ Validação funciona

---

### 🔷 ETAPA 6: Salvar no Banco (api/meals/approve + meal.repo)
**Objetivo**: Persistir `saturated_fat` no banco de dados

#### 6.1 - Modificação em `/app/api/meals/approve/route.ts` (linha ~79):
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
  saturated_fat_g: f.saturated_fat_g ?? undefined  // 🆕 ADICIONAR
}))
```

#### 6.2 - Modificação em `/lib/repos/meal.repo.ts`:

**Tipo (linha ~38)**:
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
  saturated_fat_g?: number;  // 🆕 ADICIONAR
}>;
```

**Condição hasAny (linha ~88)**:
```typescript
const hasAny = (
  typeof f.calories === 'number' ||
  typeof (f as any).protein_g === 'number' ||
  typeof (f as any).carbs_g === 'number' ||
  typeof (f as any).fat_g === 'number' ||
  typeof (f as any).fiber_g === 'number' ||
  typeof (f as any).sodium_mg === 'number' ||
  typeof (f as any).sugar_g === 'number' ||
  typeof (f as any).saturated_fat_g === 'number'  // 🆕 ADICIONAR
);
```

**Query INSERT (linha ~94)**:
```sql
INSERT INTO nutrition_data (
  food_item_id, tenant_id, calories, protein_g, carbs_g,
  fat_g, fiber_g, sodium_mg, sugar_g, saturated_fat_g
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
ON CONFLICT (food_item_id)
DO UPDATE SET
  calories = COALESCE(EXCLUDED.calories, nutrition_data.calories),
  protein_g = COALESCE(EXCLUDED.protein_g, nutrition_data.protein_g),
  carbs_g = COALESCE(EXCLUDED.carbs_g, nutrition_data.carbs_g),
  fat_g = COALESCE(EXCLUDED.fat_g, nutrition_data.fat_g),
  fiber_g = COALESCE(EXCLUDED.fiber_g, nutrition_data.fiber_g),
  sodium_mg = COALESCE(EXCLUDED.sodium_mg, nutrition_data.sodium_mg),
  sugar_g = COALESCE(EXCLUDED.sugar_g, nutrition_data.sugar_g),
  saturated_fat_g = COALESCE(EXCLUDED.saturated_fat_g, nutrition_data.saturated_fat_g)
```

**Parâmetros (linha ~104)**:
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
  (f as any).saturated_fat_g ?? null  // 🆕 ADICIONAR
]
```

**Repetir o mesmo para `insertMealWithItemsTx`** (segunda função no mesmo arquivo)

#### Teste desta etapa:
```bash
# TESTE COMPLETO END-TO-END:

# 1. Capturar foto de refeição
# 2. Verificar que IA retorna saturated_fat_g
# 3. Editar valor se necessário
# 4. Aprovar refeição
# 5. Verificar que salvou sem erros
# 6. Verificar no banco (Supabase dashboard) que o valor está lá
# 7. Capturar outra refeição SEM saturated_fat (deixar vazio)
# 8. Aprovar e verificar que funciona (null/0)
```

#### Critério de Sucesso:
- ✅ Refeição salva COM saturated_fat
- ✅ Refeição salva SEM saturated_fat (campos vazios)
- ✅ Dados aparecem corretamente no banco
- ✅ Nenhum erro no console
- ✅ Refeições antigas continuam funcionando

---

### 🔷 ETAPA 7: Testes Finais e Documentação
**Objetivo**: Garantir que tudo funciona e documentar

#### Testes de Regressão:
1. ✅ Cadastrar alimento manual em "Meus Alimentos" (COM saturated_fat)
2. ✅ Cadastrar alimento via IA em "Meus Alimentos" (foto de rótulo)
3. ✅ Editar alimento existente e adicionar saturated_fat
4. ✅ Capturar refeição do banco de alimentos
5. ✅ Capturar refeição nova (foto)
6. ✅ Capturar refeição manual (adicionar alimento novo)
7. ✅ Aprovar refeição com todos os campos preenchidos
8. ✅ Aprovar refeição com saturated_fat vazio
9. ✅ Verificar refeições antigas (devem continuar visíveis)
10. ✅ Verificar dashboard (não deve quebrar)

#### Documentação:
1. Atualizar `docs/database/CURRENT_SCHEMA.md` (rodar script)
2. Marcar este plano como ✅ CONCLUÍDO
3. Adicionar comentário sobre saturated_fat em código relevante

---

## 🚨 Pontos de Atenção (CUIDADO!)

### ⚠️ Riscos e Como Mitigar:

1. **Migração falhar**
   - ✅ Migração é ADITIVA (não remove nada)
   - ✅ Coluna é NULLABLE (não quebra dados existentes)
   - ✅ Testar em ambiente local primeiro
   - ✅ Ter rollback pronto

2. **TypeScript não compilar**
   - ✅ Adicionar campo como OPTIONAL (`?`)
   - ✅ Testar build antes de commit

3. **Query SQL com número errado de parâmetros**
   - ✅ Contar os `$1, $2, ...` e os valores no array
   - ✅ Testar inserção no banco

4. **Refeições antigas quebrarem**
   - ✅ Campo é NULLABLE no banco
   - ✅ Campo é OPTIONAL no TypeScript
   - ✅ Usar `?? null` ou `?? undefined` em queries

5. **IA não retornar o campo**
   - ✅ Campo é OPTIONAL
   - ✅ Sistema aceita null/undefined
   - ✅ Usuário pode editar manualmente

---

## 📝 Checklist de Segurança

Antes de cada commit, verificar:

- [ ] TypeScript compila sem erros (`npm run build`)
- [ ] Next.js inicia sem erros (`npm run dev`)
- [ ] Nenhum erro no console do navegador
- [ ] Testar fluxo completo (foto → análise → aprovação)
- [ ] Testar com campos vazios
- [ ] Testar com campos preenchidos
- [ ] Verificar banco de dados (dados corretos)
- [ ] Refeições antigas continuam funcionando

---

## 🎯 Ordem de Execução

### Sequência OBRIGATÓRIA:

```
1. ETAPA 1 (Migração)
   ↓ TESTAR
   ↓
2. ETAPA 2 (Type)
   ↓ TESTAR
   ↓
3. ETAPA 3 (Prompt IA)
   ↓ TESTAR
   ↓
4. ETAPA 4 (Frontend)
   ↓ TESTAR
   ↓
5. ETAPA 5 (Schema Validação)
   ↓ TESTAR
   ↓
6. ETAPA 6 (Salvar Banco)
   ↓ TESTAR TUDO
   ↓
7. ETAPA 7 (Testes Finais)
   ↓
✅ CONCLUÍDO
```

**NUNCA pular etapas!**
**SEMPRE testar após cada modificação!**

---

## 📊 Estimativa de Tempo

- ETAPA 1: ~5 min (migração + teste)
- ETAPA 2: ~2 min (type)
- ETAPA 3: ~5 min (prompt IA)
- ETAPA 4: ~5 min (frontend)
- ETAPA 5: ~2 min (schema)
- ETAPA 6: ~10 min (repo + API)
- ETAPA 7: ~15 min (testes completos)

**TOTAL: ~45 minutos** (com testes cuidadosos)

---

## ✅ Critérios de Conclusão

Projeto estará concluído quando:

1. ✅ Campo `saturated_fat` existe no banco
2. ✅ IA retorna o campo (quando possível)
3. ✅ Frontend permite editar o campo
4. ✅ API valida e salva o campo
5. ✅ Refeições COM saturated_fat funcionam
6. ✅ Refeições SEM saturated_fat funcionam
7. ✅ Refeições ANTIGAS continuam funcionando
8. ✅ Todos os testes passam
9. ✅ Documentação atualizada
10. ✅ Zero erros no console

---

## 📞 Em Caso de Problemas

Se algo der errado em qualquer etapa:

1. **PARE imediatamente**
2. **NÃO prossiga** para próxima etapa
3. **Reverta** a mudança que causou o problema
4. **Teste** que o sistema voltou ao normal
5. **Analise** o que deu errado
6. **Corrija** e tente novamente

**Lembre-se**: É melhor demorar mais e fazer certo do que quebrar o que funciona! 🛡️

---

**Documento criado por**: Claude Code
**Última atualização**: 18/10/2025, 13:55
**Status**: 📋 Aguardando aprovação para execução
