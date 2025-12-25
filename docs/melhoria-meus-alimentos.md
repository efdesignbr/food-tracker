# Plano: Melhoria do Modulo "Meus Alimentos"

## Objetivo

Adicionar campo `compravel` (boolean) e categoria aos alimentos cadastrados em "Meus Alimentos", permitindo que as sugestoes da lista de compras filtrem apenas alimentos que podem ser comprados no mercado.

**Exemplos:**
- Arroz, ovo, iogurte, pao de forma → compravel = true
- Bolo de aveia, tilapia grelhada → compravel = false (feito em casa)

---

## Estrutura Atual

### Tabela `food_bank`
- `id`, `tenant_id`, `user_id`, `name`, `brand`, `serving_size`
- Dados nutricionais: `calories`, `protein`, `carbs`, `fat`, etc.
- `source`: 'manual' | 'ai_analyzed'
- `taco_id`: referencia opcional para TACO
- `usage_count`, `last_used_at`

### Categorias TACO disponiveis (14)
1. Bebidas
2. Carnes e derivados
3. Cereais e derivados
4. Frutas e derivados
5. Gorduras e oleos
6. Industrializados
7. Leguminosas e derivados
8. Leite e derivados
9. Miscelaneas
10. Nozes e sementes
11. Ovos e derivados
12. Pescados e frutos do mar
13. Produtos acucarados
14. Verduras, hortalicas e derivados

---

## Alteracoes Propostas

### 1. Alterar tabela `food_bank`

```sql
-- Adicionar novos campos
ALTER TABLE food_bank ADD COLUMN purchasable BOOLEAN DEFAULT FALSE;
ALTER TABLE food_bank ADD COLUMN category VARCHAR(100);

-- Indice para filtros
CREATE INDEX idx_food_bank_purchasable ON food_bank(tenant_id, user_id, purchasable);
CREATE INDEX idx_food_bank_category ON food_bank(tenant_id, user_id, category);
```

**Campos novos:**
- `purchasable`: boolean (default: false) - pode ser comprado no mercado?
- `category`: categoria do alimento (usando categorias TACO)

---

### 2. Atualizar repo `food-bank.repo.ts`

**Alterar interface `FoodBankItem`:**
```typescript
interface FoodBankItem {
  // ... campos existentes
  purchasable: boolean;
  category: string | null;
}
```

**Alterar `CreateFoodBankItemArgs`:**
```typescript
interface CreateFoodBankItemArgs {
  // ... campos existentes
  purchasable?: boolean;
  category?: string;
}
```

**Alterar funcoes:**
- `createFoodBankItem`: incluir `purchasable` e `category` no INSERT
- `updateFoodBankItem`: permitir atualizar `purchasable` e `category`
- `listFoodBankItems`: adicionar filtro opcional por `purchasable`

---

### 3. Atualizar API `/api/food-bank`

**POST - Criar:**
- Aceitar campos `purchasable` (boolean) e `category`
- Validar `category` contra lista de categorias TACO

**PATCH - Atualizar:**
- Permitir atualizar `purchasable` e `category`

**GET - Listar:**
- Adicionar query param `purchasable` para filtrar

---

### 4. Atualizar pagina `/meus-alimentos/page.tsx`

**Formulario de cadastro (modo manual e modo IA):**

Adicionar campos:
```
[ ] Pode ser comprado no mercado

Categoria:
[ Selecione... v ]
  - Bebidas
  - Carnes e derivados
  - Cereais e derivados
  - ...
```

**Estados novos:**
```typescript
const [purchasable, setPurchasable] = useState(false);
const [category, setCategory] = useState<string>('');
```

**Listagem:**
- Mostrar icone de carrinho se `purchasable = true`
- Mostrar categoria

**Edicao:**
- Permitir alterar `purchasable` e categoria

---

### 5. Atualizar sugestoes da lista de compras

**Alterar query em `shopping-list.repo.ts`:**

```sql
-- Buscar apenas alimentos compraveis do food_bank mais usados
SELECT
  fb.name as food_name,
  fb.usage_count as consumption_count,
  fb.serving_size as common_unit,
  fb.category
FROM food_bank fb
WHERE fb.user_id = $1
  AND fb.tenant_id = $2
  AND fb.purchasable = TRUE  -- FILTRO NOVO
  AND fb.usage_count >= 2
ORDER BY fb.usage_count DESC
LIMIT $3
```

Ou manter a query atual de `food_items` mas cruzar com `food_bank`:

```sql
WITH food_consumption AS (
  SELECT
    LOWER(TRIM(fi.name)) as food_name,
    COUNT(*) as consumption_count,
    ...
  FROM food_items fi
  JOIN meals m ON fi.meal_id = m.id
  WHERE ...
  GROUP BY LOWER(TRIM(fi.name))
  HAVING COUNT(*) >= 2
)
SELECT fc.*
FROM food_consumption fc
-- Incluir apenas se existir em food_bank como compravel
WHERE EXISTS (
  SELECT 1 FROM food_bank fb
  WHERE fb.user_id = $1
    AND fb.tenant_id = $2
    AND LOWER(TRIM(fb.name)) = fc.food_name
    AND fb.purchasable = TRUE
)
ORDER BY fc.consumption_count DESC
LIMIT $3
```

---

### 6. Sugestoes baseadas em listas anteriores

**Nova funcao em `shopping-list.repo.ts`:**

```sql
-- Buscar itens mais frequentes em listas concluidas
SELECT
  LOWER(TRIM(si.name)) as food_name,
  COUNT(*) as list_count,
  MAX(si.quantity) as avg_quantity,
  MAX(si.unit) as common_unit
FROM shopping_items si
JOIN shopping_lists sl ON si.list_id = sl.id
WHERE sl.user_id = $1
  AND sl.tenant_id = $2
  AND sl.status = 'completed'
GROUP BY LOWER(TRIM(si.name))
HAVING COUNT(*) >= 2
ORDER BY list_count DESC
LIMIT $3
```

**Combinar fontes de sugestao:**
1. Itens de listas anteriores (mais relevante para compras)
2. Alimentos do food_bank com `purchasable = true`
3. Alimentos mais consumidos em refeicoes

---

### 7. Duplicar lista

**Nova funcao em `shopping-list.repo.ts`:**

```typescript
export async function duplicateShoppingList(args: {
  tenantId: string;
  userId: string;
  sourceListId: string;
  newName: string;
}): Promise<ShoppingList>
```

**Logica:**
1. Buscar lista original e seus itens
2. Criar nova lista com `newName`
3. Copiar todos os itens (resetando `is_purchased = false`)
4. Retornar nova lista

**Endpoint:**
```
POST /api/shopping-lists/duplicate
Body: { source_list_id: string, name: string }
```

**UI:**
- Botao "Duplicar" nas listas (ativas e concluidas)
- Modal pedindo nome da nova lista (sugestao: "Copia de {nome}")

---

## Arquivos a Modificar (atualizado)

| Arquivo | Alteracao |
|---------|-----------|
| SQL (direto no banco) | ALTER TABLE food_bank |
| `lib/repos/food-bank.repo.ts` | Novos campos e filtros |
| `lib/repos/shopping-list.repo.ts` | Sugestoes de listas + duplicar |
| `app/api/food-bank/route.ts` | Validacao e novos campos |
| `app/api/shopping-lists/duplicate/route.ts` | Novo endpoint |
| `app/api/shopping-lists/suggestions/route.ts` | Combinar fontes |
| `app/meus-alimentos/page.tsx` | Formulario e listagem |
| `app/lista-compras/page.tsx` | Botao duplicar |

---

## Ordem de Implementacao (atualizado)

### Fase 1: Banco e Backend
1. Rodar ALTER TABLE no banco (SQL direto)
2. Atualizar `food-bank.repo.ts`
3. Atualizar `/api/food-bank`
4. Testar via curl/Postman

### Fase 2: Frontend Meus Alimentos
5. Adicionar campos no formulario de cadastro
6. Atualizar listagem com badges
7. Atualizar modal de edicao
8. Testar no iOS

### Fase 3: Sugestoes Melhoradas
9. Adicionar funcao de sugestoes baseadas em listas
10. Combinar fontes no endpoint de sugestoes
11. Testar sugestoes filtradas

### Fase 4: Duplicar Lista
12. Adicionar funcao `duplicateShoppingList` no repo
13. Criar endpoint `/api/shopping-lists/duplicate`
14. Adicionar botao duplicar na UI
15. Testar no iOS

### Fase 5: Deploy
16. Testar fluxo completo
17. Deploy final

---

## Consideracoes

1. **Migracao de dados existentes**: Alimentos ja cadastrados terao `purchasable = false` por default. Usuario pode editar para marcar como compravel.

2. **Analise IA**: Quando a IA analisa um rotulo de produto industrializado, pode marcar `purchasable = true` automaticamente.

3. **Categoria obrigatoria?**: Deixar opcional, mas exibir alerta sugerindo preencher.

4. **UX mobile**: Checkbox e select precisam funcionar bem no iOS.

5. **Prioridade de sugestoes**: Itens de listas anteriores > food_bank compravel > consumo em refeicoes.
