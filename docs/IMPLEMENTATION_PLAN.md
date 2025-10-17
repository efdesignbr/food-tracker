# 📋 PLANO DE IMPLEMENTAÇÃO - NOVAS FUNCIONALIDADES

**Data**: 16/10/2025
**Projeto**: Food Tracker
**Status**: ✅ Em Andamento - 3 de 6 features concluídas

---

## 🎯 OBJETIVOS

Adicionar 7 novas funcionalidades ao food-tracker sem quebrar o que já está funcionando:

1. Campo de texto para fotos de refeição
2. Local da refeição (casa/rua) com autocomplete de restaurantes
3. Banco de Alimentos com análise de IA de tabelas nutricionais
4. Edição de valores nutricionais gerados pela IA
5. Registro de peso diário
6. Análise de IA nos relatórios com período customizável
7. Manter tudo funcionando perfeitamente

---

## 📊 PROGRESSO ATUAL

### ✅ FEATURES CONCLUÍDAS (3/6)

**✅ Feature #1: Campo de texto para fotos de refeição**
- Arquivo modificado: `app/capture/page.tsx`
- Adicionado campo `photoDescription` que combina com `notes`
- Texto salvo no campo existente `meals.notes`
- Exibido na revisão e histórico

**✅ Feature #4: Edição de valores nutricionais**
- Arquivo modificado: `app/capture/page.tsx`
- Todos os campos nutricionais (calorias, proteínas, carboidratos, gorduras) são editáveis
- Inputs numéricos com atualização em tempo real
- Valores editados são salvos corretamente

**✅ Feature #5: Registro de peso diário**
- Migração #4 executada: tabela `weight_logs` criada com UUID
- Arquivos criados:
  - `lib/repos/weight.repo.ts` (CRUD completo)
  - `app/api/weight/route.ts` (REST API)
  - `app/peso/page.tsx` (UI completa)
- Menu "Peso ⚖️" adicionado em `components/AppLayout.tsx`
- Funcionalidades: registro, histórico, exclusão, exibição do último peso

### ⏳ FEATURES PENDENTES (3/6)

**Feature #2: Local da refeição + Restaurantes**
- Requer migrações #1 e #2 (não executadas ainda)
- Arquivos de migração criados em `docs/migrations/`

**Feature #6: Análise de IA nos relatórios**
- Não requer migração
- Próxima recomendada para implementação

**Feature #3: Banco de Alimentos**
- Requer migração #3 (não executada ainda)
- Arquivo de migração criado em `docs/migrations/`

### 🛠️ INFRAESTRUTURA ADICIONAL CRIADA

**Sistema de Documentação Automática do Schema**
- Script: `scripts/extract-schema.ts`
- Comando: `npm run db:schema`
- Gera: `docs/database/CURRENT_SCHEMA.md`
- Documentação: `docs/database/README.md`
- **Propósito**: Evitar erros de tipo (INTEGER vs UUID) em futuras migrações

**Arquivos de Migração Corrigidos**
- Todos os arquivos em `docs/migrations/` foram corrigidos para usar UUID
- Migrações usam `uuid_generate_v4()` ao invés de SERIAL/INTEGER

---

## 🏗️ ARQUITETURA ATUAL

**Stack Identificado**:
- Next.js 14 + React 18 + TypeScript
- PostgreSQL (Supabase)
- Google Gemini AI
- NextAuth para autenticação
- Multi-tenant com isolamento por tenant_id

**Banco de Dados Atual** (8 tabelas):
- `tenants`
- `users`
- `meals`
- `food_items`
- `nutrition_data`
- `water_intake`
- `bowel_movements`
- `weight_logs` ✅ (adicionada)

---

## ⚠️ REGRAS IMPORTANTES

### 🔴 MIGRAÇÕES DE BANCO DE DADOS
- **TODAS as migrações SQL devem ser executadas MANUALMENTE no dashboard do Supabase**
- **NUNCA executar migrações automaticamente pelo código**
- O desenvolvedor será informado quando cada migração deve ser executada
- Aguardar confirmação antes de prosseguir com o código que depende da migração

### 🛡️ PROTEÇÃO DO CÓDIGO EXISTENTE
- Testar cada feature isoladamente antes de integrar
- Manter multi-tenancy em todas as novas queries
- Preservar TypeScript + Zod em todas as validações
- Não modificar estruturas existentes sem necessidade

---

## 📝 DETALHAMENTO DAS FEATURES

### **1️⃣ Campo de texto para fotos de refeição**

**Impacto**: BAIXO - Apenas UI/UX
**Status**: ✅ CONCLUÍDA

**Arquivos afetados**:
- `app/capture/page.tsx` - Adicionar textarea
- Banco de dados - Campo `notes` já existe na tabela `meals`

**Passos**:
1. ✅ Adicionar campo de texto (textarea) na UI de captura de foto
2. ✅ Salvar o texto junto com a foto no campo `notes` existente
3. ✅ Exibir o texto na revisão da refeição
4. ✅ Mostrar o texto no histórico

**Dependências**: Nenhuma
**Migração necessária**: ❌ Não

---

### **2️⃣ Local da refeição (casa/rua) + Restaurantes**

**Impacto**: MÉDIO - Nova tabela + Autocomplete
**Status**: ⏳ Pendente

**Novos arquivos**:
- `lib/db/restaurants.ts` - CRUD de restaurantes
- `app/api/restaurants/route.ts` - API de autocomplete
- `app/api/restaurants/search/route.ts` - Busca por nome
- Componente de seleção de local

**Passos**:
1. 🔴 **EXECUTAR MIGRAÇÃO #1** (criar tabela `restaurants`)
2. 🔴 **EXECUTAR MIGRAÇÃO #2** (adicionar campos em `meals`)
3. ✅ Criar CRUD de restaurantes
4. ✅ Criar API de autocomplete
5. ✅ Criar componente de seleção de local
6. ✅ Integrar no formulário de captura
7. ✅ Exibir local no histórico e relatórios

**Dependências**: Migrações #1 e #2
**Migração necessária**: ✅ Sim (ver seção Migrações)

---

### **3️⃣ Banco de Alimentos ("Meus Alimentos")**

**Impacto**: ALTO - Novo módulo completo
**Status**: ⏳ Pendente

**Sugestões de nome**:
- 🥇 **"Meus Alimentos"** (escolhido)
- "Alimentos Favoritos"
- "Biblioteca de Alimentos"
- "Banco de Alimentos"

**Novos arquivos**:
- `app/meus-alimentos/page.tsx` - Página principal (listagem)
- `app/meus-alimentos/novo/page.tsx` - Cadastro de novo alimento
- `app/api/food-bank/route.ts` - CRUD
- `app/api/food-bank/analyze-label/route.ts` - IA para analisar tabela nutricional
- `lib/db/food-bank.ts` - Lógica de banco de dados
- `lib/ai/nutrition-label-analyzer.ts` - Análise de tabela nutricional

**Passos**:
1. 🔴 **EXECUTAR MIGRAÇÃO #3** (criar tabela `food_bank`)
2. ✅ Criar página de listagem de alimentos
3. ✅ Criar formulário de cadastro com upload de foto
4. ✅ Integrar Gemini AI para extrair dados da tabela nutricional
5. ✅ Permitir cadastro manual sem foto
6. ✅ Adicionar menu na navegação
7. ✅ Criar sistema de cache/favoritos baseado em uso
8. ✅ Permitir usar alimento do banco na captura de refeição

**Dependências**: Migração #3
**Migração necessária**: ✅ Sim (ver seção Migrações)

---

### **4️⃣ Edição de valores nutricionais**

**Impacto**: BAIXO - Apenas UI interativa
**Status**: ✅ CONCLUÍDA

**Arquivos afetados**:
- `app/capture/page.tsx` - Tornar campos editáveis
- `app/api/meals/route.ts` - Já suporta edição (apenas usar)

**Passos**:
1. ✅ Transformar exibição de nutrientes em campos editáveis
2. ✅ Adicionar validação de valores numéricos (Zod)
3. ✅ Permitir salvar valores editados
4. ✅ Adicionar feedback visual de edição
5. ⚪ (Opcional) Manter histórico de edições

**Dependências**: Nenhuma
**Migração necessária**: ❌ Não

---

### **5️⃣ Registro de peso diário**

**Impacto**: MÉDIO - Nova tabela + Nova página
**Status**: ✅ CONCLUÍDA

**Arquivos criados**:
- `app/peso/page.tsx` - Página de registro ✅
- `app/api/weight/route.ts` - CRUD ✅
- `lib/repos/weight.repo.ts` - Lógica de banco de dados ✅
- `components/AppLayout.tsx` - Menu "Peso ⚖️" adicionado ✅

**Passos**:
1. ✅ **MIGRAÇÃO #4 EXECUTADA** (tabela `weight_logs` criada com UUID)
2. ✅ Criar página de registro de peso
3. ✅ Criar formulário de entrada de peso
4. ⏸️ Adicionar gráfico de evolução de peso (planejado para futuro)
5. ⏸️ Integrar dados de peso nos relatórios (planejado para futuro)
6. ✅ Adicionar menu na navegação
7. ✅ Permitir múltiplos registros por dia (pegar o mais recente)
8. ✅ Implementar funcionalidade de exclusão de registros

**Dependências**: Migração #4 ✅ EXECUTADA
**Migração necessária**: ✅ Sim - JÁ EXECUTADA

---

### **6️⃣ Análise de IA nos relatórios + Período customizável**

**Impacto**: MÉDIO - Extensão de funcionalidade existente
**Status**: ⏳ Pendente

**Arquivos afetados**:
- `app/reports/page.tsx` - Adicionar filtros de data
- `app/api/reports/analysis/route.ts` - Nova API
- `lib/ai/reports-analysis.ts` - Lógica de análise

**Passos**:
1. ✅ Adicionar seletor de período customizável (date range picker)
2. ✅ Adicionar opção de período: diário, semanal, ou customizado
3. ✅ Criar prompt para IA analisar refeições do período
4. ✅ Criar API que envia dados para Gemini e retorna análise
5. ✅ Exibir análise em formato legível na página de relatórios
6. ✅ Incluir análises sobre:
   - Balanço calórico
   - Distribuição de macronutrientes
   - Alimentos inflamatórios consumidos
   - Regularidade das refeições
   - Hidratação
   - Sugestões de melhoria

**Dependências**: Nenhuma
**Migração necessária**: ❌ Não

---

## 🗄️ MIGRAÇÕES DE BANCO DE DADOS

### 📌 IMPORTANTE
**Todas as migrações devem ser executadas MANUALMENTE no dashboard do Supabase.**
Você será avisado quando executar cada uma delas.

---

### 🔴 MIGRAÇÃO #1: Criar tabela `restaurants`

**Quando executar**: Antes de implementar Feature #2

```sql
-- Tabela de restaurantes
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por tenant
CREATE INDEX idx_restaurants_tenant_id ON restaurants(tenant_id);

-- Índice para autocomplete por nome
CREATE INDEX idx_restaurants_name ON restaurants(name);

COMMENT ON TABLE restaurants IS 'Cadastro de restaurantes para rastreamento de refeições externas';
```

---

### 🔴 MIGRAÇÃO #2: Adicionar campos de localização em `meals`

**Quando executar**: Após MIGRAÇÃO #1, antes de implementar Feature #2

```sql
-- Adicionar campos de localização na tabela meals
ALTER TABLE meals
  ADD COLUMN location_type VARCHAR(10) CHECK (location_type IN ('home', 'out')),
  ADD COLUMN restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL;

-- Índice para filtrar por tipo de local
CREATE INDEX idx_meals_location_type ON meals(location_type);

-- Índice para buscar refeições por restaurante
CREATE INDEX idx_meals_restaurant_id ON meals(restaurant_id);

COMMENT ON COLUMN meals.location_type IS 'Tipo de local: home (casa) ou out (fora de casa)';
COMMENT ON COLUMN meals.restaurant_id IS 'Referência ao restaurante se location_type = out';
```

---

### 🔴 MIGRAÇÃO #3: Criar tabela `food_bank`

**Quando executar**: Antes de implementar Feature #3

```sql
-- Tabela de banco de alimentos
CREATE TABLE food_bank (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  serving_size VARCHAR(100),
  photo_url TEXT,

  -- Informações nutricionais (por porção)
  calories DECIMAL(10,2),
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fat DECIMAL(10,2),
  fiber DECIMAL(10,2),
  sodium DECIMAL(10,2),
  sugar DECIMAL(10,2),
  saturated_fat DECIMAL(10,2),

  -- Controle de uso
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,

  -- Metadados
  source VARCHAR(50) DEFAULT 'manual', -- 'manual' ou 'ai_analyzed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_food_bank_tenant_id ON food_bank(tenant_id);
CREATE INDEX idx_food_bank_user_id ON food_bank(user_id);
CREATE INDEX idx_food_bank_name ON food_bank(name);
CREATE INDEX idx_food_bank_usage_count ON food_bank(usage_count DESC);

COMMENT ON TABLE food_bank IS 'Banco de alimentos frequentes com informações nutricionais';
COMMENT ON COLUMN food_bank.source IS 'Origem dos dados: manual ou ai_analyzed (tabela nutricional)';
```

---

### 🔴 MIGRAÇÃO #4: Criar tabela `weight_logs`

**Quando executar**: Antes de implementar Feature #5

```sql
-- Tabela de registro de peso
CREATE TABLE weight_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight < 500),
  log_date DATE NOT NULL,
  log_time TIME DEFAULT CURRENT_TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Um usuário pode ter múltiplos registros por dia (manhã/noite)
  UNIQUE(user_id, log_date, log_time, tenant_id)
);

-- Índices
CREATE INDEX idx_weight_logs_tenant_id ON weight_logs(tenant_id);
CREATE INDEX idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX idx_weight_logs_date ON weight_logs(log_date DESC);

COMMENT ON TABLE weight_logs IS 'Registro diário de peso dos usuários';
COMMENT ON COLUMN weight_logs.weight IS 'Peso em kg, limite entre 0 e 500kg';
```

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO

### **Estratégia**: Do mais simples ao mais complexo

1. **Feature #1** - Campo de texto em fotos (SEM migração)
2. **Feature #4** - Editar nutrientes (SEM migração)
3. **Feature #5** - Peso diário (MIGRAÇÃO #4)
4. **Feature #2** - Local/restaurantes (MIGRAÇÕES #1 e #2)
5. **Feature #6** - Análise IA relatórios (SEM migração)
6. **Feature #3** - Banco de Alimentos (MIGRAÇÃO #3)

### **Justificativa da ordem**:
- Começar sem migrações para validar fluxo
- Testar integração com IA antes de features complexas
- Deixar módulo mais complexo (Banco de Alimentos) por último

---

## ✅ CHECKLIST DE VALIDAÇÃO

Para cada feature implementada, verificar:

### 🔒 Segurança
- [ ] Multi-tenancy respeitado (tenant_id em todas as queries)
- [ ] Validação de permissões por usuário
- [ ] Sanitização de inputs
- [ ] Proteção contra SQL injection (usar queries parametrizadas)

### 💻 Código
- [ ] TypeScript sem erros
- [ ] Validação Zod implementada
- [ ] Tratamento de erros adequado
- [ ] Código comentado em pontos complexos

### 🎨 Interface
- [ ] UI responsiva (mobile-first)
- [ ] Loading states implementados
- [ ] Mensagens de erro em português
- [ ] Feedback visual de sucesso/erro

### 🧪 Testes
- [ ] Funcionalidade testada manualmente
- [ ] Features existentes não foram quebradas
- [ ] Testar em diferentes tamanhos de tela
- [ ] Testar com dados reais

---

## 📊 CRONOGRAMA ESTIMADO

| Feature | Complexidade | Tempo Estimado |
|---------|--------------|----------------|
| #1 - Texto em fotos | Baixa | 1-2h |
| #4 - Editar nutrientes | Baixa | 2-3h |
| #5 - Peso diário | Média | 4-6h |
| #2 - Local/restaurantes | Média | 5-7h |
| #6 - Análise IA relatórios | Média | 6-8h |
| #3 - Banco de Alimentos | Alta | 10-12h |
| **TOTAL** | - | **28-38h** |

*Tempo não inclui testes extensivos e ajustes finos*

---

## 📝 NOTAS FINAIS

### ⚠️ Pontos de atenção
1. **Sempre** testar multi-tenancy
2. **Sempre** aguardar confirmação antes de executar migrações
3. **Sempre** validar que features existentes não quebraram
4. Manter consistência de UI/UX com o resto do app
5. Usar português em todas as mensagens para o usuário

### 🎯 Objetivo principal
**Adicionar todas as funcionalidades sem quebrar nada que já está funcionando!**

---

**Status atual**: ✅ 3 de 6 features concluídas
**Próximo passo recomendado**: Feature #6 - Análise de IA nos relatórios (não requer migração)
**Alternativa**: Feature #2 - Local/restaurantes (requer executar migrações #1 e #2 primeiro)

---

## 🔧 Atualização de 16/10/2025 — Correção na Análise de Período (IA)

**Contexto**
- Ao solicitar a análise de período na página de relatórios, ocorria o erro: `Cannot read properties of undefined (reading 'query')`.

**Causa Raiz**
- No endpoint `app/api/reports/analysis/route.ts`, o código importava um símbolo inexistente (`{ db }` de `@/lib/db`) e chamava `db.query(...)`.
- O módulo correto exporta `getPool()` (PostgreSQL `Pool`), portanto `db` era `undefined` e o acesso a `.query` quebrava.

**Correção Aplicada**
- Substituída a importação por `import { getPool } from '@/lib/db';` e criada uma instância `const pool = getPool();`.
- Trocado `db.query(...)` por `pool.query(...)` para buscar o histórico de água no período.
- Arquivo ajustado: `app/api/reports/analysis/route.ts` (seção de busca de hidratação).

**Observações**
- O arquivo de análise de IA está em `lib/ai/reports-analyzer.ts` (nome real). O plano menciona `lib/ai/reports-analysis.ts` — manteremos essa referência, mas tomamos nota do nome efetivo do arquivo no código.

**Próximos Passos**
- Validar a chamada de análise na UI (`app/reports/page.tsx`) com diferentes períodos: 7 dias, 30 dias e customizado.
- Conferir mensagens de erro amigáveis para períodos sem refeições (o endpoint já retorna 404 com mensagem adequada).
- Confirmar presença de `GEMINI_API_KEY` no ambiente para a geração da análise.

---

## 🚀 Próxima Implementação — Feature #2: Local da refeição + Restaurantes

**Resumo**
- Adicionar captura do local da refeição (casa/fora) e permitir selecionar/auto-completar restaurante quando for “fora”.
- Exibir o local no histórico e relatórios.

**Impacto**: Médio

**Dependências**: 🔴 Migração #1 (tabela `restaurants`) e 🔴 Migração #2 (campos em `meals`).

**Plano Técnico (alto nível)**
- Banco de Dados (executar manualmente no Supabase):
  - Criar `restaurants` (com índices para `tenant_id` e `name`).
  - Adicionar `location_type` (home|out) e `restaurant_id` em `meals` com índices.
- Backend:
  - `lib/db/restaurants.ts`: CRUD básico (listagem/insert simples, com `tenant_id`).
  - `app/api/restaurants/route.ts`: GET (lista básica por popularidade/uso), POST (criar restaurante).
  - `app/api/restaurants/search/route.ts`: GET `?q=...` para autocomplete por nome (limit 10, ordenado por similaridade/usage_count se existir).
  - Ajustar `app/api/meals/route.ts` (ou fluxo de criação existente) para aceitar `location_type` e `restaurant_id`.
- UI/UX:
  - `app/capture/page.tsx`: adicionar escolha “Local: Casa | Fora” e, se “Fora”, input com autocomplete de restaurantes.
  - Histórico/Relatórios: exibir ícone/label do local e, se houver, o nome do restaurante.

**Critérios de Aceite**
- É possível salvar refeição com `location_type = home` sem restaurante.
- É possível salvar refeição com `location_type = out` e um `restaurant_id` válido do tenant.
- Autocomplete retorna resultados do tenant (multi-tenant OK) e não vaza dados entre tenants.
- Histórico e relatórios exibem o local corretamente.
- Todas as queries protegem por `tenant_id` e usam parâmetros.

**Notas**
- As seções de migração nesta doc usam exemplos com tipos inteiros em alguns trechos; a base atual opera com UUID. Ao aplicar no Supabase, ajustar os tipos para UUID conforme o padrão do projeto (sem remover este conteúdo existente).

**Próximos passos operacionais**
1) Aprovar execução das Migrações #1 e #2 no Supabase (com UUID conforme padrão atual).
2) Implementar endpoints e CRUD de restaurantes.
3) Integrar UI de local na captura e exibição no histórico/relatórios.
4) Testar fluxo completo por tenant (incluindo RLS, se aplicável).

---

## 🔧 Atualização de 16/10/2025 — Progresso Feature #2 (Local/Restaurantes)

**Status**: Em andamento

**Migrações**
- ✅ Executadas pelo operador: Migração #1 (restaurants) e #2 (location_type/restaurant_id em meals), com `restaurant_id` em UUID.

**Backend**
- ✅ `app/api/restaurants/route.ts` — GET lista por tenant; POST criação com `tenant_id`.
- ✅ `app/api/restaurants/search/route.ts` — GET `?q=` com filtro `ILIKE` por tenant.
- ✅ `lib/db/restaurants.ts` — Funções `createRestaurant`, `listRestaurants`, `searchRestaurants`.
- ✅ `app/api/meals/approve/route.ts` — Aceita `location_type` e `restaurant_id` (valida obrigatoriedade de restaurante quando `location_type = 'out'`).
- ✅ `lib/repos/meal.repo.ts` — Insert inclui `location_type` e `restaurant_id`; query de listagem agrega `restaurant_name` via `LEFT JOIN`.

**Frontend**
- ✅ `app/capture/page.tsx` — UI para selecionar local (Casa/Fora) e autocomplete de restaurante; payload inclui `location_type` e `restaurant_id`.
- ✅ `components/CalendarView.tsx` — Exibe chip do local (🏠 Casa ou 🍽️ Nome do restaurante) nas refeições do dia.
- ✅ `app/reports/page.tsx` — Resumo de locais (contagem casa/fora) e top restaurantes.
- ✅ `app/restaurants/page.tsx` — Página com listagem e cadastro rápido de restaurantes; acesso via menu “Restaurantes”.
- ✅ `components/AppLayout.tsx` — Adicionado item de menu “Restaurantes”.
- ✅ Pré-análise da IA recebe o contexto de local (casa/fora e nome do restaurante, se houver) nos endpoints `analyze-text` e `analyze-image`.
- ✅ `app/history/page.tsx` — Tipos atualizados para campos opcionais de local.

**Pendências UX (opcional)**
- [ ] Botão “Cadastrar restaurante” direto do autocomplete quando não houver resultados.
- [ ] Resumo por local na página de Relatórios (`/app/reports/page.tsx`).
  
  Observação: o fluxo de captura já oferece o botão “➕ Cadastrar "<consulta>"” quando não há resultados; podemos evoluir com captura de endereço opcional.

---

## ✅ Atualização de 16/10/2025 — Conclusão (base) da Feature #2

**Resumo do que foi concluído agora**
- Menu superior “Restaurantes” adicionado e página dedicada criada (`/restaurants`) com listagem e cadastro rápido (nome obrigatório, endereço opcional).
- Na captura (Foto e Texto), o “📍 Local da Refeição” vem ANTES da análise de IA; o contexto (casa/fora e nome do restaurante) é enviado aos endpoints `analyze-text`/`analyze-image` e incorporado no prompt da IA.
- Autocomplete de restaurante com fallback: se não houver resultados, é oferecido “➕ Cadastrar "consulta"” e o item é criado e selecionado imediatamente.
- Salvamento de refeições com `location_type` e `restaurant_id` (obrigatório quando `out`), exibidos no Histórico e considerados nos Relatórios.

**Arquivos principais tocados (resumo)**
- Navegação: `components/AppLayout.tsx` (menu “Restaurantes”).
- Página: `app/restaurants/page.tsx` (listagem + cadastro rápido).
- APIs: `app/api/restaurants/*`, `app/api/meals/approve/route.ts`, `app/api/meals/analyze-*`.
- Domínios: `lib/db/restaurants.ts`, `lib/repos/meal.repo.ts`, `lib/schemas/meal.ts`, `lib/ai.ts`.
- UI: `app/capture/page.tsx`, `app/history/page.tsx`, `components/CalendarView.tsx`, `app/reports/page.tsx`.

**Status**
- Consideramos a Feature #2 implementada na sua versão base (CRUD + UI + integração com IA e salvamento). Próximos incrementos possíveis permanecem listados em “Pendências UX (opcional)”.

**Checklist rápido (segurança e multi-tenant)**
- Queries protegidas por `tenant_id` e parametrizadas (inclui `set_config('app.tenant_id', ...)` quando aplicável).
- Sem vazamento entre tenants em listagem/autocomplete.
- Mensagens de erro em PT-BR e validações mínimas.
