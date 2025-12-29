# DOCUMENTACAO COMPLETA - FOOD TRACKER

**Versao:** 1.3
**Data:** 29/12/2024
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
| cholesterol_mg | NUMERIC | Colesterol (mg) |
| saturated_fat_g | NUMERIC | Gordura saturada (g) |
| calcium_mg | NUMERIC | Calcio (mg) |
| magnesium_mg | NUMERIC | Magnesio (mg) |
| phosphorus_mg | NUMERIC | Fosforo (mg) |
| iron_mg | NUMERIC | Ferro (mg) |
| potassium_mg | NUMERIC | Potassio (mg) |
| zinc_mg | NUMERIC | Zinco (mg) |
| copper_mg | NUMERIC | Cobre (mg) |
| manganese_mg | NUMERIC | Manganes (mg) |
| vitamin_c_mg | NUMERIC | Vitamina C (mg) |
| vitamin_a_mcg | NUMERIC | Vitamina A (mcg) |
| vitamin_b1_mg | NUMERIC | Vitamina B1/Tiamina (mg) |
| vitamin_b2_mg | NUMERIC | Vitamina B2/Riboflavina (mg) |
| vitamin_b3_mg | NUMERIC | Vitamina B3/Niacina (mg) |
| vitamin_b6_mg | NUMERIC | Vitamina B6 (mg) |

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
| sodium, sugar, saturated_fat | NUMERIC | Detalhes nutricionais |
| cholesterol, calcium, magnesium | NUMERIC | Micronutrientes (minerais) |
| phosphorus, iron, potassium, zinc | NUMERIC | Micronutrientes (minerais) |
| copper, manganese | NUMERIC | Micronutrientes (minerais) |
| vitamin_c, vitamin_a | NUMERIC | Vitaminas |
| vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b6 | NUMERIC | Vitaminas do complexo B |
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
| price | NUMERIC(10,2) | Preco total do item |
| unit_price | NUMERIC(10,2) | Preco unitario (usado na calculadora inteligente) |
| is_purchased | BOOLEAN | Foi comprado |
| purchased_at | TIMESTAMP | Data da compra |
| source | VARCHAR(20) | manual, suggestion |
| category | VARCHAR(50) | Categoria |

**Relacionamento de precos:**
- `unit_price`: Preco por unidade (ex: R$ 10,00 por kg)
- `price`: Preco total calculado (quantity × unit_price)
- A calculadora inteligente permite preencher qualquer combinacao e calcula o terceiro valor

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

### 2.18 Tabela: user_dietary_restrictions

Restricoes alimentares do usuario (alergias, intolerancias, dietas, etc).

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK) | Usuario |
| tenant_id | UUID (FK) | Tenant |
| restriction_type | VARCHAR(20) | allergy, intolerance, diet, religious, medical, preference |
| restriction_value | VARCHAR(100) | Valor da restricao (ex: gluten, lactose, vegetarian) |
| severity | VARCHAR(20) | mild, moderate, severe (principalmente para alergias) |
| notes | TEXT | Observacoes adicionais |
| created_at | TIMESTAMP | Data de criacao |
| updated_at | TIMESTAMP | Data de atualizacao |

**Constraint:**
- UNIQUE (user_id, tenant_id, restriction_type, restriction_value)

**Indices:**
- `idx_dietary_restrictions_user` - (user_id, tenant_id)
- `idx_dietary_restrictions_type` - (restriction_type)

**Tipos de Restricao:**
| Tipo | Descricao | Exemplos |
|------|-----------|----------|
| allergy | Alergias alimentares | gluten, lactose, amendoim, frutos do mar, ovo, soja |
| intolerance | Intolerancias | lactose, frutose, histamina, FODMAPs |
| diet | Dietas por escolha | vegetariano, vegano, low carb, cetogenica, paleo |
| religious | Restricoes religiosas | halal, kosher, sem carne de porco, sem carne bovina |
| medical | Condicoes medicas | diabetes, hipertensao, doenca celiaca, gota |
| preference | Preferencias pessoais | sem acucar refinado, apenas organicos, sem ultraprocessados |

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
- **Micronutrientes:** Botao "Ver Micronutrientes" nos alimentos (quando disponivel)
  - Exibe minerais: Calcio, Ferro, Magnesio, Fosforo, Potassio, Zinco, Cobre, Manganes
  - Exibe vitaminas: A, C, B1, B2, B3, B6
  - Exibe outros: Colesterol, Gordura Saturada

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
- **Micronutrientes:** Botao "Ver Micronutrientes" nos alimentos expandidos
  - Mesmo formato da Home: minerais, vitaminas e outros

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
- Cadastro manual com macros e micronutrientes
- Analise de foto de tabela nutricional (OCR) com extracao de micronutrientes
- Busca e listagem
- Marcacao como "purchasable"
- **Micronutrientes:**
  - Exibicao na listagem expandida (quando disponivel)
  - Campos editaveis no modal de edicao
  - Campos: Colesterol, Calcio, Ferro, Magnesio, Fosforo, Potassio, Zinco, Vit. C
  - Campos adicionais no banco: Cobre, Manganes, Vit. A, B1, B2, B3, B6

### 3.6 /lista-compras (Listas de Compras)

**Proposito:** Criar e gerenciar listas de compras.

**Funcionalidades:**
- CRUD de listas de compras
- CRUD de itens com preco
- Edicao de quantidade e unidade ao marcar item como comprado
- Sugestoes inteligentes baseadas em consumo
- Duplicacao de listas concluidas
- Calculo de total em tempo real (formato R$ brasileiro)
- Registro de loja/estabelecimento ao finalizar lista
- Visualizacao de listas concluidas (somente leitura)
- Edicao de precos e loja em listas concluidas
- Exclusao de listas concluidas
- Botao "Ver todas" para historico completo (exibe ultimas 5 por padrao)
- Botao "Painel" para acessar dashboard de gastos

**Calculadora Inteligente de Precos:**
Ao marcar um item como comprado, o usuario pode informar:
- **Quantidade**: Ex: 2.5 (kg, un, L, etc)
- **Preco Unitario**: Ex: R$ 12,50/kg
- **Preco Total**: Ex: R$ 31,25

A calculadora recalcula automaticamente:
- Se mudar quantidade e tiver preco unitario → recalcula total
- Se mudar preco unitario → recalcula total baseado na quantidade
- Se mudar preco total → recalcula unitario baseado na quantidade
- Util para produtos pesaveis onde o preco final so e conhecido na hora

**Fluxo de finalizacao:**
1. Usuario compra itens e marca como comprados
2. Botao "Finalizar Lista" aparece quando ha pelo menos 1 item comprado
3. Modal abre para selecionar/criar loja
4. Se houver itens NAO comprados:
   - Sistema exibe aviso com quantidade de itens pendentes
   - Apos selecionar loja, passo 2 pergunta nome para nova lista
   - Itens nao comprados sao transferidos para nova lista automaticamente
5. Lista original e marcada como completed com store_id
6. Nova lista (se criada) fica com status active

**Transferencia de itens pendentes:**
- Itens nao comprados sao copiados para nova lista
- Mantem: nome, quantidade, unidade, categoria, notas, preco unitario
- Reseta: is_purchased = false, price = null, purchased_at = null
- Lista original mantem registro completo para historico de gastos

**Escanear Nota Fiscal:**
Funcionalidade para importar itens automaticamente a partir de foto de nota/cupom fiscal.

1. Usuario clica no botao "Nota" na pagina de listas
2. Modal abre com campos: nome da lista, loja (opcional), foto da nota
3. Usuario tira foto ou seleciona imagem da nota fiscal
4. IA (Gemini) analisa a imagem e extrai os itens com:
   - Nome do produto (normalizado)
   - Quantidade (peso real para produtos por kg)
   - Unidade (UN, KG, L, etc)
   - Preco unitario
   - Preco total
5. Lista e criada ja como finalizada com todos os itens marcados como comprados
6. Usuario visualiza lista criada no mesmo formato da lista digitada

**Arquivos da funcionalidade:**
- `lib/ai/receipt-analyzer.ts` - Analisador de notas fiscais via Gemini
- `app/api/shopping-lists/scan-receipt/route.ts` - API de scan
- `lib/repos/shopping-list.repo.ts` - Funcao `createListFromReceipt()`

**APIs consumidas:**
- GET/POST/PATCH/DELETE /api/shopping-lists
- GET/POST /api/shopping-lists/items
- GET /api/shopping-lists/suggestions
- POST /api/shopping-lists/duplicate
- POST /api/shopping-lists/complete
- POST /api/shopping-lists/scan-receipt
- GET /api/shopping-lists/stats
- GET/POST /api/stores

### 3.6.1 /lista-compras/dashboard (Painel de Gastos)

**Proposito:** Dashboard analitico de gastos em compras.

**Funcionalidades:**
- Grafico de barras: Evolucao de gastos mensais (ultimos 12 meses)
- Grafico de pizza: Distribuicao de gastos por loja
- Grafico de linhas: Historico de precos unitarios (top 10 itens mais frequentes)

**Biblioteca de graficos:** Recharts

**Componentes utilizados:**
- `BarChart` - Evolucao mensal
- `PieChart` - Distribuicao por loja
- `LineChart` - Historico de precos

**APIs consumidas:**
- GET /api/shopping-lists/stats

**Resposta da API stats:**
```json
{
  "ok": true,
  "stats": {
    "monthly": [
      { "month": "2024-01", "total": 450.00 },
      { "month": "2024-02", "total": 520.30 }
    ],
    "byStore": [
      { "storeName": "Carrefour", "total": 1200.00 },
      { "storeName": "Assai", "total": 800.00 }
    ],
    "topItemsPriceHistory": [
      {
        "itemName": "Arroz",
        "history": [
          { "date": "2024-01-15", "price": 5.50 },
          { "date": "2024-02-20", "price": 5.90 }
        ]
      }
    ]
  }
}
```

**Observacoes:**
- Historico de precos so aparece a partir da 2a compra do mesmo item com preco unitario informado
- Permite acompanhar inflacao pessoal dos itens mais consumidos

### 3.7 /coach (Coach IA)

**Proposito:** Analise IA de habitos e progresso.

**Funcionalidades:**
- Analise inteligente baseada em dados
- Recomendacoes personalizadas
- Historico de analises
- PREMIUM ONLY
- **Analise de Micronutrientes:**
  - Coleta dados de micronutrientes dos ultimos 30 dias
  - Compara consumo medio diario com RDA (Recommended Dietary Allowance)
  - Identifica nutrientes < 70% RDA como "atencao necessaria"
  - Identifica nutrientes < 50% RDA como "possivel deficiencia"
  - Sugere fontes alimentares naturais para nutrientes em baixa
  - Tom profissional e educativo (nao faz diagnosticos medicos)
  - Recomenda consultar profissional de saude para avaliacao completa
- **Integracao com Restricoes Alimentares:**
  - Busca automatica das restricoes do usuario
  - Inclui restricoes no contexto enviado a IA
  - Agrupa por tipo (alergias, intolerancias, dietas, etc)
  - Informa severidade de alergias (leve, moderada, grave)
  - Diretrizes especificas para recomendacoes seguras

**Valores de Referencia (RDA) utilizados:**
| Nutriente | RDA/dia |
|-----------|---------|
| Calcio | 1000 mg |
| Ferro | 14 mg |
| Magnesio | 400 mg |
| Fosforo | 700 mg |
| Potassio | 3500 mg |
| Zinco | 11 mg |
| Vitamina C | 90 mg |
| Vitamina A | 900 mcg |
| Vitamina B1 | 1.2 mg |
| Vitamina B2 | 1.3 mg |
| Vitamina B3 | 16 mg |
| Vitamina B6 | 1.7 mg |

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
- Acesso a restricoes alimentares
- Deletar conta
- Logout

### 3.10.1 /restricoes (Restricoes Alimentares)

**Proposito:** Gerenciar alergias, intolerancias, dietas e outras restricoes alimentares.

**Funcionalidades:**
- Interface com abas por tipo de restricao (6 categorias)
- Selecao de restricoes pre-definidas (chips clicaveis)
- Adicao de restricoes personalizadas
- Configuracao de severidade para alergias (leve, moderada, grave)
- Integracao automatica com Coach IA

**Abas disponiveis:**
| Aba | Cor | Descricao |
|-----|-----|-----------|
| Alergias | Vermelho | Alergias alimentares com indicador de severidade |
| Intolerancias | Laranja | Intolerancias digestivas |
| Dietas | Verde | Dietas por escolha (vegetariano, vegano, etc) |
| Religiosas | Indigo | Restricoes religiosas (halal, kosher, etc) |
| Medicas | Rosa | Condicoes medicas (diabetes, hipertensao, etc) |
| Preferencias | Roxo | Preferencias pessoais |

**Restricoes pre-definidas:**
- **Alergias:** Gluten, Lactose, Amendoim, Castanhas/Nozes, Frutos do Mar, Peixes, Ovo, Soja, Trigo, Gergelim
- **Intolerancias:** Lactose, Frutose, Histamina, FODMAPs
- **Dietas:** Vegetariano, Vegano, Pescatariano, Low Carb, Cetogenica, Paleo, Mediterranea
- **Religiosas:** Halal, Kosher, Sem Carne de Porco, Sem Carne Bovina
- **Medicas:** Diabetes, Hipertensao, Doenca Celiaca, Fenilcetonuria, Gota, Doenca Renal
- **Preferencias:** Sem Acucar Refinado, Apenas Organicos, Sem Ultraprocessados

**Severidade de alergias:**
- **Leve:** Desconforto leve, pode consumir em pequenas quantidades
- **Moderada:** Reacao moderada, evitar consumo
- **Grave:** Risco de anafilaxia, evitar completamente

**Visual do chip de alergia selecionado:**
- Nome da alergia em cima
- Indicador colorido + nome da severidade embaixo
- Botao X separado para remover
- Clique na area principal abre modal de severidade

**APIs consumidas:**
- GET /api/dietary-restrictions
- POST /api/dietary-restrictions
- PATCH /api/dietary-restrictions
- DELETE /api/dietary-restrictions?id=UUID

### 3.11 /upgrade (Planos)

**Proposito:** Mostrar planos e promover upgrade.

### 3.12 /reports (Relatorios)

**Proposito:** Analises estatisticas (PREMIUM).

**Funcionalidades:**
- Resumo de macronutrientes no periodo
- Grafico de evolucao de calorias
- **Secao "Micronutrientes no Periodo":**
  - Minerais: Calcio, Ferro, Magnesio, Fosforo, Potassio, Zinco, Cobre, Manganes
  - Vitaminas: A, C, B1, B2, B3, B6
  - Limites de atencao: Colesterol e Gordura Saturada (destacados em vermelho se acima do limite)
  - Cada nutriente mostra: total consumido, meta para o periodo, % da meta
  - So exibe se houver dados de micronutrientes no periodo

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
| PATCH | /api/shopping-lists/items | Atualizar item (preco, quantidade, etc) |
| DELETE | /api/shopping-lists/items | Deletar item |
| GET | /api/shopping-lists/suggestions | Sugestoes baseadas em consumo |
| POST | /api/shopping-lists/duplicate | Duplicar lista |
| POST | /api/shopping-lists/complete | Finalizar lista com transferencia de pendentes |
| POST | /api/shopping-lists/scan-receipt | Escanear nota fiscal e criar lista |
| GET | /api/shopping-lists/stats | Estatisticas para dashboard de gastos |

**Campos do PATCH /api/shopping-lists/items:**
```json
{
  "name": "Arroz",
  "quantity": 2.5,
  "unit": "kg",
  "is_purchased": true,
  "price": 31.25,
  "unit_price": 12.50
}
```

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

**Campos do POST /api/shopping-lists/complete:**
```json
{
  "list_id": "uuid-da-lista",
  "store_id": "uuid-da-loja", // opcional
  "new_list_name": "Pendentes Mercado - 29/12" // obrigatorio se houver itens nao comprados
}
```

**Resposta do POST /api/shopping-lists/complete:**
```json
{
  "ok": true,
  "new_list": { "id": "uuid", "name": "..." }, // null se nao criou nova lista
  "transferred_items": 3 // quantidade de itens transferidos
}
```

**POST /api/shopping-lists/scan-receipt (multipart/form-data):**
- `image`: Arquivo de imagem da nota fiscal (obrigatorio)
- `name`: Nome da lista (opcional, default: "Compras DD/MM")
- `store_id`: UUID da loja (opcional)

**Resposta do POST /api/shopping-lists/scan-receipt:**
```json
{
  "ok": true,
  "list": { "id": "uuid", "name": "Compras 29/12" },
  "analysis": {
    "items_count": 15,
    "total": 234.50,
    "date": "2024-12-29"
  }
}
```

### 4.14 Restricoes Alimentares

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/dietary-restrictions | Listar restricoes do usuario |
| POST | /api/dietary-restrictions | Adicionar restricao |
| PATCH | /api/dietary-restrictions | Atualizar restricao (severidade, notas) |
| DELETE | /api/dietary-restrictions?id=UUID | Remover restricao |

**Campos do POST:**
```json
{
  "restriction_type": "allergy", // allergy, intolerance, diet, religious, medical, preference
  "restriction_value": "gluten",
  "severity": "moderate", // opcional, para alergias: mild, moderate, severe
  "notes": "Confirmado por exame" // opcional
}
```

**Campos do PATCH:**
```json
{
  "id": "uuid-da-restricao",
  "severity": "severe",
  "notes": "Atualizado apos reacao"
}
```

### 4.15 Relatorios

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/reports/analysis | Analise (PREMIUM) |
| GET | /api/reports/inflammation | Inflamacao intestinal |

### 4.16 Conta

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
- **ai/nutrition-label-analyzer.ts** - OCR de tabelas nutricionais
- **ai/receipt-analyzer.ts** - OCR de notas fiscais
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
  - dietary-restrictions.repo.ts
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
│   │   ├── page.tsx (lista principal)
│   │   └── dashboard/
│   │       └── page.tsx (painel de gastos)
│   ├── coach/
│   ├── objetivos/
│   ├── restaurants/
│   ├── restricoes/
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
│       │   ├── route.ts (GET, POST listas)
│       │   ├── [id]/route.ts (GET, PATCH, DELETE lista)
│       │   ├── items/route.ts (POST, PATCH, DELETE itens)
│       │   ├── suggestions/route.ts (GET sugestoes)
│       │   ├── duplicate/route.ts (POST duplicar)
│       │   ├── complete/route.ts (POST finalizar com transferencia)
│       │   └── stats/route.ts (GET estatisticas)
│       ├── dietary-restrictions/
│       │   └── route.ts (GET, POST, PATCH, DELETE)
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

**Edicao de Itens Comprados:**
- Quantidade e unidade agora sao editaveis ao marcar item como comprado
- Permite ajustar quando a quantidade real difere da planejada (ex: lista tinha 1kg, comprou 500g)
- Inputs inline para quantidade, unidade e preco

**Correcoes:**
- Fix na API de sugestoes (`/api/shopping-lists/suggestions`) - campos `consumption_count` e `days_consumed` nao estavam sendo retornados corretamente
- Fix no layout dos inputs de data no periodo personalizado da pagina de relatorios
- Fix na formatacao do total da lista de compras - valores eram concatenados como string em vez de somados (ex: "065.00" ao inves de "R$ 65,00")

**Remocoes:**
- Removido sistema de internacionalizacao (next-intl) - app e apenas em portugues
- Removida pasta `messages/` e `lib/i18n/`

### 27/12/2024

**Calculadora Inteligente de Precos:**
- Novo campo `unit_price` (NUMERIC 10,2) na tabela `shopping_items`
- Logica de recalculo automatico ao editar quantidade, preco unitario ou preco total
- Interface com 4 campos editaveis: Qtd, Unid, R$ Unit., R$ Total
- Atualizacao otimista da UI para melhor experiencia do usuario

**Painel de Gastos (Dashboard):**
- Nova pagina `/lista-compras/dashboard` com graficos Recharts
- Grafico de barras: Evolucao de gastos mensais (ultimos 12 meses)
- Grafico de pizza: Distribuicao de gastos por loja
- Grafico de linhas: Historico de precos unitarios (top 10 itens mais frequentes)
- Nova rota API `GET /api/shopping-lists/stats` para fornecer dados estatisticos
- Funcao `getShoppingStats()` no repositorio `shopping-list.repo.ts`

**Correcoes:**
- Fix na navegacao do botao "Painel": trocado `window.location.href` por `router.push()` para compatibilidade com Capacitor/iOS (navegacao client-side evita perda de sessao)

### 28/12/2024

**Sistema de Micronutrientes (16 campos adicionais):**

Expansao do sistema de nutrientes de 7 campos basicos para 23 campos, incluindo vitaminas e minerais.

**Novos campos na tabela `nutrition_data`:**
- Colesterol (mg), Gordura Saturada (g)
- Minerais: Calcio, Magnesio, Fosforo, Ferro, Potassio, Zinco, Cobre, Manganes (mg)
- Vitaminas: C (mg), A (mcg), B1, B2, B3, B6 (mg)

**Novos campos na tabela `food_bank`:**
- Mesmos 15 micronutrientes para banco de alimentos do usuario

**Paginas atualizadas:**

1. **Home (app/page.tsx):**
   - Tipo Food atualizado com 16 micronutrientes
   - Botao "Ver Micronutrientes" nos cards de alimentos expandidos
   - Secao expansivel com Minerais, Vitaminas e Outros

2. **Historico (components/CalendarView.tsx):**
   - Mesmo sistema de exibicao de micronutrientes da Home

3. **Relatorios (app/reports/page.tsx):**
   - Secao "Micronutrientes no Periodo" com totais e metas
   - Minerais em grid de 4 colunas com cores distintas
   - Vitaminas em grid de 3 colunas
   - Limites de atencao para Colesterol e Gordura Saturada

4. **Meus Alimentos (app/meus-alimentos/page.tsx):**
   - Interface FoodBankItem atualizada com micronutrientes
   - Exibicao de micronutrientes na listagem expandida
   - Campos de micronutrientes no modal de edicao
   - Payload de salvamento atualizado

5. **Coach IA (lib/services/coach.service.ts):**
   - Coleta de micronutrientes agregados dos ultimos 30 dias
   - Tabela com consumo vs RDA no prompt
   - Diretrizes profissionais para analise de micronutrientes
   - Tom educativo, nao alarmista
   - Sugere fontes alimentares naturais
   - Reconhece limitacoes dos dados

**APIs atualizadas:**

- `/api/food-bank` (route.ts): Schemas Zod com 15 micronutrientes
- `lib/repos/food-bank.repo.ts`: INSERT/UPDATE com todos os campos
- `lib/repos/meal.repo.ts`: INSERT/SELECT com 23 campos (ja feito anteriormente)
- `lib/ai/nutrition-label-analyzer.ts`: Extracao de micronutrientes via OCR (ja feito anteriormente)

**Valores de Referencia (RDA) implementados no Coach:**
- Calcio: 1000mg, Ferro: 14mg, Magnesio: 400mg
- Fosforo: 700mg, Potassio: 3500mg, Zinco: 11mg
- Vitamina C: 90mg, A: 900mcg, B1: 1.2mg
- B2: 1.3mg, B3: 16mg, B6: 1.7mg

### 29/12/2024

**Sistema de Restricoes Alimentares:**

Nova funcionalidade para gerenciar alergias, intolerancias, dietas e outras restricoes alimentares do usuario.

**Tabela `user_dietary_restrictions`:**
- Campos: restriction_type, restriction_value, severity, notes
- 6 tipos de restricao: allergy, intolerance, diet, religious, medical, preference
- Severidade configuravel para alergias (mild, moderate, severe)
- Constraint UNIQUE por usuario/tipo/valor

**Nova pagina `/restricoes`:**
- Interface com 6 abas coloridas por tipo
- Restricoes pre-definidas como chips clicaveis
- Adicao de restricoes personalizadas via modal
- Alergias mostram severidade em chip expandido
- Modal para editar severidade de alergias

**Novos arquivos:**
- `lib/constants/dietary-restrictions.ts` - Tipos e constantes
- `lib/repos/dietary-restrictions.repo.ts` - Repository
- `app/api/dietary-restrictions/route.ts` - API (GET, POST, PATCH, DELETE)
- `app/restricoes/page.tsx` - Pagina de gerenciamento

**Integracao com Coach IA:**
- Busca automatica de restricoes em `gatherUserContext()`
- Novo campo `dietaryRestrictions` no contexto
- Secao dedicada no prompt com agrupamento por tipo
- Diretrizes para recomendacoes seguras:
  - NUNCA recomendar ingredientes de alergias
  - Sugerir alternativas para intolerancias
  - Respeitar dietas e restricoes religiosas
  - Considerar condicoes medicas nas sugestoes

**Atualizacao na pagina `/account`:**
- Nova secao "Restricoes Alimentares" no accordion
- Link para pagina `/restricoes`

---

**Finalizacao de Lista com Transferencia de Pendentes:**

Novo fluxo permite finalizar lista mesmo com itens nao comprados.

**Mudancas no fluxo:**
- Botao "Finalizar" aparece quando ha pelo menos 1 item comprado
- Se houver pendentes: aviso amarelo mostra quantidade
- Apos selecionar loja, passo 2 pergunta nome da nova lista
- Itens nao comprados transferidos automaticamente

**Nova API `/api/shopping-lists/complete`:**
- Recebe: list_id, store_id, new_list_name
- Retorna: ok, new_list (se criada), transferred_items
- Cria nova lista ativa com itens pendentes
- Finaliza lista original como completed

**Nova funcao no repository:**
- `createListFromUnpurchasedItems()` em shopping-list.repo.ts
- Copia itens nao comprados para nova lista
- Mantem dados do item, reseta status de compra

---

*Documentacao gerada em 25/12/2024*
*Atualizada em 29/12/2024*
