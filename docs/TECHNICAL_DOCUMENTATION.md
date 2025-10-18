# 📚 Food Tracker - Documentação Técnica Completa

**Versão**: 1.0
**Data**: 18/10/2025
**Gerado automaticamente**: Sim
**Status**: ✅ Atualizado

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Banco de Dados](#banco-de-dados)
6. [APIs e Endpoints](#apis-e-endpoints)
7. [Autenticação e Autorização](#autenticação-e-autorização)
8. [Frontend - Páginas](#frontend---páginas)
9. [Integrações com IA](#integrações-com-ia)
10. [Fluxos Principais](#fluxos-principais)
11. [Segurança](#segurança)
12. [Convenções e Padrões](#convenções-e-padrões)
13. [Migrações](#migrações)
14. [Monitoramento e Logs](#monitoramento-e-logs)

---

## 🎯 Visão Geral

### O que é o Food Tracker?

Sistema completo de rastreamento nutricional que permite:
- 📸 Capturar refeições via foto ou descrição textual
- 🤖 Análise automática de valores nutricionais via IA
- 🍎 Banco de alimentos personalizado
- 📊 Relatórios de consumo e saúde
- 💧 Rastreamento de água e evacuações
- ⚖️ Controle de peso
- 🍽️ Rastreamento de restaurantes

### Principais Características

- ✅ **Multi-tenant**: Suporta múltiplos usuários/tenants isolados
- ✅ **IA Integrada**: Google Gemini para análise de refeições e rótulos
- ✅ **PWA Ready**: Suporte a Progressive Web App
- ✅ **Banco de Dados Robusto**: PostgreSQL (Supabase)
- ✅ **Type-Safe**: TypeScript em todo o projeto
- ✅ **API RESTful**: Endpoints bem estruturados
- ✅ **Autenticação Segura**: NextAuth.js com bcrypt

---

## 🏗️ Arquitetura

### Arquitetura Geral

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  Pages  │  │Components│  │  State  │  │ Styles  │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────┴──────────────────────────────────┐
│                   API LAYER (Next.js API)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth API   │  │  Meals API   │  │  Food Bank   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Reports API │  │  Water API   │  │  Weight API  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼─────┐
│  PostgreSQL  │ │  Gemini  │ │  Storage  │
│  (Supabase)  │ │    AI    │ │  (Cloud)  │
└──────────────┘ └──────────┘ └───────────┘
```

### Decisões Arquiteturais

#### 1. **Arquitetura Multi-Tenant**
- **Decisão**: Todas as tabelas têm `tenant_id`
- **Motivo**: Isolamento de dados entre diferentes organizações/famílias
- **Implementação**: Middleware verifica tenant em cada request
- **Arquivo**: `lib/tenant.ts`

#### 2. **RLS Desabilitado (Row Level Security)**
- **Decisão**: RLS está desabilitado em todas as tabelas
- **Motivo**: Controle manual via `tenant_id` em queries
- **Trade-off**: Mais controle no código vs. menos segurança no DB
- **Arquivo**: `migrations/009_consolidate_rls_state.sql`

#### 3. **Imagens Não Persistidas**
- **Decisão**: Fotos de refeições NÃO são armazenadas
- **Motivo**: Redução de custos, performance e LGPD
- **Uso**: Apenas para análise da IA, depois descartadas
- **Arquivo**: `app/api/meals/approve/route.ts:38-44`

#### 4. **Transações no Route-Level**
- **Decisão**: Transações SQL gerenciadas nas rotas da API
- **Motivo**: Controle fino sobre commits/rollbacks
- **Implementação**: `BEGIN`, `COMMIT`, `ROLLBACK` manual
- **Arquivo**: `app/api/meals/approve/route.ts:54-88`

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: Next.js 14.2.5 (App Router)
- **Runtime**: Node.js
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL via Supabase
- **ORM/Query**: pg (node-postgres) - Queries SQL diretas
- **Autenticação**: NextAuth.js
- **Validação**: Zod
- **Hash de Senhas**: bcryptjs

### Frontend
- **Framework**: Next.js 14.2.5 (React 18)
- **Linguagem**: TypeScript
- **Styling**: Inline styles (CSS-in-JS)
- **PWA**: next-pwa
- **Estado**: React useState/useEffect (sem Redux)
- **Forms**: Manipulação manual com controlled components

### IA e Análise
- **Provider**: Google Gemini (generative-ai)
- **Modelos**:
  - `gemini-1.5-flash` - Análise rápida de refeições
  - `gemini-1.5-pro` - Análise detalhada de rótulos
- **Arquivo**: `lib/ai.ts`

### Infraestrutura
- **Hosting**: Vercel (presumido)
- **Database**: Supabase PostgreSQL
- **Storage**: Cloud (configurável)
- **Environment**: .env.local

---

## 📁 Estrutura do Projeto

```
food-tracker/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard principal
│   ├── capture/                  # Captura de refeições
│   ├── meus-alimentos/          # Banco de alimentos
│   ├── history/                  # Histórico de refeições
│   ├── reports/                  # Relatórios
│   ├── restaurants/              # Gestão de restaurantes
│   ├── peso/                     # Controle de peso
│   ├── account/                  # Configurações de conta
│   ├── login/                    # Autenticação
│   ├── signup/                   # Registro
│   └── api/                      # API Routes
│       ├── auth/                 # Autenticação
│       ├── meals/                # Refeições
│       ├── food-bank/           # Banco de alimentos
│       ├── water-intake/        # Água
│       ├── bowel-movements/     # Evacuações
│       ├── weight/              # Peso
│       ├── restaurants/         # Restaurantes
│       ├── reports/             # Relatórios
│       └── user/                # Perfil do usuário
│
├── lib/                          # Bibliotecas e utilitários
│   ├── ai.ts                    # Integração com Gemini
│   ├── ai/                      # Módulos de IA
│   │   ├── nutrition-label-analyzer.ts
│   │   └── reports-analyzer.ts
│   ├── auth.ts                  # Configuração NextAuth
│   ├── db.ts                    # Pool de conexões PostgreSQL
│   ├── tenant.ts                # Multi-tenancy
│   ├── rbac.ts                  # Controle de acesso
│   ├── repos/                   # Repositórios (Data Access)
│   │   ├── meal.repo.ts
│   │   ├── food-bank.repo.ts
│   │   ├── weight.repo.ts
│   │   └── bowel-movement.repo.ts
│   ├── schemas/                 # Validação Zod
│   │   ├── meal.ts
│   │   └── report.ts
│   ├── types/                   # TypeScript types
│   │   └── auth.ts
│   ├── storage.ts               # Gestão de arquivos
│   ├── logger.ts                # Logs
│   ├── env.ts                   # Variáveis de ambiente
│   └── constants.ts             # Constantes
│
├── migrations/                   # Migrações SQL
│   ├── 001_create_tenants.sql
│   ├── 002_add_tenant_id.sql
│   ├── 003_users_auth.sql
│   └── ...
│
├── scripts/                      # Scripts utilitários
│   ├── extract-schema.ts        # Extrai schema do DB
│   ├── apply-migrations.ts      # Aplica migrações
│   └── ...
│
├── docs/                         # Documentação
│   ├── TECHNICAL_DOCUMENTATION.md  # Este arquivo
│   ├── PLAN_ADD_SATURATED_FAT.md
│   ├── database/
│   │   └── CURRENT_SCHEMA.md
│   └── migrations/
│
├── public/                       # Assets estáticos
│   ├── icons/                   # Ícones PWA
│   └── manifest.json            # PWA manifest
│
├── .env.local                    # Variáveis de ambiente
├── next.config.mjs              # Configuração Next.js
├── tsconfig.json                # Configuração TypeScript
└── package.json                 # Dependências
```

---

## 🗄️ Banco de Dados

### Tabelas (11 no total)

#### 1. **tenants**
Sistema multi-tenant base.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK, auto-gerado |
| slug | VARCHAR | Identificador único (ex: "familia-silva") |
| name | VARCHAR | Nome do tenant |
| created_at | TIMESTAMP | Data de criação |

**Índices**:
- `tenants_slug_key` (UNIQUE)

---

#### 2. **users**
Usuários do sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| email | VARCHAR | Email único por tenant |
| name | VARCHAR | Nome completo |
| password_hash | TEXT | Senha criptografada (bcrypt) |
| role | VARCHAR | Role RBAC (admin/member) |
| phone | VARCHAR | Telefone (opcional) |
| goal_calories | INTEGER | Meta calórica diária (padrão: 2000) |
| goal_protein_g | INTEGER | Meta proteína (padrão: 150g) |
| goal_carbs_g | INTEGER | Meta carboidratos (padrão: 250g) |
| goal_fat_g | INTEGER | Meta gorduras (padrão: 65g) |
| goal_water_ml | INTEGER | Meta água (padrão: 2000ml) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

**Índices**:
- `users_email_key` (UNIQUE)
- `uniq_users_tenant_email` (UNIQUE: tenant_id + email)
- `idx_users_tenant`

**Foreign Keys**:
- `tenant_id` → `tenants.id`

---

#### 3. **meals**
Refeições registradas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| user_id | UUID | FK → users.id |
| image_url | VARCHAR | URL da foto (NULLABLE - não armazenada) |
| meal_type | VARCHAR | breakfast/lunch/dinner/snack |
| consumed_at | TIMESTAMP | Quando foi consumida |
| status | VARCHAR | approved/pending/rejected |
| notes | TEXT | Observações (opcional) |
| location_type | VARCHAR | home/out (onde foi consumida) |
| restaurant_id | UUID | FK → restaurants.id (se out) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

**Índices**:
- `idx_meals_user_consumed` (user_id, consumed_at)
- `idx_meals_tenant_consumed` (tenant_id, consumed_at)
- `idx_meals_location_type`
- `idx_meals_restaurant_id`

**Foreign Keys**:
- `tenant_id` → `tenants.id`
- `user_id` → `users.id`
- `restaurant_id` → `restaurants.id`

---

#### 4. **food_items**
Itens de comida em cada refeição.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| meal_id | UUID | FK → meals.id |
| name | VARCHAR | Nome do alimento |
| quantity | NUMERIC | Quantidade |
| unit | VARCHAR | Unidade (g, ml, unidade, etc.) |
| confidence_score | NUMERIC | Score de confiança da IA (0-1) |
| created_at | TIMESTAMP | Data de criação |

**Índices**:
- `idx_food_items_meal_id`
- `idx_food_items_tenant`

**Foreign Keys**:
- `tenant_id` → `tenants.id`
- `meal_id` → `meals.id` (CASCADE DELETE)

---

#### 5. **nutrition_data**
Valores nutricionais de cada food_item.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| food_item_id | UUID | FK → food_items.id (UNIQUE) |
| calories | NUMERIC | Calorias (kcal) |
| protein_g | NUMERIC | Proteínas (g) |
| carbs_g | NUMERIC | Carboidratos (g) |
| fat_g | NUMERIC | Gorduras totais (g) |
| fiber_g | NUMERIC | Fibras (g) |
| sodium_mg | NUMERIC | Sódio (mg) - NULLABLE |
| sugar_g | NUMERIC | Açúcares (g) - NULLABLE |
| created_at | TIMESTAMP | Data de criação |

**Índices**:
- `nutrition_data_food_item_unique` (UNIQUE: food_item_id)
- `idx_nutrition_data_food_item_id`
- `idx_nutrition_tenant`

**Foreign Keys**:
- `tenant_id` → `tenants.id`
- `food_item_id` → `food_items.id` (CASCADE DELETE)

**Nota**: Campo `saturated_fat` NÃO existe (ainda). Ver `docs/PLAN_ADD_SATURATED_FAT.md`.

---

#### 6. **food_bank**
Banco de alimentos frequentes do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| user_id | UUID | FK → users.id |
| name | VARCHAR | Nome do alimento |
| brand | VARCHAR | Marca (opcional) |
| serving_size | VARCHAR | Tamanho da porção (ex: "100g") |
| photo_url | TEXT | URL da foto do rótulo (opcional) |
| calories | NUMERIC | Calorias por porção |
| protein | NUMERIC | Proteínas (g) |
| carbs | NUMERIC | Carboidratos (g) |
| fat | NUMERIC | Gorduras (g) |
| fiber | NUMERIC | Fibras (g) |
| sodium | NUMERIC | Sódio (mg) |
| sugar | NUMERIC | Açúcares (g) |
| saturated_fat | NUMERIC | Gordura saturada (g) ✅ |
| usage_count | INTEGER | Quantas vezes foi usado (padrão: 0) |
| last_used_at | TIMESTAMP | Última vez usado |
| source | VARCHAR | manual/ai_analyzed |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

**Índices**:
- `idx_food_bank_tenant_id`
- `idx_food_bank_user_id`
- `idx_food_bank_name`
- `idx_food_bank_usage_count` (DESC - mais usados primeiro)

**Foreign Keys**:
- `tenant_id` → `tenants.id`
- `user_id` → `users.id`

---

#### 7. **restaurants**
Restaurantes cadastrados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| name | VARCHAR | Nome do restaurante |
| address | TEXT | Endereço (opcional) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

**Índices**:
- `idx_restaurants_tenant_id`
- `idx_restaurants_name`

**Foreign Keys**:
- `tenant_id` → `tenants.id`

---

#### 8. **water_intake**
Consumo de água.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| user_id | UUID | FK → users.id |
| amount_ml | INTEGER | Quantidade em ml (padrão: 250) |
| consumed_at | TIMESTAMP | Quando bebeu |
| notes | TEXT | Observações (opcional) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

**Índices**:
- `idx_water_intake_tenant_id`
- `idx_water_intake_user_id`
- `idx_water_intake_consumed_at`
- `idx_water_intake_user_consumed` (user_id, consumed_at)
- `idx_water_intake_user_date`

**Foreign Keys**:
- `tenant_id` → `tenants.id`
- `user_id` → `users.id`

---

#### 9. **bowel_movements**
Evacuações (escala Bristol).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| user_id | UUID | FK → users.id |
| occurred_at | TIMESTAMP | Quando ocorreu (padrão: now()) |
| bristol_type | INTEGER | Tipo Bristol (1-7) |
| notes | TEXT | Observações (opcional) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

**Índices**:
- `idx_bowel_movements_tenant_id`
- `idx_bowel_movements_user_id`
- `idx_bowel_movements_occurred_at`
- `idx_bowel_movements_user_occurred` (user_id, occurred_at)
- `idx_bowel_movements_user_date`

**Foreign Keys**:
- `tenant_id` → `tenants.id`
- `user_id` → `users.id`

---

#### 10. **weight_logs**
Registros de peso.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| user_id | UUID | FK → users.id |
| weight | NUMERIC | Peso em kg |
| log_date | DATE | Data do registro |
| log_time | TIME | Hora do registro (padrão: CURRENT_TIME) |
| notes | TEXT | Observações (opcional) |
| created_at | TIMESTAMP | Data de criação |

**Índices**:
- `idx_weight_logs_tenant_id`
- `idx_weight_logs_user_id`
- `idx_weight_logs_date`
- `weight_logs_user_id_log_date_log_time_tenant_id_key` (UNIQUE)

**Foreign Keys**:
- `tenant_id` → `tenants.id`
- `user_id` → `users.id`

---

#### 11. **schema_migrations**
Controle de migrações aplicadas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| name | TEXT | Nome do arquivo de migração |
| applied_at | TIMESTAMP | Quando foi aplicada |

**Sem índices ou FKs**.

---

### Relacionamentos

```
tenants (1) ──→ (N) users
tenants (1) ──→ (N) meals
tenants (1) ──→ (N) food_items
tenants (1) ──→ (N) nutrition_data
tenants (1) ──→ (N) food_bank
tenants (1) ──→ (N) restaurants
tenants (1) ──→ (N) water_intake
tenants (1) ──→ (N) bowel_movements
tenants (1) ──→ (N) weight_logs

users (1) ──→ (N) meals
users (1) ──→ (N) food_bank
users (1) ──→ (N) water_intake
users (1) ──→ (N) bowel_movements
users (1) ──→ (N) weight_logs

meals (1) ──→ (N) food_items
meals (N) ──→ (1) restaurants [opcional]

food_items (1) ──→ (1) nutrition_data
```

---

## 🔌 APIs e Endpoints

### Estrutura de Resposta Padrão

**Sucesso**:
```json
{
  "ok": true,
  "data": { ... }
}
```

**Erro**:
```json
{
  "error": "Mensagem de erro",
  "details": [ ... ]  // Opcional, para validação Zod
}
```

---

### Auth APIs

#### `POST /api/auth/signup`
Criar nova conta.

**Body**:
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "name": "João Silva",
  "tenantSlug": "familia-silva"
}
```

**Response**: `{ ok: true, userId: "..." }`

**Arquivo**: `app/api/auth/signup/route.ts`

---

#### `POST /api/auth/[...nextauth]`
NextAuth.js handler (login/logout).

**Provider**: Credentials
**Arquivo**: `app/api/auth/[...nextauth]/route.ts`

---

### Meals APIs

#### `POST /api/meals/analyze-image`
Analisar foto de refeição.

**Body**: `FormData`
- `image`: File (foto da refeição)

**Response**:
```json
{
  "ok": true,
  "analysis": {
    "meal_type": "lunch",
    "foods": [
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
        "sugar_g": 0.1
      }
    ]
  }
}
```

**Arquivo**: `app/api/meals/analyze-image/route.ts`

---

#### `POST /api/meals/analyze-text`
Analisar descrição textual.

**Body**:
```json
{
  "text": "Almoço: arroz, feijão, frango grelhado e salada"
}
```

**Response**: Igual a analyze-image

**Arquivo**: `app/api/meals/analyze-text/route.ts`

---

#### `POST /api/meals/analyze-meal`
Analisar refeição com alimentos do banco.

**Body**:
```json
{
  "foods": [
    { "name": "Arroz", "quantity": 2, "unit": "colheres" },
    { "name": "Bolo X", "quantity": 1, "unit": "fatia", "calories": 250, ... }
  ]
}
```

**Response**:
```json
{
  "ok": true,
  "analysis": {
    "foods": [ ... ] // com valores nutricionais preenchidos
  }
}
```

**Arquivo**: `app/api/meals/analyze-meal/route.ts`

---

#### `POST /api/meals/approve`
Aprovar e salvar refeição.

**Body**:
```json
{
  "meal_type": "lunch",
  "consumed_at": "2025-10-18T12:30:00.000Z",
  "notes": "Almoço em casa",
  "location_type": "home",
  "restaurant_id": null,
  "foods": [
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
      "sugar_g": 0.1
    }
  ]
}
```

**Response**: `{ ok: true, id: "meal-uuid" }`

**Arquivo**: `app/api/meals/approve/route.ts`

**Validação**: `lib/schemas/meal.ts` (Zod)

---

#### `GET /api/meals`
Listar refeições do usuário.

**Query Params**:
- `start_date`: ISO string (opcional)
- `end_date`: ISO string (opcional)
- `meal_type`: breakfast/lunch/dinner/snack (opcional)

**Response**:
```json
{
  "ok": true,
  "meals": [
    {
      "id": "...",
      "meal_type": "lunch",
      "consumed_at": "...",
      "notes": "...",
      "location_type": "home",
      "restaurant_name": null,
      "foods": [
        {
          "name": "Arroz",
          "quantity": 2,
          "unit": "colheres",
          "calories": 130,
          ...
        }
      ]
    }
  ]
}
```

**Arquivo**: `app/api/meals/route.ts`

---

#### `GET /api/meals/[id]`
Obter detalhes de uma refeição.

**Response**: Igual a GET /api/meals (um item)

**Arquivo**: `app/api/meals/[id]/route.ts`

---

#### `GET /api/meals/history`
Histórico de refeições (mais detalhado).

**Query Params**: Igual a GET /api/meals

**Arquivo**: `app/api/meals/history/route.ts`

---

### Food Bank APIs

#### `POST /api/food-bank`
Criar alimento no banco.

**Body**:
```json
{
  "name": "Whey Protein",
  "brand": "Growth",
  "serving_size": "30g",
  "calories": 120,
  "protein": 24,
  "carbs": 3,
  "fat": 1.5,
  "fiber": 0,
  "sodium": 50,
  "sugar": 1,
  "saturated_fat": 0.5,
  "source": "manual"
}
```

**Response**: `{ ok: true, foodItem: { ... } }`

**Arquivo**: `app/api/food-bank/route.ts`

---

#### `GET /api/food-bank`
Listar/buscar alimentos.

**Query Params**:
- `q`: string de busca (opcional)
- `order_by`: name/usage_count/created_at (opcional)
- `limit`: número (opcional)
- `id`: UUID (buscar um específico)

**Response**:
```json
{
  "ok": true,
  "items": [ ... ]
}
```

**Arquivo**: `app/api/food-bank/route.ts`

---

#### `PATCH /api/food-bank`
Atualizar alimento.

**Body**:
```json
{
  "id": "uuid",
  "name": "Novo nome",
  "calories": 150,
  ...
}
```

**Response**: `{ ok: true, foodItem: { ... } }`

**Arquivo**: `app/api/food-bank/route.ts`

---

#### `DELETE /api/food-bank?id=uuid`
Deletar alimento.

**Response**: `{ ok: true }`

**Arquivo**: `app/api/food-bank/route.ts`

---

#### `POST /api/food-bank/increment-usage`
Incrementar contador de uso.

**Body**: `{ "id": "uuid" }`

**Response**: `{ ok: true }`

**Arquivo**: `app/api/food-bank/increment-usage/route.ts`

---

#### `POST /api/food-bank/analyze-label`
Analisar foto de rótulo nutricional.

**Body**: FormData
- `image`: File

**Response**:
```json
{
  "ok": true,
  "data": {
    "name": "Whey Protein",
    "brand": "Growth",
    "serving_size": "30g",
    "calories": 120,
    ...
  }
}
```

**Arquivo**: `app/api/food-bank/analyze-label/route.ts`

---

### Water Intake APIs

#### `POST /api/water-intake`
Registrar consumo de água.

**Body**:
```json
{
  "amount_ml": 250,
  "consumed_at": "2025-10-18T10:00:00.000Z"
}
```

**Response**: `{ ok: true, id: "..." }`

**Arquivo**: `app/api/water-intake/route.ts`

---

#### `GET /api/water-intake`
Listar consumo de água.

**Query Params**:
- `date`: YYYY-MM-DD (opcional - padrão: hoje)

**Response**:
```json
{
  "ok": true,
  "intake": [
    {
      "id": "...",
      "amount_ml": 250,
      "consumed_at": "..."
    }
  ],
  "total_ml": 1500
}
```

**Arquivo**: `app/api/water-intake/route.ts`

---

### Bowel Movements APIs

#### `POST /api/bowel-movements`
Registrar evacuação.

**Body**:
```json
{
  "bristol_type": 4,
  "occurred_at": "2025-10-18T08:00:00.000Z",
  "notes": "Normal"
}
```

**Response**: `{ ok: true, id: "..." }`

**Arquivo**: `app/api/bowel-movements/route.ts`

---

#### `GET /api/bowel-movements`
Listar evacuações.

**Query Params**:
- `date`: YYYY-MM-DD (opcional)

**Arquivo**: `app/api/bowel-movements/route.ts`

---

### Weight APIs

#### `POST /api/weight`
Registrar peso.

**Body**:
```json
{
  "weight": 75.5,
  "log_date": "2025-10-18",
  "log_time": "08:00:00",
  "notes": "Após acordar"
}
```

**Response**: `{ ok: true, id: "..." }`

**Arquivo**: `app/api/weight/route.ts`

---

#### `GET /api/weight`
Listar registros de peso.

**Query Params**:
- `start_date`: YYYY-MM-DD (opcional)
- `end_date`: YYYY-MM-DD (opcional)

**Arquivo**: `app/api/weight/route.ts`

---

### Restaurants APIs

#### `POST /api/restaurants`
Criar restaurante.

**Body**:
```json
{
  "name": "Restaurante Bom Sabor",
  "address": "Rua X, 123"
}
```

**Arquivo**: `app/api/restaurants/route.ts`

---

#### `GET /api/restaurants/search?q=bom`
Buscar restaurantes.

**Response**:
```json
{
  "ok": true,
  "restaurants": [
    { "id": "...", "name": "Restaurante Bom Sabor", "address": "..." }
  ]
}
```

**Arquivo**: `app/api/restaurants/search/route.ts`

---

### Reports APIs

#### `GET /api/reports/analysis`
Análise nutricional com IA.

**Query Params**:
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD

**Response**:
```json
{
  "ok": true,
  "analysis": {
    "summary": "...",
    "recommendations": [ ... ],
    "highlights": [ ... ]
  }
}
```

**Arquivo**: `app/api/reports/analysis/route.ts`

---

#### `GET /api/reports/inflammation`
Análise de marcadores inflamatórios.

**Arquivo**: `app/api/reports/inflammation/route.ts`

---

### User APIs

#### `GET /api/user/profile`
Obter perfil do usuário.

**Response**:
```json
{
  "ok": true,
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "goal_calories": 2000,
    "goal_protein_g": 150,
    ...
  }
}
```

**Arquivo**: `app/api/user/profile/route.ts`

---

## 🔐 Autenticação e Autorização

### NextAuth.js

**Configuração**: `lib/auth.ts`

**Provider**: Credentials (email + senha)

**Session**: JWT (não database)

**Flow**:
```
1. User submete email/senha
2. API verifica no DB
3. bcrypt compara hash
4. Se OK, gera JWT
5. JWT armazenado em cookie
6. Requests futuros incluem JWT
```

### Multi-Tenancy

**Middleware**: `lib/tenant.ts`

**Função `requireTenant(req)`**:
1. Extrai host do request
2. Busca tenant no DB pelo slug
3. Se não encontrar, retorna erro 404
4. Retorna tenant

**Uso em todas as APIs**:
```typescript
const tenant = await requireTenant(req);
const session = getSessionData(await auth());
if (session.tenantId !== tenant.id) {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 });
}
```

### RBAC (Role-Based Access Control)

**Arquivo**: `lib/rbac.ts`

**Roles**:
- `admin`: Acesso total
- `member`: Acesso limitado

**Funções**:
- `canManageUsers(role)`: Apenas admin
- `canDeleteAccount(role)`: Apenas admin
- `canViewReports(role)`: Todos

---

## 🎨 Frontend - Páginas

### 1. **Dashboard** (`/`)
**Arquivo**: `app/page.tsx`

**Funcionalidades**:
- Resumo diário de macros (calorias, proteína, carbs, gordura)
- Progresso vs. metas
- Água consumida vs. meta
- Últimas refeições
- Gráficos de evacuação (Bristol)
- Últimos pesos registrados

**Estado**:
- Carrega dados via fetch de múltiplas APIs
- Atualiza a cada mudança de data

---

### 2. **Captura de Refeição** (`/capture`)
**Arquivo**: `app/capture/page.tsx`

**Funcionalidades**:
- 📸 Capturar foto da refeição
- ✍️ Adicionar descrição textual
- 🍎 Adicionar do banco de alimentos
- ➕ Adicionar alimento novo manualmente
- ✏️ Editar valores nutricionais
- 💾 Aprovar e salvar

**Fluxo**:
```
1. Usuário captura foto OU digita texto OU adiciona do banco
2. IA analisa (se foto/texto)
3. Mostra alimentos detectados
4. Usuário revisa e edita
5. Preenche tipo de refeição, local, hora
6. Aprova
7. Salvo no banco
```

**Estados principais**:
- `selectedImage`: Foto capturada
- `textInput`: Texto digitado
- `foodList`: Lista de alimentos
- `analysis`: Análise da IA
- `mealType`: Tipo de refeição
- `locationType`: home/out
- `selectedRestaurant`: Restaurante (se out)

**Modais**:
- Adicionar do banco
- Adicionar novo alimento

---

### 3. **Meus Alimentos** (`/meus-alimentos`)
**Arquivo**: `app/meus-alimentos/page.tsx`

**Funcionalidades**:
- ✍️ Cadastro manual de alimentos
- 📸 Cadastro via foto de rótulo (IA)
- ✏️ Editar alimentos existentes
- 🗑️ Deletar alimentos
- 📊 Ver alimentos mais usados

**Seções**:
1. Formulário Manual
2. Formulário com IA (foto de rótulo)
3. Lista de alimentos (ordenados por uso)

**Estados**:
- `items`: Lista de alimentos
- `showManualForm`: Exibe form manual
- `showAiForm`: Exibe form IA
- `editingItem`: Alimento sendo editado
- `showEditModal`: Modal de edição

---

### 4. **Histórico** (`/history`)
**Arquivo**: `app/history/page.tsx`

**Funcionalidades**:
- Ver refeições por período
- Filtrar por tipo de refeição
- Ver detalhes nutricionais
- Editar/deletar refeições (futuro)

---

### 5. **Relatórios** (`/reports`)
**Arquivo**: `app/reports/page.tsx`

**Funcionalidades**:
- Análise nutricional via IA
- Recomendações personalizadas
- Tendências de consumo
- Marcadores inflamatórios

---

### 6. **Restaurantes** (`/restaurants`)
**Arquivo**: `app/restaurants/page.tsx`

**Funcionalidades**:
- Cadastrar restaurantes
- Listar restaurantes
- Buscar restaurantes
- Ver histórico de refeições por restaurante

---

### 7. **Controle de Peso** (`/peso`)
**Arquivo**: `app/peso/page.tsx`

**Funcionalidades**:
- Registrar peso
- Ver histórico
- Gráfico de evolução

---

### 8. **Conta** (`/account`)
**Arquivo**: `app/account/page.tsx`

**Funcionalidades**:
- Ver perfil
- Editar metas (calorias, macros, água)
- Deletar conta

---

### 9. **Login/Signup**
**Arquivos**: `app/login/page.tsx`, `app/signup/page.tsx`

**Funcionalidades**:
- Autenticação
- Criação de conta
- Validação de formulários

---

## 🤖 Integrações com IA

### Google Gemini

**Arquivo**: `lib/ai.ts`

**Modelos Usados**:
- `gemini-1.5-flash`: Análise rápida de refeições (foto/texto)
- `gemini-1.5-pro`: Análise detalhada de rótulos nutricionais

---

### 1. **Análise de Refeições** (Flash)

**Função**: `analyzeFood(imageBase64 | text)`

**Prompt**:
```
Você é um nutricionista expert. Analise esta refeição e retorne JSON com:
- meal_type (breakfast/lunch/dinner/snack)
- foods: array de objetos com:
  - name: nome do alimento
  - quantity: quantidade
  - unit: unidade (g, ml, colheres, etc.)
  - calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g
```

**Uso**:
- `/api/meals/analyze-image`
- `/api/meals/analyze-text`
- `/api/meals/analyze-meal`

---

### 2. **Análise de Rótulos** (Pro)

**Arquivo**: `lib/ai/nutrition-label-analyzer.ts`

**Função**: `analyzeNutritionLabel(imageBase64)`

**Prompt**:
```
Analise esta tabela nutricional e extraia:
- Nome do produto
- Marca
- Porção (serving_size)
- Valores nutricionais por porção (todos os campos)
```

**Uso**: `/api/food-bank/analyze-label`

---

### 3. **Análise de Relatórios**

**Arquivo**: `lib/ai/reports-analyzer.ts`

**Função**: `generateNutritionReport(meals, userGoals)`

**Prompt**:
```
Analise o consumo nutricional deste período e gere:
- Resumo geral
- Recomendações
- Alertas
- Tendências
```

**Uso**: `/api/reports/analysis`

---

## 🔄 Fluxos Principais

### Fluxo 1: Captura de Refeição (Foto)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário acessa /capture                              │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 2. Clica em "Tirar Foto"                                │
│    - Abre câmera (input type="file" capture="camera")   │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 3. Foto capturada → selectedImage                       │
│    - Mostra preview                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 4. Clica "Analisar Foto"                                │
│    - POST /api/meals/analyze-image                      │
│    - Envia FormData com imagem                          │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 5. API converte para base64                             │
│    - Chama Gemini Flash com prompt                      │
│    - Gemini retorna JSON                                │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 6. Frontend recebe análise                              │
│    - Popula foodList com alimentos detectados           │
│    - Mostra campos editáveis                            │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 7. Usuário revisa e edita                               │
│    - Ajusta quantidades                                 │
│    - Corrige valores nutricionais                       │
│    - Adiciona/remove alimentos                          │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 8. Preenche metadados                                   │
│    - Tipo de refeição (lunch/dinner/etc)                │
│    - Hora consumida                                     │
│    - Local (casa/fora)                                  │
│    - Restaurante (se fora)                              │
│    - Observações                                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 9. Clica "Salvar Refeição"                              │
│    - POST /api/meals/approve                            │
│    - Body: { meal_type, consumed_at, foods, ... }       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 10. API valida com Zod                                  │
│     - Se inválido: retorna erro                         │
│     - Se válido: prossegue                              │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 11. Inicia transação SQL                                │
│     BEGIN                                               │
│     SET tenant_id = $1                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 12. INSERT INTO meals                                   │
│     - Retorna meal.id                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 13. Para cada food:                                     │
│     - INSERT INTO food_items                            │
│     - INSERT INTO nutrition_data                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 14. COMMIT                                              │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 15. Retorna { ok: true, id: meal.id }                   │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 16. Frontend mostra sucesso                             │
│     - Redireciona para dashboard ou histórico           │
└─────────────────────────────────────────────────────────┘
```

---

### Fluxo 2: Cadastro de Alimento (Rótulo)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário acessa /meus-alimentos                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 2. Clica "Cadastrar com IA"                             │
│    - Abre seção de upload de foto                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 3. Tira foto do rótulo nutricional                      │
│    - selectedImage = foto                               │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 4. Clica "Analisar Rótulo"                              │
│    - POST /api/food-bank/analyze-label                  │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 5. API usa Gemini Pro                                   │
│    - analyzeNutritionLabel(base64)                      │
│    - Retorna dados estruturados                         │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 6. Frontend popula formulário                           │
│    - analyzedData = { name, brand, calories, ... }      │
│    - Mostra campos editáveis                            │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 7. Usuário revisa e ajusta                              │
│    - Corrige nome se necessário                         │
│    - Ajusta valores nutricionais                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 8. Clica "Salvar Alimento"                              │
│    - POST /api/food-bank                                │
│    - Body: { name, brand, calories, ..., source: 'ai' } │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 9. API valida com Zod                                   │
│    - INSERT INTO food_bank                              │
│    - Retorna alimento criado                            │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 10. Frontend atualiza lista                             │
│     - Mostra mensagem de sucesso                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Segurança

### 1. **Autenticação**
- ✅ Senhas com bcrypt (salt rounds: 10)
- ✅ JWT via NextAuth
- ✅ Cookies HTTP-only
- ✅ CSRF protection (NextAuth)

### 2. **Autorização**
- ✅ Middleware verifica tenant em TODAS as rotas
- ✅ Session verifica user_id
- ✅ RBAC para funções admin

### 3. **SQL Injection**
- ✅ Parametrized queries (`$1, $2, ...`)
- ✅ Nenhuma concatenação de strings em SQL
- ✅ Validação Zod antes de queries

### 4. **XSS (Cross-Site Scripting)**
- ✅ React escapa HTML automaticamente
- ✅ Sanitização de inputs (Zod)
- ✅ Content Security Policy (futuro)

### 5. **LGPD/GDPR**
- ✅ Imagens não persistidas (apenas análise)
- ✅ Função de deletar conta
- ✅ Dados isolados por tenant
- ✅ Logs não incluem dados sensíveis

### 6. **Rate Limiting**
- ⚠️ NÃO IMPLEMENTADO (futuro)

### 7. **Environment Variables**
- ✅ `.env.local` não commitado
- ✅ Validação de env vars obrigatórias (`lib/env.ts`)

---

## 📐 Convenções e Padrões

### Nomenclatura

**Arquivos**:
- Pages: `page.tsx`
- APIs: `route.ts`
- Repos: `*.repo.ts`
- Schemas: `*.schema.ts` ou `schemas/*.ts`
- Types: `types/*.ts`

**Variáveis**:
- camelCase: `userId`, `mealType`
- PascalCase: Componentes React, Types
- UPPER_CASE: Constantes globais

**Banco de Dados**:
- snake_case: `user_id`, `meal_type`, `created_at`

---

### Estrutura de Código

**API Routes**:
```typescript
export async function POST(req: Request) {
  try {
    await init();                        // 1. Init
    const tenant = await requireTenant(req);  // 2. Tenant
    const session = getSessionData(await auth()); // 3. Auth

    if (!session) return 401;            // 4. Validate
    if (session.tenantId !== tenant.id) return 403;

    const body = await req.json();       // 5. Parse body
    const validated = schema.parse(body); // 6. Validate Zod

    // 7. Business logic
    const result = await someRepo.create(validated);

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    // 8. Error handling
    logger.error('Error', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
```

---

### TypeScript

**Types vs Interfaces**:
- `type` para shapes de dados
- `interface` para contratos (raramente usado)

**Strict Mode**: Habilitado

**Null Safety**:
- Sempre checar `if (value)` ou `value ?? default`
- Usar optional chaining: `obj?.prop`

---

### SQL

**Sempre usar**:
- Parametrized queries
- Transações para múltiplas operações
- `tenant_id` em todas as queries

**Padrão de Transação**:
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query("SET tenant_id = $1", [tenantId]);

  // operações

  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

---

## 🔄 Migrações

### Estrutura

**Diretório**: `migrations/`

**Formato**: `XXX_description.sql`

**Exemplo**: `014_add_saturated_fat_to_nutrition.sql`

---

### Aplicar Migrações

**Script**: `scripts/apply-migrations.ts`

**Comando**:
```bash
npx tsx scripts/apply-migrations.ts
```

**Tabela de Controle**: `schema_migrations`

---

### Regras de Migração

1. ✅ **Sempre ADITIVAS** (nunca destrutivas)
2. ✅ **Colunas novas devem ser NULLABLE**
3. ✅ **Testar localmente antes de produção**
4. ✅ **Nunca modificar migrações já aplicadas**
5. ✅ **Documentar em comentários SQL**

---

## 📊 Monitoramento e Logs

### Logger

**Arquivo**: `lib/logger.ts`

**Funções**:
- `logger.info(message, data)`
- `logger.error(message, error, context)`
- `logger.warn(message, data)`

**Uso**:
```typescript
logger.error('Failed to create meal', err, {
  userId: session.userId,
  tenantId: tenant.id
});
```

---

### Dados Sensíveis

**NUNCA logar**:
- ❌ Senhas
- ❌ Tokens
- ❌ Dados pessoais completos

**Pode logar**:
- ✅ IDs (UUID)
- ✅ Timestamps
- ✅ Mensagens de erro
- ✅ Códigos de status

---

## 📈 Métricas (Futuro)

### KPIs Sugeridos

1. **Uso**:
   - Refeições registradas/dia
   - Alimentos cadastrados
   - Taxa de uso do banco de alimentos

2. **Performance**:
   - Tempo de análise da IA
   - Tempo de resposta das APIs
   - Taxa de erro

3. **Saúde**:
   - Conformidade com metas
   - Hidratação adequada
   - Regularidade intestinal

---

## 🎯 Roadmap Técnico

### Curto Prazo
- [ ] Adicionar `saturated_fat` em nutrition_data
- [ ] Implementar rate limiting
- [ ] Adicionar testes automatizados
- [ ] Melhorar error handling

### Médio Prazo
- [ ] Dashboard de métricas
- [ ] Export de dados (CSV/PDF)
- [ ] Notificações push (PWA)
- [ ] Modo offline

### Longo Prazo
- [ ] App mobile nativo
- [ ] Integração com wearables
- [ ] Machine Learning personalizado
- [ ] API pública

---

## 📞 Contato e Manutenção

**Desenvolvedor**: Claude Code (Anthropic)
**Data de Criação**: 18/10/2025
**Última Atualização**: 18/10/2025

---

## 📝 Notas Finais

Esta documentação é um **documento vivo** e deve ser atualizada sempre que:
- Novas features forem adicionadas
- Arquitetura for modificada
- Decisões técnicas importantes forem tomadas
- Bugs críticos forem descobertos

**Scripts úteis**:
```bash
# Atualizar schema do banco
npx tsx scripts/extract-schema.ts

# Aplicar migrações
npx tsx scripts/apply-migrations.ts

# Build para produção
npm run build

# Executar em dev
npm run dev
```

---

**✅ FIM DA DOCUMENTAÇÃO TÉCNICA**
