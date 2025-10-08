**Fase 1: Backend Core**
1. Setup do projeto (package.json, tsconfig, Docker)
2. Configuração de banco de dados (migrations - incluindo users, goals, insights)
3. Serviço de análise de IA de refeições (ai-analysis.service.ts)
4. Repository e Service de meals (com suporte a consumed_at)
5. Controller e rotas de meals
6. Serviço de estatísticas (nutrition.service.ts)
7. Module de goals (CRUD completo)
8. Serviço de insights IA (ai-insights.service.ts)
9. Cron jobs para análises automáticas
10. Middleware de erro e validação

**Fase 2: Frontend Core**
1. Setup do projeto (Vite, Tailwind)
2. Serviço de API (api.service.ts)
3. Componente de captura de câmera (com seletor de data/hora)
4. Componente de revisão nutricional
5. Componente seletor de visualização (dia/semana/mês)
6. Dashboard diário com timeline
7. Dashboard semanal com gráficos
8. Dashboard mensal com calendário
9. Formulário de objetivos
10. Componente de insights IA
11. Página de histórico completo

**Fase 3: Integração e Refinamento**
1. Testes end-to-end do fluxo completo
2. Ajustes de UX baseados em uso real
3. Otimização de performance (cache, lazy loading)
4. Docker compose para ambiente completo
5. Documentação de uso# Food Tracker MVP - Documentação Técnica

## Visão Geral do Projeto

Sistema de registro alimentar pessoal com análise de imagens via IA para identificação automática de alimentos e cálculo nutricional. Desenvolvido especificamente para dietas controladas com foco em inflamações intestinais.

## Objetivos do MVP

- Fotografar refeições e obter análise nutricional automática
- Revisar e aprovar informações antes do salvamento
- Registrar data e hora de cada refeição (diário alimentar)
- Visualizar histórico por dia, semana ou mês
- Acompanhar totais nutricionais (calorias, proteínas, carboidratos, gorduras, fibras)
- Definir objetivos nutricionais personalizados
- Receber análises periódicas da IA sobre qualidade alimentar

## Stack Tecnológica Recomendada

### Backend
- **Runtime**: Node.js 20+ com TypeScript
- **Framework**: Express ou Fastify
- **Banco de Dados**: PostgreSQL 15+ (com TypeORM ou Prisma)
- **IA**: Anthropic Claude API (visão + análise nutricional)
- **Upload**: Multer para processamento de imagens
- **Validação**: Zod para schemas
- **Autenticação**: JWT (mesmo sendo pessoal, boa prática)

### Frontend
- **Framework**: React 18+ com TypeScript
- **Build Tool**: Vite
- **Estilização**: Tailwind CSS
- **Estado**: Context API ou Zustand
- **Requisições**: Axios ou Fetch API
- **Camera**: HTML5 Media Capture API

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Variáveis de Ambiente**: dotenv
- **Logs**: Winston ou Pino

## Arquitetura do Sistema

```
food-tracker-mvp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── environment.ts
│   │   ├── modules/
│   │   │   ├── meals/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── meal.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── meal.service.ts
│   │   │   │   │   └── ai-analysis.service.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── meal.repository.ts
│   │   │   │   ├── schemas/
│   │   │   │   │   └── meal.schema.ts
│   │   │   │   └── routes/
│   │   │   │       └── meal.routes.ts
│   │   │   ├── nutrition/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── nutrition.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── nutrition.service.ts
│   │   │   │   └── routes/
│   │   │   │       └── nutrition.routes.ts
│   │   │   ├── goals/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── goal.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── goal.service.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── goal.repository.ts
│   │   │   │   ├── schemas/
│   │   │   │   │   └── goal.schema.ts
│   │   │   │   └── routes/
│   │   │   │       └── goal.routes.ts
│   │   │   └── analysis/
│   │   │       ├── controllers/
│   │   │       │   └── ai-insights.controller.ts
│   │   │       ├── services/
│   │   │       │   └── ai-insights.service.ts
│   │   │       └── routes/
│   │   │           └── ai-insights.routes.ts
│   │   ├── shared/
│   │   │   ├── middleware/
│   │   │   │   ├── error-handler.middleware.ts
│   │   │   │   ├── validation.middleware.ts
│   │   │   │   └── auth.middleware.ts
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   └── image-processor.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   └── server.ts
│   ├── migrations/
│   ├── tests/
│   ├── .env.example
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Camera/
│   │   │   │   └── CameraCapture.tsx
│   │   │   ├── MealReview/
│   │   │   │   └── NutritionReview.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── DailyStats.tsx
│   │   │   │   ├── WeeklyStats.tsx
│   │   │   │   ├── MonthlyStats.tsx
│   │   │   │   ├── MealHistory.tsx
│   │   │   │   └── ViewSelector.tsx
│   │   │   ├── Goals/
│   │   │   │   ├── GoalForm.tsx
│   │   │   │   └── GoalProgress.tsx
│   │   │   ├── Insights/
│   │   │   │   ├── AIInsights.tsx
│   │   │   │   └── InsightCard.tsx
│   │   │   └── shared/
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── services/
│   │   │   ├── api.service.ts
│   │   │   └── meal.service.ts
│   │   ├── hooks/
│   │   │   ├── useCamera.ts
│   │   │   └── useMeals.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Capture.tsx
│   │   │   ├── History.tsx
│   │   │   ├── Goals.tsx
│   │   │   └── Insights.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── .env.example
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Modelo de Dados

### Tabela: users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### Tabela: user_goals

```sql
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('weight_loss', 'muscle_gain', 'maintenance', 'gut_health', 'custom')),
    target_calories DECIMAL(10,2),
    target_protein_g DECIMAL(10,2),
    target_carbs_g DECIMAL(10,2),
    target_fat_g DECIMAL(10,2),
    target_fiber_g DECIMAL(10,2),
    dietary_restrictions TEXT[], -- Ex: ['lactose', 'gluten', 'high_fat']
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_active ON user_goals(user_id, is_active) WHERE is_active = true;
```

### Tabela: meals

```sql
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    consumed_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meals_user_consumed ON meals(user_id, consumed_at DESC);
CREATE INDEX idx_meals_status ON meals(status);
CREATE INDEX idx_meals_consumed_date ON meals(user_id, DATE(consumed_at));
```

### Tabela: food_items

```sql
CREATE TABLE food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_items_meal_id ON food_items(meal_id);
```

### Tabela: nutrition_data

```sql
CREATE TABLE nutrition_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    calories DECIMAL(10,2) NOT NULL,
    protein_g DECIMAL(10,2) NOT NULL,
    carbs_g DECIMAL(10,2) NOT NULL,
    fat_g DECIMAL(10,2) NOT NULL,
    fiber_g DECIMAL(10,2) NOT NULL,
    sodium_mg DECIMAL(10,2),
    sugar_g DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT nutrition_data_food_item_unique UNIQUE(food_item_id)
);

CREATE INDEX idx_nutrition_data_food_item_id ON nutrition_data(food_item_id);
```

### Tabela: ai_insights

```sql
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 10),
    summary TEXT NOT NULL,
    positive_aspects TEXT[],
    areas_for_improvement TEXT[],
    recommendations TEXT[],
    adherence_to_goals DECIMAL(5,2), -- Percentual de aderência aos objetivos
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_user_period ON ai_insights(user_id, period_start DESC);
CREATE INDEX idx_ai_insights_period_type ON ai_insights(user_id, period_type);
```

## Fluxo de Funcionamento

### 1. Captura de Imagem com Timestamp
```
Usuario → Seleciona data/hora da refeição → Captura Foto → Upload para Backend → Salva com timestamp
```

### 2. Análise via IA
```
Backend → Envia imagem para Claude API → Recebe análise estruturada → Retorna para Frontend
```

### 3. Revisão e Aprovação
```
Frontend exibe dados → Usuário edita se necessário → Aprova → Backend salva no banco com consumed_at
```

### 4. Visualização do Diário
```
Usuario seleciona período (dia/semana/mês) → Backend agrega dados → Retorna timeline + estatísticas
```

### 5. Análise de IA Periódica
```
Cron Job diário → Backend coleta dados do período → Envia para Claude API → Salva insights → Notifica usuário
```

### 6. Configuração de Objetivos
```
Usuario define metas → Backend salva goals → Sistema usa para comparação nas análises
```

## Especificações Técnicas Detalhadas

### Backend: Serviço de Insights IA

**Arquivo**: `backend/src/modules/analysis/services/ai-insights.service.ts`

**Responsabilidades**:
- Coletar dados nutricionais do período solicitado
- Calcular estatísticas agregadas (médias, totais, variância)
- Comparar com objetivos do usuário
- Gerar prompt contextualizado para Claude API
- Parsear e salvar análise estruturada

**Prompt para Claude API (Análise Periódica)**:
```
Você é um nutricionista especializado em saúde intestinal e inflamações. Analise os dados alimentares abaixo e forneça insights construtivos.

# Dados do Período ({period_type}: {period_start} a {period_end})

## Objetivos do Usuário
- Tipo de objetivo: {goal_type}
- Meta diária de calorias: {target_calories} kcal
- Meta de proteínas: {target_protein_g}g
- Meta de carboidratos: {target_carbs_g}g
- Meta de gorduras: {target_fat_g}g
- Meta de fibras: {target_fiber_g}g
- Restrições: {dietary_restrictions}
- Notas especiais: {notes}

## Consumo Real
- Calorias médias diárias: {avg_calories} kcal
- Proteínas médias: {avg_protein}g
- Carboidratos médios: {avg_carbs}g
- Gorduras médias: {avg_fat}g
- Fibras médias: {avg_fiber}g

## Padrões Identificados
- Horários das refeições: {meal_times_pattern}
- Frequência de refeições: {meal_frequency}
- Alimentos mais consumidos: {top_foods}
- Dias com melhor aderência: {best_days}
- Dias com pior aderência: {worst_days}

# Sua Análise (retorne APENAS JSON válido)

{
  "overall_score": 0.0 a 10.0,
  "summary": "Parágrafo curto (2-3 frases) resumindo o período",
  "positive_aspects": [
    "Aspecto positivo 1 com contexto",
    "Aspecto positivo 2 com contexto"
  ],
  "areas_for_improvement": [
    "Área de melhoria 1 com explicação",
    "Área de melhoria 2 com explicação"
  ],
  "recommendations": [
    "Recomendação prática 1",
    "Recomendação prática 2",
    "Recomendação prática 3"
  ],
  "adherence_to_goals": 0.0 a 100.0,
  "gut_health_notes": "Observações específicas sobre alimentos inflamatórios ou benéficos para intestino"
}

# Diretrizes
- Seja encorajador, mas honesto
- Foque em saúde intestinal (identifique gatilhos inflamatórios)
- Recomendações devem ser acionáveis e específicas
- Considere o contexto: uma semana ruim não define tudo
- Celebre consistência e pequenas vitórias
```

**Schema de Validação (Zod)**:
```typescript
const InsightSchema = z.object({
  overall_score: z.number().min(0).max(10),
  summary: z.string().min(20).max(500),
  positive_aspects: z.array(z.string()).min(1).max(5),
  areas_for_improvement: z.array(z.string()).max(5),
  recommendations: z.array(z.string()).min(1).max(5),
  adherence_to_goals: z.number().min(0).max(100),
  gut_health_notes: z.string().optional()
});
```

### Backend: Serviço de Estatísticas

**Arquivo**: `backend/src/modules/nutrition/services/nutrition.service.ts`

**Métodos principais**:

```typescript
async getDailyStats(userId: UUID, date: Date): Promise<DailyStats>
// Retorna: totais do dia, refeições ordenadas por horário, comparação com metas

async getWeeklyStats(userId: UUID, weekStart: Date): Promise<WeeklyStats>
// Retorna: médias diárias, gráfico de tendência, aderência semanal

async getMonthlyStats(userId: UUID, month: Date): Promise<MonthlyStats>
// Retorna: calendário heatmap, estatísticas agregadas, padrões identificados

async calculateAdherence(consumed: NutritionTotals, goals: UserGoal): number
// Calcula % de aderência aos objetivos (média ponderada dos macros)
```

**Cálculo de Aderência**:
```typescript
// Exemplo de lógica
const calorieAdherence = Math.max(0, 100 - Math.abs((consumed.calories - goal.target_calories) / goal.target_calories * 100));
const proteinAdherence = Math.max(0, 100 - Math.abs((consumed.protein - goal.target_protein) / goal.target_protein * 100));
// ... similar para carbs, fat, fiber

const overallAdherence = (
  calorieAdherence * 0.30 +
  proteinAdherence * 0.25 +
  carbsAdherence * 0.20 +
  fatAdherence * 0.15 +
  fiberAdherence * 0.10
);
```

### Backend: Serviço de Análise de IA

**Arquivo**: `backend/src/modules/meals/services/ai-analysis.service.ts`

**Responsabilidades**:
- Enviar imagem para Claude API com prompt estruturado
- Parsear resposta JSON da IA
- Validar estrutura de dados retornada
- Aplicar fallbacks para campos ausentes

**Prompt para Claude API**:
```
Analise esta imagem de refeição e retorne APENAS um JSON válido com a seguinte estrutura:

{
  "foods": [
    {
      "name": "nome do alimento em português",
      "quantity": número estimado,
      "unit": "g, ml, unidade, colher, etc",
      "confidence": 0.0 a 1.0,
      "nutrition": {
        "calories": número,
        "protein_g": número,
        "carbs_g": número,
        "fat_g": número,
        "fiber_g": número,
        "sodium_mg": número ou null,
        "sugar_g": número ou null
      }
    }
  ],
  "meal_type": "breakfast, lunch, dinner ou snack",
  "notes": "observações relevantes sobre a refeição"
}

Regras:
- Estime quantidades de forma conservadora
- Para pratos brasileiros, use nomenclatura local
- Se não identificar, retorne confidence baixo
- Nutrição deve ser baseada na quantidade estimada
- Considere alimentos problemáticos para intestino inflamado (lactose, glúten, gorduras)
```

**Schema de Validação (Zod)**:
```typescript
const FoodItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  confidence: z.number().min(0).max(1),
  nutrition: z.object({
    calories: z.number().nonnegative(),
    protein_g: z.number().nonnegative(),
    carbs_g: z.number().nonnegative(),
    fat_g: z.number().nonnegative(),
    fiber_g: z.number().nonnegative(),
    sodium_mg: z.number().nonnegative().nullable(),
    sugar_g: z.number().nonnegative().nullable()
  })
});

const AIAnalysisSchema = z.object({
  foods: z.array(FoodItemSchema).min(1),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  notes: z.string().optional()
});
```

### Backend: Controller de Refeições

**Arquivo**: `backend/src/modules/meals/controllers/meal.controller.ts`

**Endpoints**:

```typescript
POST /api/meals/analyze
- Body: multipart/form-data com campo 'image'
- Response: { foods: [], meal_type: '', notes: '' }
- Status: 200 OK | 400 Bad Request | 500 Internal Server Error

POST /api/meals/approve
- Body: { meal_id: UUID, foods: [], meal_type: '', consumed_at: ISO8601 }
- Response: { meal_id: UUID, status: 'approved' }
- Status: 201 Created | 400 Bad Request | 500 Internal Server Error

GET /api/meals/history?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&view=day|week|month
- Response: { meals: [], daily_totals: {}, period_stats: {} }
- Status: 200 OK | 400 Bad Request

GET /api/meals/timeline?date=YYYY-MM-DD
- Response: { breakfast: [], lunch: [], dinner: [], snacks: [] }
- Status: 200 OK | 400 Bad Request

GET /api/meals/:id
- Response: { meal: {}, foods: [], nutrition: [] }
- Status: 200 OK | 404 Not Found

DELETE /api/meals/:id
- Response: { message: 'Meal deleted' }
- Status: 204 No Content | 404 Not Found
```

### Backend: Endpoints de Objetivos

**Arquivo**: `backend/src/modules/goals/controllers/goal.controller.ts`

```typescript
POST /api/goals
- Body: { goal_type, target_calories, target_protein_g, ..., dietary_restrictions, notes }
- Response: { goal_id: UUID, ...goal_data }
- Status: 201 Created | 400 Bad Request

GET /api/goals/active
- Response: { goal: {...} }
- Status: 200 OK | 404 Not Found

PUT /api/goals/:id
- Body: { target_calories, ..., notes }
- Response: { goal: {...} }
- Status: 200 OK | 400 Bad Request | 404 Not Found

DELETE /api/goals/:id
- Response: { message: 'Goal deactivated' }
- Status: 204 No Content | 404 Not Found
```

### Backend: Endpoints de Análises IA

**Arquivo**: `backend/src/modules/analysis/controllers/ai-insights.controller.ts`

```typescript
POST /api/insights/generate
- Body: { period_type: 'daily'|'weekly'|'monthly', period_start: 'YYYY-MM-DD' }
- Response: { insight: {...}, comparison_to_goals: {...} }
- Status: 201 Created | 400 Bad Request

GET /api/insights/latest?period_type=daily|weekly|monthly
- Response: { insight: {...} }
- Status: 200 OK | 404 Not Found

GET /api/insights/history?period_type=daily|weekly|monthly&limit=10
- Response: { insights: [...] }
- Status: 200 OK

### Frontend: Componente de Captura

**Arquivo**: `frontend/src/components/Camera/CameraCapture.tsx`

**Funcionalidades**:
- Usar `navigator.mediaDevices.getUserMedia()` para acesso à câmera
- **Seletor de data e hora da refeição** (default: now, mas editável)
- Capturar foto em formato JPEG com qualidade 0.8
- Redimensionar imagem para max 1920x1080 antes do upload (economia de banda)
- Exibir preview antes do envio
- Loading state durante análise
- Tratamento de erros (câmera negada, IA falhou, etc)

**Estados**:
```typescript
interface CameraState {
  stream: MediaStream | null;
  capturedImage: string | null;
  consumedAt: Date;
  isAnalyzing: boolean;
  error: string | null;
}
```

### Frontend: Componente de Revisão

**Arquivo**: `frontend/src/components/MealReview/NutritionReview.tsx`

**Funcionalidades**:
- Exibir lista de alimentos detectados
- Permitir edição de campos (nome, quantidade, unidade)
- Remover itens da lista
- Adicionar novos itens manualmente
- Recalcular totais automaticamente
- Destacar alimentos com baixa confiança (< 0.7)
- Botões: Aprovar, Descartar, Voltar

**Validações**:
- Quantidade > 0
- Unidade não vazia
- Nome do alimento não vazio
- Valores nutricionais >= 0
- Data/hora da refeição não pode ser futura

### Frontend: Componente de Visualização de Período

**Arquivo**: `frontend/src/components/Dashboard/ViewSelector.tsx`

**Funcionalidades**:
- Alternar entre visualizações: Dia / Semana / Mês
- Navegação de datas (anterior/próximo)
- Seletor de data específica (date picker)

**Arquivo**: `frontend/src/components/Dashboard/DailyStats.tsx`

**Funcionalidades**:
- Timeline das refeições do dia ordenadas por horário
- Cartões de refeição com foto miniatura, horário e totais
- Gráfico de barras: metas vs. consumido
- Indicador visual de aderência aos objetivos

**Arquivo**: `frontend/src/components/Dashboard/WeeklyStats.tsx`

**Funcionalidades**:
- Gráfico de linha: calorias por dia da semana
- Tabela resumida: totais diários
- Médias semanais
- Comparação com metas semanais

**Arquivo**: `frontend/src/components/Dashboard/MonthlyStats.tsx`

**Funcionalidades**:
- Calendário heatmap: dias com mais/menos calorias
- Gráficos de tendência mensal
- Estatísticas agregadas (média diária, total mensal)
- Análise de padrões (dias com pior/melhor aderência)

### Frontend: Componente de Objetivos

**Arquivo**: `frontend/src/components/Goals/GoalForm.tsx`

**Funcionalidades**:
- Formulário para definir objetivos nutricionais
- Tipos pré-definidos: Perda de peso, Ganho muscular, Manutenção, Saúde intestinal, Personalizado
- Campos editáveis: calorias, macros, fibras
- Multi-select para restrições alimentares
- Campo de notas

**Arquivo**: `frontend/src/components/Goals/GoalProgress.tsx`

**Funcionalidades**:
- Gráfico circular: progresso atual vs. meta diária
- Barras de progresso para cada macro
- Indicador de streak (dias consecutivos atingindo metas)

### Frontend: Componente de Insights IA

**Arquivo**: `frontend/src/components/Insights/AIInsights.tsx`

**Funcionalidades**:
- Botão para gerar nova análise (com loading)
- Seletor de período: Diário / Semanal / Mensal
- Histórico de análises anteriores

**Arquivo**: `frontend/src/components/Insights/InsightCard.tsx`

**Funcionalidades**:
- Card com score geral (0-10)
- Resumo em linguagem natural
- Seções expansíveis:
  - ✅ Pontos positivos
  - ⚠️ Áreas para melhorar
  - 💡 Recomendações personalizadas
- Badge de aderência aos objetivos (%)
- Timestamp da análise

## Configurações de Ambiente

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/food_tracker
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Anthropic Claude API
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=2048

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp

# JWT
JWT_SECRET=your_secure_random_secret_here
JWT_EXPIRATION=7d

# Logs
LOG_LEVEL=info

# Cron Jobs
ENABLE_AUTO_INSIGHTS=true
DAILY_INSIGHT_CRON=0 22 * * * # Diariamente às 22h
WEEKLY_INSIGHT_CRON=0 20 * * 0 # Domingos às 20h
MONTHLY_INSIGHT_CRON=0 18 1 * * # Dia 1 do mês às 18h
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_MAX_IMAGE_SIZE=5242880
VITE_ENABLE_INSIGHTS=true
VITE_DEFAULT_VIEW=day # day, week, month
```

## Diretrizes de Código

### Princípios Obrigatórios

1. **Zero Hardcoding**: Todas as configurações devem vir de variáveis de ambiente ou arquivos de configuração
2. **Tipagem Estrita**: TypeScript com `strict: true`, sem uso de `any`
3. **Validação de Dados**: Todo input externo deve ser validado com Zod
4. **Error Handling**: Try-catch em operações assíncronas, retorno de erros estruturados
5. **Logging**: Todas as operações críticas devem logar (início, sucesso, erro)
6. **Separation of Concerns**: Controllers não fazem lógica de negócio, Services não acessam req/res
7. **DRY**: Extrair código repetido para funções utilitárias
8. **Naming**: Nomes descritivos em inglês (código) e português (conteúdo do usuário)

### Padrões de Código Proibidos

❌ **Não fazer**:
```typescript
// Hardcode
const apiKey = "sk-ant-12345";

// Any types
function processData(data: any) {}

// Sem validação
app.post('/meals', (req, res) => {
  const { image } = req.body; // Não validado
});

// Gambiarras
setTimeout(() => {
  // Fix provisório
}, 1000);

// Magic numbers
if (confidence > 0.7) {} // O que significa 0.7?
```

✅ **Fazer**:
```typescript
// Configuração
const apiKey = process.env.ANTHROPIC_API_KEY;

// Tipagem
interface MealData {
  image: File;
  meal_type: MealType;
}

// Validação
const validatedData = MealSchema.parse(req.body);

// Constantes nomeadas
const MIN_CONFIDENCE_THRESHOLD = 0.7;
if (confidence > MIN_CONFIDENCE_THRESHOLD) {}
```

### Tratamento de Erros

**Backend**:
```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Uso
if (!image) {
  throw new AppError(400, 'Image is required');
}
```

**Frontend**:
```typescript
try {
  const result = await analyzeMeal(image);
  setMealData(result);
} catch (error) {
  if (error instanceof AxiosError) {
    setError(error.response?.data?.message || 'Failed to analyze meal');
  } else {
    setError('Unexpected error occurred');
  }
  logger.error('Meal analysis failed', { error });
}
```

## Instruções para IA (Claude Code / Codex)

### Contexto
Você está desenvolvendo um MVP de rastreador alimentar pessoal para uma pessoa com restrições dietéticas por inflamações intestinais. O foco é em código limpo, profissional e sem atalhos.

### Regras Absolutas

1. **Nunca use hardcoding**: Todas as configurações vêm de variáveis de ambiente
2. **Nunca use `any` em TypeScript**: Defina tipos explícitos sempre
3. **Nunca implemente gambiarras**: Se algo não funciona, investigue a causa raiz
4. **Sempre valide inputs**: Use Zod para validação de schemas
5. **Sempre trate erros**: Try-catch + logging + resposta estruturada ao cliente
6. **Sempre use constantes nomeadas**: Sem magic numbers ou strings
7. **Sempre siga a arquitetura definida**: Respeite a separação de camadas
8. **Sempre comente código complexo**: Mas prefira código auto-explicativo

### Ordem de Implementação Sugerida

**Fase 1: Backend Core**
1. Setup do projeto (package.json, tsconfig, Docker)
2. Configuração de banco de dados (migrations)
3. Serviço de análise de IA (ai-analysis.service.ts)
4. Repository e Service de meals
5. Controller e rotas de meals
6. Middleware de erro e validação

**Fase 2: Frontend Core**
1. Setup do projeto (Vite, Tailwind)
2. Serviço de API (api.service.ts)
3. Componente de captura de câmera
4. Componente de revisão nutricional
5. Dashboard de histórico

**Fase 3: Integração**
1. Testes end-to-end do fluxo completo
2. Ajustes de UX
3. Docker compose para ambiente completo

### Perguntas a Fazer Durante Desenvolvimento

Antes de implementar, pergunte-se:
- Este valor deve ser configurável?
- Este tipo está corretamente definido?
- Este erro está sendo tratado adequadamente?
- Este código é testável?
- Esta função faz apenas uma coisa?
- Este nome é descritivo o suficiente?

## Considerações de Segurança

1. **Upload de Arquivos**: Validar tipo MIME, tamanho máximo, renomear arquivos
2. **SQL Injection**: Usar ORM com prepared statements
3. **API Keys**: Nunca commitar, usar .env e .gitignore
4. **CORS**: Configurar apenas origins permitidas
5. **Rate Limiting**: Implementar para endpoints de upload/análise
6. **Input Sanitization**: Sanitizar strings antes de salvar no banco

## Próximos Passos Após MVP

- Implementar autenticação real multi-usuário (OAuth2)
- Adicionar testes unitários e de integração completos
- Implementar cache Redis para estatísticas
- Adicionar relatórios semanais/mensais automáticos por email
- Criar sistema de notificações push
- Mobile app nativo (React Native)
- Integração com wearables (Apple Health, Google Fit)

## Recursos de Referência

- **Anthropic API Docs**: https://docs.anthropic.com/
- **TypeORM Docs**: https://typeorm.io/
- **Prisma Docs** (alternativa ao TypeORM): https://www.prisma.io/docs
- **Zod Docs**: https://zod.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Recharts** (gráficos React): https://recharts.org/
- **date-fns** (manipulação de datas): https://date-fns.org/
- **Bull** (filas de jobs): https://github.com/OptimalBits/bull

## Estrutura de Dados para Análises

### Exemplo de Response do Endpoint de Stats Diário

```json
{
  "date": "2025-01-15",
  "meals": [
    {
      "id": "uuid",
      "meal_type": "breakfast",
      "consumed_at": "2025-01-15T08:30:00Z",
      "image_url": "/uploads/xxx.jpg",
      "foods": [
        {
          "name": "Tapioca com queijo",
          "quantity": 100,
          "unit": "g",
          "nutrition": {
            "calories": 250,
            "protein_g": 12,
            "carbs_g": 35,
            "fat_g": 8,
            "fiber_g": 2
          }
        }
      ]
    }
  ],
  "totals": {
    "calories": 1850,
    "protein_g": 125,
    "carbs_g": 180,
    "fat_g": 62,
    "fiber_g": 28
  },
  "goals": {
    "target_calories": 2000,
    "target_protein_g": 150,
    "target_carbs_g": 200,
    "target_fat_g": 65,
    "target_fiber_g": 30
  },
  "adherence": {
    "overall": 92.5,
    "calories": 92.5,
    "protein": 83.3,
    "carbs": 90.0,
    "fat": 95.4,
    "fiber": 93.3
  }
}
```

### Exemplo de Response do Insight IA

```json
{
  "id": "uuid",
  "period_type": "weekly",
  "period_start": "2025-01-08",
  "period_end": "2025-01-14",
  "overall_score": 8.5,
  "summary": "Semana muito positiva! Você manteve consistência nas refeições e respeitou os horários. A ingestão de fibras está excelente, o que é ótimo para sua saúde intestinal.",
  "positive_aspects": [
    "Consumo de fibras acima da meta em 6 dos 7 dias (média: 32g/dia)",
    "Regularidade nos horários das refeições (variação < 30min)",
    "Boa variedade de vegetais e proteínas magras",
    "Nenhum alimento inflamatório comum detectado"
  ],
  "areas_for_improvement": [
    "Proteínas ligeiramente abaixo da meta (média: 120g vs. meta: 150g)",
    "Duas refeições puladas no fim de semana"
  ],
  "recommendations": [
    "Adicionar 30g de frango ou peixe no almoço para atingir meta de proteína",
    "Preparar snacks práticos para o fim de semana (ex: ovos cozidos, castanhas)",
    "Continuar evitando laticínios e glúten - zero sintomas relatados!",
    "Manter horário do café da manhã entre 7h-8h como tem feito"
  ],
  "adherence_to_goals": 88.7,
  "gut_health_notes": "Padrão alimentar está ideal para controle inflamatório. Ausência de sintomas indica que as restrições estão funcionando. Fibras altas favorecem microbiota intestinal.",
  "created_at": "2025-01-15T20:00:00Z"
}
```

## Checklist de Implementação

### Banco de Dados
- [ ] Tabela `users` criada
- [ ] Tabela `user_goals` criada
- [ ] Tabela `meals` criada com campo `consumed_at` e `user_id`
- [ ] Tabela `food_items` criada
- [ ] Tabela `nutrition_data` criada
- [ ] Tabela `ai_insights` criada
- [ ] Índices criados conforme especificado
- [ ] Migrations versionadas e testadas

### Backend - Core
- [ ] Configuração de ambiente (dotenv)
- [ ] Logger estruturado (Pino/Winston)
- [ ] Conexão com PostgreSQL
- [ ] Middleware de erro global
- [ ] Middleware de validação (Zod)
- [ ] Upload de arquivos (Multer)
- [ ] Processamento de imagem (Sharp para resize)

### Backend - Meals Module
- [ ] Repository com métodos CRUD
- [ ] Service de análise IA de imagens
- [ ] Service de meals (create, approve, list)
- [ ] Controller com endpoints
- [ ] Rotas registradas
- [ ] Validação de schemas

### Backend - Goals Module
- [ ] Repository com métodos CRUD
- [ ] Service de goals
- [ ] Controller com endpoints
- [ ] Rotas registradas
- [ ] Validação de schemas

### Backend - Nutrition Module
- [ ] Service de cálculo de estatísticas
- [ ] Métodos: getDailyStats, getWeeklyStats, getMonthlyStats
- [ ] Método: calculateAdherence
- [ ] Controller com endpoints
- [ ] Rotas registradas
- [ ] Otimização de queries com CTEs

### Backend - Analysis Module
- [ ] Service de insights IA
- [ ] Método: generateInsight
- [ ] Prompt estruturado para Claude
- [ ] Validação de resposta da IA
- [ ] Controller com endpoints
- [ ] Rotas registradas
- [ ] Cron jobs configurados (opcional no MVP)

### Frontend - Setup
- [ ] Projeto Vite criado
- [ ] TypeScript configurado (strict mode)
- [ ] Tailwind CSS instalado
- [ ] React Router configurado
- [ ] Axios ou Fetch wrapper
- [ ] Variáveis de ambiente

### Frontend - Components
- [ ] CameraCapture com seletor de data/hora
- [ ] NutritionReview com edição de campos
- [ ] ViewSelector (day/week/month)
- [ ] DailyStats com timeline
- [ ] WeeklyStats com gráficos
- [ ] MonthlyStats com calendário
- [ ] GoalForm para definir objetivos
- [ ] GoalProgress com barras de progresso
- [ ] AIInsights com cards expansíveis
- [ ] LoadingSpinner e estados de erro

### Frontend - Pages
- [ ] Home (dashboard principal)
- [ ] Capture (foto + revisão)
- [ ] History (visualização por período)
- [ ] Goals (CRUD de objetivos)
- [ ] Insights (análises IA)

### Testes
- [ ] Testes unitários backend (services)
- [ ] Testes de integração backend (endpoints)
- [ ] Testes unitários frontend (componentes)
- [ ] Teste E2E: fluxo completo de registro de refeição

### DevOps
- [ ] Dockerfile backend
- [ ] Dockerfile frontend
- [ ] docker-compose.yml
- [ ] .gitignore configurado
- [ ] README.md com instruções de setup

---

**Nota Final para IAs**: Este projeto valoriza qualidade sobre velocidade. Dedique tempo para entender cada requisito antes de codificar. Código bem estruturado desde o início economiza retrabalho futuro. Em caso de dúvida, busque clarificação ao invés de assumir.