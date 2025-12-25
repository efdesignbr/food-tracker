# Plano: Funcionalidade "Lista de Compras"

## Visão Geral

Nova seção no app para gerenciamento de listas de compras com:
- Criação livre de listas
- Sugestões baseadas nos alimentos mais consumidos
- Aceitar/rejeitar sugestões diretamente na lista
- Histórico de listas salvas

---

## Estrutura do Banco de Dados

### Tabela: `shopping_lists`
```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,           -- "Compras da semana", "Mercado 25/12"
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'completed', 'archived'
  completed_at TIMESTAMP,               -- Quando foi finalizada

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id, tenant_id);
CREATE INDEX idx_shopping_lists_status ON shopping_lists(user_id, status, created_at DESC);
```

### Tabela: `shopping_items`
```sql
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,

  name VARCHAR(200) NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit VARCHAR(50),                      -- "kg", "un", "pacote", etc
  category VARCHAR(50),                  -- "Frutas", "Carnes", "Laticínios"

  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMP,

  -- Origem do item
  source VARCHAR(20) DEFAULT 'manual',   -- 'manual', 'suggestion', 'taco', 'food_bank'
  source_id UUID,                        -- ID do food_bank ou taco se aplicável
  suggestion_status VARCHAR(20),         -- 'pending', 'accepted', 'rejected' (só para sugestões)

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shopping_items_list ON shopping_items(list_id);
CREATE INDEX idx_shopping_items_purchased ON shopping_items(list_id, is_purchased);
```

---

## Estrutura de Arquivos

```
app/
├── lista-compras/
│   └── page.tsx                    # Página principal

app/api/
├── shopping-lists/
│   ├── route.ts                    # CRUD listas (GET, POST)
│   ├── [id]/
│   │   └── route.ts                # GET, PATCH, DELETE lista específica
│   ├── items/
│   │   └── route.ts                # CRUD itens (POST, PATCH, DELETE)
│   └── suggestions/
│       └── route.ts                # GET sugestões baseadas em consumo

lib/repos/
├── shopping-list.repo.ts           # Funções de acesso ao banco
```

---

## API Endpoints

### Listas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/shopping-lists` | Listar todas as listas do usuário |
| POST | `/api/shopping-lists` | Criar nova lista |
| GET | `/api/shopping-lists/[id]` | Obter lista específica com itens |
| PATCH | `/api/shopping-lists/[id]` | Atualizar lista (nome, status) |
| DELETE | `/api/shopping-lists/[id]` | Excluir lista |

### Itens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/shopping-lists/items` | Adicionar item à lista |
| PATCH | `/api/shopping-lists/items?id=X` | Atualizar item (marcar comprado, etc) |
| DELETE | `/api/shopping-lists/items?id=X` | Remover item |

### Sugestões

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/shopping-lists/suggestions` | Obter alimentos mais consumidos |

---

## Interface do Usuário

### Tela Principal (`/lista-compras`)

```
┌─────────────────────────────────────────────────┐
│  Lista de Compras                    [+ Nova]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  LISTAS ATIVAS                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ 📋 Compras da Semana        12 itens    │   │
│  │    Criada em 25/12          [Abrir]     │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ 📋 Mercado                   5 itens    │   │
│  │    Criada em 23/12          [Abrir]     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  LISTAS CONCLUÍDAS (últimas 5)                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ✅ Compras 20/12             8 itens    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Modal: Nova Lista

```
┌─────────────────────────────────────────────────┐
│  Nova Lista de Compras                     [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Nome da lista:                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Compras da semana                       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ☐ Adicionar sugestões baseadas no meu  │   │
│  │   histórico de consumo                  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│           [Cancelar]    [Criar Lista]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Tela: Detalhes da Lista

```
┌─────────────────────────────────────────────────┐
│  ← Voltar    Compras da Semana      [⋮ Menu]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [+ Adicionar Item]    [💡 Sugestões]           │
│                                                 │
│  ─── PENDENTES (8) ────────────────────────    │
│                                                 │
│  ☐ Arroz integral         2 kg      [🗑]       │
│  ☐ Peito de frango        1 kg      [🗑]       │
│  ☐ Ovos                   2 dúzias  [🗑]       │
│  ☐ Banana                 1 cacho   [🗑]       │
│                                                 │
│  ─── SUGESTÕES (4) ────────────────────────    │
│  (baseado no seu consumo)                       │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Leite integral  1L     [✓ Aceitar] [✗]  │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ Maçã           6 un    [✓ Aceitar] [✗]  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ─── COMPRADOS (4) ────────────────────────    │
│                                                 │
│  ✅ Café                   500g               │
│  ✅ Azeite                 1 garrafa          │
│                                                 │
│  ───────────────────────────────────────────   │
│  [Finalizar Lista]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Modal: Adicionar Item

```
┌─────────────────────────────────────────────────┐
│  Adicionar Item                            [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Nome do item:                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Arroz integral                          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Quantidade:        Unidade:                    │
│  ┌──────────┐      ┌──────────────────────┐   │
│  │ 2        │      │ kg              ▼    │   │
│  └──────────┘      └──────────────────────┘   │
│                                                 │
│  Categoria (opcional):                          │
│  ┌─────────────────────────────────────────┐   │
│  │ Cereais e grãos                    ▼    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│           [Cancelar]    [Adicionar]             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Lógica de Sugestões

### Query para obter alimentos mais consumidos:

```sql
WITH food_consumption AS (
  SELECT
    LOWER(TRIM(fi.name)) as food_name,
    COUNT(*) as consumption_count,
    COUNT(DISTINCT DATE(m.consumed_at)) as days_consumed,
    AVG(fi.quantity) as avg_quantity,
    MAX(fi.unit) as common_unit,
    MAX(m.consumed_at) as last_consumed
  FROM food_items fi
  JOIN meals m ON fi.meal_id = m.id
  WHERE m.user_id = $1
    AND m.tenant_id = $2
    AND m.status = 'approved'
    AND m.consumed_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY LOWER(TRIM(fi.name))
  HAVING COUNT(*) >= 2  -- Consumido pelo menos 2x
)
SELECT * FROM food_consumption
ORDER BY consumption_count DESC, days_consumed DESC
LIMIT 10;
```

### Categorias sugeridas (baseadas na TACO):

- Cereais e derivados
- Verduras e legumes
- Frutas
- Carnes e derivados
- Leite e derivados
- Bebidas
- Ovos
- Gorduras e óleos

---

## Navegação

Adicionar ao menu em `components/AppLayout.tsx`:

```typescript
{ href: '/lista-compras', label: 'Lista de Compras', icon: '🛒' }
```

---

## Ordem de Implementação

### Fase 1: Base (MVP)
1. Criar tabelas no banco de dados
2. Criar `lib/repos/shopping-list.repo.ts`
3. Criar endpoints básicos (CRUD listas e itens)
4. Criar página `/lista-compras` com funcionalidade básica
5. Adicionar ao menu de navegação

### Fase 2: Sugestões
6. Implementar query de alimentos mais consumidos
7. Criar endpoint `/api/shopping-lists/suggestions`
8. Adicionar seção de sugestões na interface
9. Implementar aceitar/rejeitar sugestões

### Fase 3: Refinamentos
10. Adicionar categorias aos itens
11. Ordenação por categoria
12. Filtros (mostrar só pendentes, etc)
13. Histórico de listas concluídas

---

## Estimativa de Arquivos

| Arquivo | Tipo | Complexidade |
|---------|------|--------------|
| `app/lista-compras/page.tsx` | Novo | Alta |
| `lib/repos/shopping-list.repo.ts` | Novo | Média |
| `app/api/shopping-lists/route.ts` | Novo | Média |
| `app/api/shopping-lists/[id]/route.ts` | Novo | Média |
| `app/api/shopping-lists/items/route.ts` | Novo | Média |
| `app/api/shopping-lists/suggestions/route.ts` | Novo | Média |
| `components/AppLayout.tsx` | Editar | Baixa |
| SQL (tabelas) | Novo | Baixa |

---

## Considerações Técnicas

1. **Multi-tenancy**: Todas as queries incluem `tenant_id` e `user_id`
2. **Transações**: Usar BEGIN/COMMIT para operações que afetam múltiplas tabelas
3. **Validação**: Zod schemas para validar inputs
4. **Performance**: Índices nas colunas mais consultadas
5. **UX**: Loading states, confirmações para delete, mensagens de sucesso/erro
