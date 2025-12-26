# DOCUMENTACAO COMPLETA - FOOD TRACKER

**Versao:** 1.0
**Data:** 25/12/2024
**Autor:** Documentacao gerada automaticamente

---

## 1. VISAO GERAL DO PROJETO

**Food Tracker** e um aplicativo de rastreamento de alimentacao e nutricao construido com Next.js 14, TypeScript e React. Implementa um sistema inteligente de analise de refeicoes usando IA (Gemini 2.0), gerenciamento de peso, medidas corporais, metas nutricionais e um Coach IA personalizado.

### 1.1 Tecnologias Principais

- **Framework:** Next.js 14 (App Router)
- **Frontend:** React 18 com Hooks
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL (Supabase)
- **IA:** Google Generative AI (Gemini 2.0)
- **Autenticacao:** NextAuth.js
- **Arquitetura:** Multi-tenancy com isolamento de dados
- **Monetizacao:** Sistema de quotas/subscriptions (Free/Premium/Unlimited)
- **Mobile:** Capacitor para iOS/Android

---

## 2. ESTRUTURA DO BANCO DE DADOS

### 2.1 Tabela: users

Armazena informacoes de usuarios com suporte a multi-tenancy.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| email | VARCHAR(255) | Email (unique por tenant) |
| name | VARCHAR(200) | Nome do usuario |
| tenant_id | UUID (FK) | Referencia ao tenant |
| password_hash | TEXT | Hash da senha |
| role | VARCHAR(20) | owner, admin, member |
| phone | VARCHAR(20) | Telefone (opcional) |
| plan | VARCHAR(20) | free, premium, unlimited |
| subscription_status | VARCHAR(20) | active, canceled, expired, trial, lifetime |
| is_lifetime_premium | BOOLEAN | Premium vitalicio |
| goal_type | VARCHAR(20) | lose_weight, gain_weight, maintain_weight |
| height_cm | INT | Altura em cm |
| age | INT | Idade |
| gender | VARCHAR(10) | male, female, other |
| activity_level | VARCHAR(20) | sedentary, light, moderate, active, very_active |
| target_weight_kg | NUMERIC | Peso alvo |
| weekly_goal_kg | NUMERIC | Meta semanal |
| goal_calories | INT | Meta de calorias (default 2000) |
| goal_protein_g | INT | Meta de proteina (default 150) |
| goal_carbs_g | INT | Meta de carboidratos (default 250) |
| goal_fat_g | INT | Meta de gordura (default 65) |
| goal_water_ml | INT | Meta de agua (default 2000) |

### 2.2 Tabela: meals

Rastreia refeicoes consumidas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| image_url | VARCHAR(500) | URL da imagem (opcional) |
| meal_type | VARCHAR(20) | breakfast, lunch, dinner, snack |
| consumed_at | TIMESTAMP | Data/hora do consumo |
| status | VARCHAR(20) | pending, approved, rejected |
| notes | TEXT | Observacoes |
| location_type | VARCHAR(10) | home, out |
| restaurant_id | UUID (FK) | Restaurante (se fora) |

### 2.3 Tabela: food_items

Itens de comida em cada refeicao.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| meal_id | UUID (FK) | Refeicao |
| tenant_id | UUID (FK) | Tenant |
| name | VARCHAR(200) | Nome do alimento |
| quantity | NUMERIC | Quantidade |
| unit | VARCHAR(20) | Unidade (g, ml, un) |
| confidence_score | NUMERIC(0-1) | Score de confianca IA |

### 2.4 Tabela: nutrition_data

Valores nutricionais (1-to-1 com food_items).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| food_item_id | UUID (FK) | Item de comida |
| tenant_id | UUID (FK) | Tenant |
| calories | NUMERIC | Calorias |
| protein_g | NUMERIC | Proteina (g) |
| carbs_g | NUMERIC | Carboidratos (g) |
| fat_g | NUMERIC | Gordura (g) |
| fiber_g | NUMERIC | Fibra (g) |
| sodium_mg | NUMERIC | Sodio (mg) |
| sugar_g | NUMERIC | Acucar (g) |

### 2.5 Tabela: weight_logs

Historico de peso do usuario.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| weight | NUMERIC(5,2) | Peso em kg (0-500) |
| log_date | DATE | Data do registro |
| log_time | TIME | Hora do registro |
| notes | TEXT | Observacoes |

### 2.6 Tabela: body_measurements

Medidas corporais.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| measurement_date | DATE | Data da medicao |
| waist | NUMERIC(5,2) | Cintura (cm) |
| neck | NUMERIC(5,2) | Pescoco (cm) |
| chest | NUMERIC(5,2) | Peito (cm) |
| hips | NUMERIC(5,2) | Quadril (cm) |
| left_thigh, right_thigh | NUMERIC(5,2) | Coxas (cm) |
| left_bicep, right_bicep | NUMERIC(5,2) | Biceps (cm) |
| left_calf, right_calf | NUMERIC(5,2) | Panturrilhas (cm) |

### 2.7 Tabela: water_intake

Rastreamento de hidratacao.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| amount_ml | INT | Quantidade em ml (default 250) |
| consumed_at | TIMESTAMP | Data/hora |
| notes | TEXT | Observacoes |

### 2.8 Tabela: bowel_movements

Rastreamento de saude intestinal (Escala de Bristol).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| occurred_at | TIMESTAMP | Data/hora |
| bristol_type | INT(1-7) | Tipo Bristol |
| notes | TEXT | Observacoes (sangue, urgencia, dor) |

### 2.9 Tabela: food_bank

Banco de alimentos do usuario.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| name | VARCHAR(255) | Nome do alimento |
| brand | VARCHAR(255) | Marca (opcional) |
| serving_size | VARCHAR(100) | Porcao (ex: 100g) |
| calories, protein, carbs, fat, fiber | NUMERIC | Macros |
| usage_count | INT | Vezes usado |
| last_used_at | TIMESTAMP | Ultimo uso |
| source | VARCHAR(50) | manual, ai_analyzed |
| purchasable | BOOLEAN | Pode comprar no mercado |
| category | VARCHAR(100) | Categoria |
| taco_id | INT (FK) | Referencia TACO |

### 2.10 Tabela: coach_analyses

Historico de analises do Coach IA.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| analysis_date | TIMESTAMP | Data da analise |
| context_data | JSONB | Snapshot dos dados |
| analysis_text | TEXT | Texto da analise |
| recommendations | TEXT[] | Recomendacoes |
| insights | TEXT[] | Insights |
| warnings | TEXT[] | Alertas |
| model_used | VARCHAR(50) | Modelo IA usado |

### 2.11 Tabela: shopping_lists

Listas de compras.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| name | VARCHAR(100) | Nome da lista |
| status | VARCHAR(20) | active, completed, archived |
| store_id | UUID (FK) | Loja onde a compra foi realizada |
| completed_at | TIMESTAMP | Data de conclusao |

### 2.12 Tabela: shopping_items

Itens das listas de compras.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| list_id | UUID (FK) | Lista |
| tenant_id | UUID (FK) | Tenant |
| name | VARCHAR(200) | Nome do item |
| quantity | NUMERIC | Quantidade |
| unit | VARCHAR(50) | Unidade |
| price | NUMERIC(10,2) | Preco |
| is_purchased | BOOLEAN | Foi comprado |
| purchased_at | TIMESTAMP | Data da compra |
| source | VARCHAR(20) | manual, suggestion |
| category | VARCHAR(50) | Categoria |

### 2.13 Tabela: restaurants

Cadastro de restaurantes.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| tenant_id | UUID (FK) | Tenant |
| name | VARCHAR(255) | Nome |
| address | TEXT | Endereco |

### 2.14 Tabela: usage_quotas

Controle de limite mensal de recursos premium.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| month | VARCHAR(7) | YYYY-MM |
| photo_analyses | INT | Analises de foto usadas |
| ocr_analyses | INT | Analises OCR usadas |
| text_analyses | INT | Analises de texto usadas |

### 2.15 Tabela: taco_foods

Tabela TACO 4a edicao - base de dados nutricional brasileira.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | INT (PK) | Identificador |
| taco_number | INT | Numero TACO |
| name | VARCHAR(255) | Nome do alimento |
| category | VARCHAR(100) | Categoria |
| calories, protein, carbs, fat, fiber | NUMERIC | Valores por 100g |
| vitaminas e minerais | NUMERIC | Micronutrientes |

### 2.16 Tabela: tenants

Multi-tenancy.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador |
| slug | VARCHAR(100) | Slug unico |
| name | VARCHAR(200) | Nome |

### 2.17 Tabela: stores

Cadastro de lojas/estabelecimentos onde as compras sao realizadas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| tenant_id | UUID (FK) | Tenant |
| user_id | UUID (FK) | Usuario que cadastrou |
| name | VARCHAR(255) | Nome da loja (ex: Carrefour Centro) |
| address | TEXT | Endereco (opcional) |
| created_at | TIMESTAMP | Data de criacao |

**Indices:**
- `idx_stores_user` - (user_id, tenant_id)

**Relacionamentos:**
- `shopping_lists.store_id` referencia `stores.id`

---

## 3. PAGINAS DA APLICACAO

### 3.1 / (Home/Dashboard)

**Proposito:** Dashboard principal mostrando resumo do dia.

**Funcionalidades:**
- Exibe progresso nutritivo do dia (calorias, macros)
- Mostra hidratacao e saude intestinal
- Lista ultimas 3 refeicoes
- CTA principal: "Registrar Refeicao"
- Cards expansiveis para detalhes

**APIs consumidas:**
- GET /api/meals
- GET /api/user/profile
- GET /api/water-intake
- GET /api/bowel-movements

### 3.2 /capture (Registrar Refeicao)

**Proposito:** Capturar refeicoes com suporte a foto, analise IA e manual.

**Funcionalidades:**
- Upload de foto com compressao automatica
- Analise de foto via IA Gemini
- Adicao manual de alimentos
- Busca em "Meus Alimentos"
- Selecao de restaurante
- Sistema de quotas (bloqueia FREE users)

**APIs:**
- POST /api/meals/analyze-image
- POST /api/meals/analyze-meal
- POST /api/meals/approve
- GET /api/food-bank

### 3.3 /history (Historico)

**Proposito:** Visualizar todas as refeicoes em calendario.

**Funcionalidades:**
- Calendario mensal interativo
- Clique em dia para ver detalhes
- Export CSV (PREMIUM only)
- Filtros por periodo

### 3.4 /peso (Peso e Medidas)

**Proposito:** Rastrear evolucao de peso e medidas corporais.

**Funcionalidades:**
- Aba Peso: formulario + timeline
- Aba Medidas: medicoes corporais
- Estatisticas do periodo

**APIs:**
- GET/POST/DELETE /api/weight
- GET/POST/DELETE /api/body-measurements

### 3.5 /meus-alimentos (Banco de Alimentos)

**Proposito:** Gerenciar alimentos reutilizaveis.

**Funcionalidades:**
- Cadastro manual
- Analise de foto de tabela nutricional (OCR)
- Busca e listagem
- Marcacao como "purchasable"

### 3.6 /lista-compras (Listas de Compras)

**Proposito:** Criar e gerenciar listas de compras.

**Funcionalidades:**
- CRUD de listas de compras
- CRUD de itens com preco
- Sugestoes inteligentes baseadas em consumo
- Duplicacao de listas concluidas
- Calculo de total em tempo real
- Registro de loja/estabelecimento ao finalizar lista
- Visualizacao de listas concluidas (somente leitura)
- Edicao de precos e loja em listas concluidas
- Exclusao de listas concluidas
- Botao "Ver todas" para historico completo (exibe ultimas 5 por padrao)

**Fluxo de finalizacao:**
1. Usuario marca todos os itens como comprados
2. Botao "Finalizar Lista" aparece
3. Modal abre para selecionar/criar loja
4. Lista e marcada como completed com store_id

**APIs consumidas:**
- GET/POST/PATCH/DELETE /api/shopping-lists
- GET/POST /api/shopping-lists/items
- GET /api/shopping-lists/suggestions
- POST /api/shopping-lists/duplicate
- GET/POST /api/stores

### 3.7 /coach (Coach IA)

**Proposito:** Analise IA de habitos e progresso.

**Funcionalidades:**
- Analise inteligente baseada em dados
- Recomendacoes personalizadas
- Historico de analises
- PREMIUM ONLY

### 3.8 /objetivos (Configurar Metas)

**Proposito:** Definir objetivos pessoais e nutricionais.

**Campos:**
- Objetivo (perder/ganhar/manter peso)
- Dados pessoais (altura, idade, genero)
- Nivel de atividade
- Peso alvo e meta semanal

### 3.9 /restaurants (Restaurantes)

**Proposito:** CRUD de restaurantes.

### 3.10 /account (Configuracoes)

**Proposito:** Gerenciar perfil e assinatura.

**Funcionalidades:**
- Edicao de perfil
- Metas nutricionais
- Visualizacao de plano
- Deletar conta
- Logout

### 3.11 /upgrade (Planos)

**Proposito:** Mostrar planos e promover upgrade.

### 3.12 /reports (Relatorios)

**Proposito:** Analises estatisticas (PREMIUM).

### 3.13 /login e /signup (Autenticacao)

**Proposito:** Login e registro de usuarios.

### 3.14 /onboarding (Onboarding)

**Proposito:** Guiar novos usuarios na configuracao inicial.

**Passos:**
1. Objetivo (perder/manter/ganhar peso)
2. Dados (altura, idade, genero)
3. Nivel de atividade

---

## 4. ROTAS DE API

### 4.1 Autenticacao

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | /api/auth/signup | Criar conta |
| POST | /api/auth/mobile-login | Login mobile |
| * | /api/auth/[...nextauth] | NextAuth handlers |

### 4.2 Refeicoes (Meals)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/meals | Listar refeicoes |
| DELETE | /api/meals/[id] | Deletar refeicao |
| POST | /api/meals/analyze-image | Analisar foto |
| POST | /api/meals/analyze-meal | Analisar refeicao |
| POST | /api/meals/analyze-text | Analisar texto |
| POST | /api/meals/approve | Salvar refeicao |
| GET | /api/meals/history | Historico |
| GET | /api/meals/export | Exportar CSV |

### 4.3 Peso

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/weight | Listar registros |
| POST | /api/weight | Criar registro |
| DELETE | /api/weight?id= | Deletar registro |

### 4.4 Medidas Corporais

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/body-measurements | Listar medicoes |
| POST | /api/body-measurements | Criar medicao |
| DELETE | /api/body-measurements?id= | Deletar medicao |

### 4.5 Hidratacao

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/water-intake | Total do dia |
| POST | /api/water-intake | Adicionar agua |

### 4.6 Saude Intestinal

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/bowel-movements | Historico |
| POST | /api/bowel-movements | Registrar evacuacao |

### 4.7 Banco de Alimentos

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/food-bank | Listar/buscar |
| POST | /api/food-bank | Criar alimento |
| POST | /api/food-bank/increment-usage | Incrementar uso |
| POST | /api/food-bank/analyze-label | Analisar tabela nutricional |

### 4.8 Restaurantes

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/restaurants | Listar |
| POST | /api/restaurants | Criar |
| GET | /api/restaurants/search | Buscar |

### 4.9 Coach IA

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | /api/coach/analyze | Gerar analise |
| GET | /api/coach/history | Historico |

### 4.10 Usuario

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/user/profile | Buscar perfil |
| PATCH | /api/user/profile | Atualizar perfil |
| GET | /api/user/goals | Buscar objetivos |
| POST | /api/user/goals | Salvar objetivos |

### 4.11 Subscriptions

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/subscription/quota | Buscar quotas |

### 4.12 Listas de Compras

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/shopping-lists | Listar |
| POST | /api/shopping-lists | Criar |
| GET | /api/shopping-lists/[id] | Buscar |
| PATCH | /api/shopping-lists/[id] | Atualizar |
| DELETE | /api/shopping-lists/[id] | Deletar |
| POST | /api/shopping-lists/items | Adicionar item |
| PATCH | /api/shopping-lists/items | Atualizar item |
| DELETE | /api/shopping-lists/items | Deletar item |
| GET | /api/shopping-lists/suggestions | Sugestoes |
| POST | /api/shopping-lists/duplicate | Duplicar lista |

### 4.13 Lojas/Estabelecimentos

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/stores | Listar lojas do usuario |
| POST | /api/stores | Criar nova loja |
| PATCH | /api/stores?id=UUID | Atualizar loja |
| DELETE | /api/stores?id=UUID | Deletar loja |

**Campos da requisicao POST/PATCH:**
```json
{
  "name": "Carrefour Centro",
  "address": "Rua das Flores, 123" // opcional
}
```

### 4.14 Relatorios

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/reports/analysis | Analise (PREMIUM) |
| GET | /api/reports/inflammation | Inflamacao intestinal |

### 4.15 Conta

| Metodo | Rota | Descricao |
|--------|------|-----------|
| DELETE | /api/account/delete | Deletar conta |

---

## 5. COMPONENTES PRINCIPAIS

### 5.1 Layout

- **AuthenticatedLayout.tsx** - Wrapper de autenticacao
- **AuthenticatedLayout.mobile.tsx** - Versao mobile
- **AppLayout.tsx** - Layout principal com navegacao

### 5.2 Subscriptions

- **PaywallModal.tsx** - Modal de upgrade
- **QuotaCard.tsx** - Card de uso de quota
- **UpgradeButton.tsx** - Botao de upgrade
- **PlanBadge.tsx** - Badge do plano atual

### 5.3 Formularios

- **MeasurementForm.tsx** - Formulario de medidas
- **MeasurementTimeline.tsx** - Timeline de medicoes

### 5.4 Calendario

- **CalendarView.tsx** - Calendario de refeicoes

### 5.5 Exportacao

- **ExportMealsButton.tsx** - Botao de export CSV

---

## 6. LIBS E SERVICOS

### 6.1 Autenticacao

- **auth.ts** - Configuracao NextAuth
- **auth-helper.ts** - Helpers de sessao

### 6.2 IA

- **ai.ts** - Integracao Gemini
- **ai/nutrition-label-analyzer.ts** - OCR de tabelas
- **ai/reports-analyzer.ts** - Analise de relatorios

### 6.3 Services

- **services/coach.service.ts** - Logica do Coach IA

### 6.4 Banco de Dados

- **db.ts** - Pool de conexoes
- **repos/** - Repository Pattern
  - meal.repo.ts
  - weight.repo.ts
  - body-measurements.repo.ts
  - food-bank.repo.ts
  - shopping-list.repo.ts
  - store.repo.ts
  - bowel-movement.repo.ts
  - taco.repo.ts

### 6.5 Storage

- **storage.ts** - Upload/delete Supabase Storage
- **images.ts** - Compressao de imagens

### 6.6 Quotas

- **quota.ts** - Verificacao e incremento de quotas

### 6.7 Utilities

- **datetime.ts** - Funcoes de data/hora
- **constants.ts** - Constantes (limites de plano, etc)
- **logger.ts** - Logging
- **api-client.ts** - Cliente HTTP
- **utils/csv-export.ts** - Geracao de CSV

### 6.8 Multi-Tenancy

- **tenant.ts** - Funcoes de tenant
- **rbac.ts** - Role-based access control

---

## 7. PLANOS E QUOTAS

| Feature | FREE | PREMIUM | UNLIMITED |
|---------|------|---------|-----------|
| Registro manual | Ilimitado | Ilimitado | Ilimitado |
| Analise de fotos/mes | 0 | 90 | Ilimitado |
| Analise OCR/mes | 0 | 30 | Ilimitado |
| Historico de dados | 30 dias | Ilimitado | Ilimitado |
| Coach IA | Nao | Sim | Sim |
| Listas de compras | Sim | Sim | Sim |
| Export CSV | Nao | Sim | Sim |

---

## 8. FLUXOS PRINCIPAIS

### 8.1 Registro de Refeicao

1. User clica "Registrar Refeicao" em /capture
2. Escolhe: foto + IA, alimentos manuais, ou texto
3. IA retorna analise estruturada
4. User edita valores (opcional)
5. Seleciona tipo, hora, local
6. POST /api/meals/approve
7. DB transaction: meals + food_items + nutrition_data
8. Quota incrementada (se premium)

### 8.2 Coach IA

1. User acessa /coach (PREMIUM only)
2. Verifica objetivos configurados
3. Clica "Gerar Analise"
4. Sistema coleta contexto (peso, medidas, refeicoes, objetivos)
5. Envia para Gemini
6. Salva analise em coach_analyses
7. Exibe: texto, recomendacoes, insights, alertas

### 8.3 Quota Premium

1. User tenta usar feature IA
2. checkQuota() verifica limites
3. FREE: bloqueado, mostra PaywallModal
4. PREMIUM: verifica limite mensal
5. UNLIMITED: sempre permitido
6. incrementQuota() apos sucesso
7. Reset no dia 1o do mes

---

## 9. VARIAVEIS DE AMBIENTE

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/food-tracker

# Auth
NEXTAUTH_SECRET=random_secret
NEXTAUTH_URL=http://localhost:3000

# IA
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash-exp

# Storage (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe (futuro)
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
```

---

## 10. SEGURANCA

- **Autenticacao:** NextAuth com sessao segura
- **Autorizacao:** RBAC (owner, admin, member)
- **Multi-tenancy:** Isolamento de dados por tenant_id
- **Validacao:** Zod schemas em todas APIs
- **Rate Limiting:** Quotas por plano
- **CORS:** Configurado para dominios seguros
- **Imagens:** Nao armazenadas permanentemente
- **Dados sensiveis:** Nao incluidos em logs

---

## 11. COMANDOS UTEIS

```bash
# Desenvolvimento
npm run dev

# Build web
npm run build

# Build mobile
npm run build:mobile

# Sync iOS
npx cap sync ios

# Sync Android
npx cap sync android

# Abrir Xcode
npx cap open ios

# Verificar tipos
npx tsc --noEmit
```

---

## 12. ESTRUTURA DE ARQUIVOS

```
food-tracker/
├── app/
│   ├── page.tsx (home)
│   ├── capture/
│   ├── history/
│   ├── peso/
│   ├── meus-alimentos/
│   ├── lista-compras/
│   ├── coach/
│   ├── objetivos/
│   ├── restaurants/
│   ├── account/
│   ├── upgrade/
│   ├── reports/
│   ├── login/
│   ├── signup/
│   ├── onboarding/
│   ├── layout.tsx
│   └── api/
│       ├── auth/
│       ├── meals/
│       ├── weight/
│       ├── body-measurements/
│       ├── water-intake/
│       ├── bowel-movements/
│       ├── food-bank/
│       ├── restaurants/
│       ├── shopping-lists/
│       ├── stores/
│       ├── coach/
│       ├── user/
│       ├── subscription/
│       ├── reports/
│       └── account/
├── components/
├── lib/
│   ├── repos/
│   ├── services/
│   ├── types/
│   ├── schemas/
│   ├── utils/
│   └── ai/
├── hooks/
├── public/
├── ios/
├── android/
└── docs/
```

---

## 13. HISTORICO DE ALTERACOES

### 26/12/2024

**Sistema de Lojas/Estabelecimentos:**
- Nova tabela `stores` para cadastro de lojas onde as compras sao realizadas
- Coluna `store_id` adicionada em `shopping_lists` para vincular lista a loja
- API `/api/stores` (GET, POST, PATCH, DELETE) para CRUD de lojas
- Repositorio `lib/repos/store.repo.ts`
- Modal de finalizacao de lista com selecao/criacao de loja
- Exibicao do nome da loja nas listas concluidas

**Visualizacao de Listas Concluidas:**
- Clique na lista concluida abre visualizacao completa
- Modo somente leitura com detalhes de itens e precos
- Botao "Editar" para corrigir precos e trocar loja
- Botao "Excluir" para remover listas concluidas
- Botao "Ver todas" quando ha mais de 5 listas concluidas

**Novas Categorias de Alimentos:**
- Suplementos
- Leites Vegetais
- Massas

**Correcoes:**
- Fix na API de sugestoes (`/api/shopping-lists/suggestions`) - campos `consumption_count` e `days_consumed` nao estavam sendo retornados corretamente
- Fix no layout dos inputs de data no periodo personalizado da pagina de relatorios

**Remocoes:**
- Removido sistema de internacionalizacao (next-intl) - app e apenas em portugues
- Removida pasta `messages/` e `lib/i18n/`

---

*Documentacao gerada em 25/12/2024*
*Atualizada em 26/12/2024*
