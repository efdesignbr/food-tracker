# 🤖 Plano de Implementação: Coach IA

**Data de criação:** 2025-10-25
**Última atualização:** 2025-10-26
**Versão:** 2.0
**Status:** ⚙️ Em Implementação

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Fase 1: Medidas Corporais](#fase-1-medidas-corporais)
4. [Fase 2: Coach IA](#fase-2-coach-ia)
5. [Fase 3: Polimento](#fase-3-polimento)
6. [Cronograma](#cronograma)

---

## 🎯 Visão Geral

### Objetivo
Implementar um Coach IA que fornece orientações personalizadas baseadas em:
- 📏 Medidas corporais (cintura, pescoço, coxa, bíceps, etc)
- ⚖️ Histórico de peso
- 🍽️ Histórico de alimentação (alimentos e horários)
- 🎯 Metas do usuário

### Escopo
- ✅ Expansão da página `/peso` para incluir medidas corporais
- ✅ Criação de sistema de Coach IA com análise completa
- ✅ Dashboard de insights e recomendações
- ✅ Histórico de consultas ao Coach

### Não Escopo (Futuro)
- ❌ Integração com wearables (Fase posterior)
- ❌ Coach em tempo real via chat (Fase posterior)
- ❌ Planos de treino personalizados (Fase posterior)

---

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  /peso                    │  /coach                          │
│  - Peso histórico         │  - Dashboard de insights         │
│  - Medidas corporais      │  - Consultar Coach               │
│  - Timeline unificada     │  - Histórico de análises         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
├─────────────────────────────────────────────────────────────┤
│  /api/body-measurements   │  /api/coach/analyze              │
│  /api/weight (existente)  │  /api/coach/history              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│  body_measurements        │  coach_analyses                  │
│  weight_logs (existente)  │  meals (existente)               │
│  users (existente)        │                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                Google Gemini 2.0 Flash API                   │
│              Análise contextual e recomendações              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Fase 1: Medidas Corporais

**Duração estimada:** 4-6h
**Prioridade:** Alta
**Status:** ✅ **CONCLUÍDO**

### Sprint 1.1: Banco de Dados (1h)

#### Migration: `017_create_body_measurements.sql`

```sql
-- Tabela de medidas corporais
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Data e hora da medição
  measurement_date DATE NOT NULL,
  measurement_time TIME DEFAULT CURRENT_TIME,

  -- Medidas (em centímetros)
  waist DECIMAL(5,2) CHECK (waist > 0 AND waist < 300),           -- Cintura
  neck DECIMAL(5,2) CHECK (neck > 0 AND neck < 150),              -- Pescoço
  chest DECIMAL(5,2) CHECK (chest > 0 AND chest < 300),           -- Peitoral
  hips DECIMAL(5,2) CHECK (hips > 0 AND hips < 300),              -- Quadril
  left_thigh DECIMAL(5,2) CHECK (left_thigh > 0 AND left_thigh < 200),    -- Coxa esquerda
  right_thigh DECIMAL(5,2) CHECK (right_thigh > 0 AND right_thigh < 200), -- Coxa direita
  left_bicep DECIMAL(5,2) CHECK (left_bicep > 0 AND left_bicep < 100),    -- Bíceps esquerdo
  right_bicep DECIMAL(5,2) CHECK (right_bicep > 0 AND right_bicep < 100), -- Bíceps direito
  left_calf DECIMAL(5,2) CHECK (left_calf > 0 AND left_calf < 100),       -- Panturrilha esquerda
  right_calf DECIMAL(5,2) CHECK (right_calf > 0 AND right_calf < 100),    -- Panturrilha direita

  -- Metadados
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Unicidade: um usuário pode ter múltiplas medições por dia
  UNIQUE(user_id, measurement_date, measurement_time, tenant_id)
);

-- Índices
CREATE INDEX idx_body_measurements_tenant_id ON body_measurements(tenant_id);
CREATE INDEX idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX idx_body_measurements_date ON body_measurements(measurement_date DESC);

-- Comentários
COMMENT ON TABLE body_measurements IS 'Registro de medidas corporais dos usuários';
COMMENT ON COLUMN body_measurements.waist IS 'Cintura em cm (medida na altura do umbigo)';
COMMENT ON COLUMN body_measurements.neck IS 'Pescoço em cm (medida na base)';
COMMENT ON COLUMN body_measurements.chest IS 'Peitoral em cm (medida na altura dos mamilos)';
COMMENT ON COLUMN body_measurements.hips IS 'Quadril em cm (medida na parte mais larga)';
COMMENT ON COLUMN body_measurements.notes IS 'Observações sobre a medição (opcional)';
```

**Checklist:**
- [x] Criar migration `017_create_body_measurements.sql`
- [x] Executar migration no Supabase (✅ Executada manualmente)
- [x] Validar estrutura da tabela
- [x] Criar índices de performance

---

### Sprint 1.2: Backend - Repository e API (2h)

✅ **Implementado:**
- `lib/repos/body-measurements.repo.ts` - Repository com CRUD completo
- `app/api/body-measurements/route.ts` - API routes (GET, POST, DELETE)
- Validação Zod integrada
- Transações PostgreSQL seguindo padrão do projeto

---

### Sprint 1.3: Frontend - Página de Peso Expandida (2-3h)

✅ **Implementado:**
- `app/peso/page.tsx` - Expandida com sistema de tabs (Peso | Medidas Corporais)
- `components/body-measurements/MeasurementForm.tsx` - Formulário completo de medidas
- `components/body-measurements/MeasurementTimeline.tsx` - Timeline de evolução
- Build passando sem erros ✅

---

## 🤖 Fase 2: Coach IA

**Duração estimada:** 6-8h
**Prioridade:** Alta
**Status:** 🚧 **EM PROGRESSO**

### Sprint 2.1: Banco de Dados - Coach (1h)

#### Migration: `018_create_coach_analyses.sql`

```sql
-- Tabela de análises do Coach IA
CREATE TABLE coach_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Dados da análise
  analysis_date TIMESTAMP DEFAULT now(),

  -- Dados do contexto (snapshot no momento da análise)
  context_data JSONB NOT NULL, -- { weight, measurements, meals, goals }

  -- Resposta do Coach IA
  analysis_text TEXT NOT NULL,
  recommendations TEXT[],
  insights TEXT[],
  warnings TEXT[],

  -- Metadados
  model_used VARCHAR(50) DEFAULT 'gemini-2.0-flash-exp',
  created_at TIMESTAMP DEFAULT now()
);

-- Índices
CREATE INDEX idx_coach_analyses_tenant_id ON coach_analyses(tenant_id);
CREATE INDEX idx_coach_analyses_user_id ON coach_analyses(user_id);
CREATE INDEX idx_coach_analyses_date ON coach_analyses(analysis_date DESC);
CREATE INDEX idx_coach_analyses_context_gin ON coach_analyses USING GIN (context_data);

-- Comentários
COMMENT ON TABLE coach_analyses IS 'Histórico de análises do Coach IA';
COMMENT ON COLUMN coach_analyses.context_data IS 'Snapshot dos dados do usuário no momento da análise (JSON)';
COMMENT ON COLUMN coach_analyses.analysis_text IS 'Texto completo da análise gerada pela IA';
COMMENT ON COLUMN coach_analyses.recommendations IS 'Array de recomendações práticas';
COMMENT ON COLUMN coach_analyses.insights IS 'Array de insights identificados';
COMMENT ON COLUMN coach_analyses.warnings IS 'Array de alertas (se houver)';
```

**Checklist:**
- [ ] Criar migration `018_create_coach_analyses.sql`
- [ ] Executar migration no Supabase (manual)
- [ ] Validar estrutura e índices

---

### Sprint 2.2: Backend - Coach Service (3-4h)

#### Arquivo: `lib/services/coach.service.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPool } from '@/lib/db';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { getLatestWeightLog } from '@/lib/repos/weight.repo';
import { getLatestBodyMeasurement } from '@/lib/repos/body-measurements.repo';

function getClient() {
  const e = env();
  return new GoogleGenerativeAI(e.GEMINI_API_KEY);
}

export interface CoachContext {
  userId: string;
  tenantId: string;
  weight?: {
    current: number;
    history: Array<{ weight: number; date: string }>;
  };
  measurements?: {
    current: Record<string, number>;
    history: Array<{ date: string; measurements: Record<string, number> }>;
  };
  meals?: {
    recent: Array<{
      date: string;
      time: string;
      foods: string[];
      calories: number;
    }>;
  };
  goals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface CoachAnalysis {
  analysisText: string;
  recommendations: string[];
  insights: string[];
  warnings: string[];
}

// JSON Schema para forçar resposta estruturada do Gemini
const responseSchema = {
  type: 'object',
  properties: {
    analysis_text: {
      type: 'string',
      description: 'Análise geral completa do estado nutricional e corporal do usuário'
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista de 3-5 recomendações práticas e específicas'
    },
    insights: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista de 3-5 insights identificados nos dados'
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista de alertas (se houver problemas identificados)'
    }
  },
  required: ['analysis_text', 'recommendations', 'insights', 'warnings']
};

/**
 * Coleta dados do contexto do usuário
 */
export async function gatherUserContext(params: {
  userId: string;
  tenantId: string;
}): Promise<CoachContext> {
  const pool = getPool();
  const context: CoachContext = {
    userId: params.userId,
    tenantId: params.tenantId
  };

  // 1. Buscar peso atual e histórico
  const latestWeight = await getLatestWeightLog({
    userId: params.userId,
    tenantId: params.tenantId
  });

  if (latestWeight) {
    const { rows: weightHistory } = await pool.query(
      `SELECT weight, log_date as date
       FROM weight_logs
       WHERE user_id = $1 AND tenant_id = $2
       ORDER BY log_date DESC
       LIMIT 10`,
      [params.userId, params.tenantId]
    );

    context.weight = {
      current: latestWeight.weight,
      history: weightHistory.map(r => ({ weight: r.weight, date: r.date }))
    };
  }

  // 2. Buscar medidas corporais
  const latestMeasurement = await getLatestBodyMeasurement({
    userId: params.userId,
    tenantId: params.tenantId
  });

  if (latestMeasurement) {
    const { rows: measurementHistory } = await pool.query(
      `SELECT measurement_date as date, waist, neck, chest, hips,
              left_bicep, right_bicep, left_thigh, right_thigh,
              left_calf, right_calf
       FROM body_measurements
       WHERE user_id = $1 AND tenant_id = $2
       ORDER BY measurement_date DESC
       LIMIT 5`,
      [params.userId, params.tenantId]
    );

    context.measurements = {
      current: {
        waist: latestMeasurement.waist || 0,
        neck: latestMeasurement.neck || 0,
        chest: latestMeasurement.chest || 0,
        hips: latestMeasurement.hips || 0,
        bicep: ((latestMeasurement.left_bicep || 0) + (latestMeasurement.right_bicep || 0)) / 2,
        thigh: ((latestMeasurement.left_thigh || 0) + (latestMeasurement.right_thigh || 0)) / 2,
        calf: ((latestMeasurement.left_calf || 0) + (latestMeasurement.right_calf || 0)) / 2
      },
      history: measurementHistory.map(m => ({
        date: m.date,
        measurements: {
          waist: m.waist,
          neck: m.neck,
          chest: m.chest,
          hips: m.hips,
          bicep: ((m.left_bicep || 0) + (m.right_bicep || 0)) / 2,
          thigh: ((m.left_thigh || 0) + (m.right_thigh || 0)) / 2,
          calf: ((m.left_calf || 0) + (m.right_calf || 0)) / 2
        }
      }))
    };
  }

  // 3. Buscar refeições recentes (últimos 7 dias)
  const { rows: meals } = await pool.query(
    `SELECT m.id, m.meal_type, m.consumed_at,
            array_agg(fi.name) as foods,
            SUM(nd.calories) as total_calories
     FROM meals m
     LEFT JOIN food_items fi ON fi.meal_id = m.id
     LEFT JOIN nutrition_data nd ON nd.food_item_id = fi.id
     WHERE m.user_id = $1 AND m.tenant_id = $2
       AND m.consumed_at >= CURRENT_DATE - INTERVAL '7 days'
     GROUP BY m.id, m.meal_type, m.consumed_at
     ORDER BY m.consumed_at DESC
     LIMIT 30`,
    [params.userId, params.tenantId]
  );

  context.meals = {
    recent: meals.map(m => ({
      date: new Date(m.consumed_at).toISOString().split('T')[0],
      time: new Date(m.consumed_at).toTimeString().split(' ')[0],
      foods: m.foods || [],
      calories: m.total_calories || 0
    }))
  };

  // 4. Buscar metas do usuário
  const { rows: userGoals } = await pool.query(
    `SELECT goal_calories, goal_protein_g, goal_carbs_g, goal_fat_g
     FROM users
     WHERE id = $1`,
    [params.userId]
  );

  if (userGoals.length > 0) {
    const g = userGoals[0];
    context.goals = {
      calories: g.goal_calories,
      protein: g.goal_protein_g,
      carbs: g.goal_carbs_g,
      fat: g.goal_fat_g
    };
  }

  return context;
}

/**
 * Analisa o contexto com Gemini IA
 */
export async function analyzeWithAI(context: CoachContext): Promise<CoachAnalysis> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
      temperature: 0.3,
    }
  });

  const systemPrompt = `Você é um Coach de Saúde e Nutrição especializado em análise de dados corporais e alimentares.

Sua função é:
1. Analisar dados de peso, medidas corporais e alimentação
2. Identificar padrões, tendências e correlações
3. Fornecer recomendações práticas e baseadas em evidências
4. Alertar sobre possíveis problemas ou riscos à saúde
5. Motivar e encorajar o usuário de forma empática

DIRETRIZES:
- Seja OBJETIVO e DIRETO nas análises
- Use linguagem clara e acessível (evite jargões técnicos excessivos)
- Priorize insights ACIONÁVEIS sobre descrições genéricas
- Identifique padrões positivos e negativos
- Seja honesto sobre problemas, mas também reconheça acertos
- Mantenha tom profissional, mas amigável e motivador
- Recomendações devem ser ESPECÍFICAS e PRÁTICAS (não genéricas)`;

  const dataPrompt = buildCoachPrompt(context);
  const fullPrompt = `${systemPrompt}\n\n${dataPrompt}`;

  try {
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return {
      analysisText: parsed.analysis_text,
      recommendations: parsed.recommendations || [],
      insights: parsed.insights || [],
      warnings: parsed.warnings || []
    };
  } catch (error: any) {
    logger.error('Gemini Coach Analysis error', error);
    throw new Error(`Erro ao analisar com Coach IA: ${error.message}`);
  }
}

/**
 * Constrói o prompt para a IA
 */
function buildCoachPrompt(context: CoachContext): string {
  let prompt = `Analise os seguintes dados do usuário e forneça insights e recomendações:\n\n`;

  // Peso
  if (context.weight) {
    prompt += `## PESO\n`;
    prompt += `Atual: ${context.weight.current} kg\n`;
    if (context.weight.history.length > 1) {
      const oldest = context.weight.history[context.weight.history.length - 1];
      const diff = context.weight.current - oldest.weight;
      const days = Math.ceil(
        (new Date().getTime() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      prompt += `Variação: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg nos últimos ${days} dias\n`;
      prompt += `Histórico (últimos 10 registros): ${context.weight.history.map(h => `${h.weight}kg em ${h.date}`).join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // Medidas
  if (context.measurements) {
    prompt += `## MEDIDAS CORPORAIS\n`;
    prompt += `Medidas atuais:\n`;
    prompt += `- Cintura: ${context.measurements.current.waist} cm\n`;
    prompt += `- Pescoço: ${context.measurements.current.neck} cm\n`;
    prompt += `- Peitoral: ${context.measurements.current.chest} cm\n`;
    prompt += `- Quadril: ${context.measurements.current.hips} cm\n`;
    prompt += `- Bíceps (média): ${context.measurements.current.bicep} cm\n`;
    prompt += `- Coxa (média): ${context.measurements.current.thigh} cm\n`;
    prompt += `- Panturrilha (média): ${context.measurements.current.calf} cm\n`;

    if (context.measurements.history.length > 1) {
      const oldest = context.measurements.history[context.measurements.history.length - 1];
      prompt += `\nEvolução de medidas:\n`;
      prompt += `- Cintura: ${context.measurements.current.waist - (oldest.measurements.waist || 0) > 0 ? '+' : ''}${(context.measurements.current.waist - (oldest.measurements.waist || 0)).toFixed(1)} cm\n`;
      prompt += `- Peitoral: ${context.measurements.current.chest - (oldest.measurements.chest || 0) > 0 ? '+' : ''}${(context.measurements.current.chest - (oldest.measurements.chest || 0)).toFixed(1)} cm\n`;
    }
    prompt += `\n`;
  }

  // Alimentação
  if (context.meals && context.meals.recent.length > 0) {
    prompt += `## REFEIÇÕES RECENTES (últimos 7 dias)\n`;
    prompt += `Total de refeições: ${context.meals.recent.length}\n`;

    const totalCals = context.meals.recent.reduce((sum, m) => sum + m.calories, 0);
    const avgCalsPerDay = totalCals / 7;
    prompt += `Calorias médias por dia: ${avgCalsPerDay.toFixed(0)} kcal\n\n`;

    prompt += `Amostra de refeições recentes:\n`;
    context.meals.recent.slice(0, 15).forEach(meal => {
      prompt += `- ${meal.date} ${meal.time}: ${meal.foods.slice(0, 5).join(', ')} (${meal.calories} kcal)\n`;
    });
    prompt += `\n`;
  }

  // Metas
  if (context.goals) {
    prompt += `## METAS DIÁRIAS DO USUÁRIO\n`;
    prompt += `- Calorias: ${context.goals.calories} kcal\n`;
    prompt += `- Proteína: ${context.goals.protein}g\n`;
    prompt += `- Carboidratos: ${context.goals.carbs}g\n`;
    prompt += `- Gorduras: ${context.goals.fat}g\n`;
    prompt += `\n`;
  }

  prompt += `---\n\n`;
  prompt += `Com base nos dados acima, forneça uma análise completa no formato JSON estruturado com os seguintes campos:\n\n`;
  prompt += `1. **analysis_text**: Análise geral completa (3-5 parágrafos) cobrindo:\n`;
  prompt += `   - Estado atual do peso e composição corporal\n`;
  prompt += `   - Análise das medidas corporais e o que indicam\n`;
  prompt += `   - Padrão alimentar nos últimos 7 dias\n`;
  prompt += `   - Aderência às metas (se definidas)\n`;
  prompt += `   - Tendências identificadas\n\n`;
  prompt += `2. **recommendations**: Array de 3-5 recomendações ESPECÍFICAS e PRÁTICAS (ex: "Aumente proteína no café da manhã para 30g", "Reduza açúcar adicionado de 50g para 25g por dia")\n\n`;
  prompt += `3. **insights**: Array de 3-5 insights identificados (ex: "Consumo de água abaixo do ideal pode estar impactando retenção de líquidos", "Padrão de 3 refeições/dia está consistente")\n\n`;
  prompt += `4. **warnings**: Array de alertas (se houver). Inclua se identificar:\n`;
  prompt += `   - Restrição calórica muito severa\n`;
  prompt += `   - Falta de proteína\n`;
  prompt += `   - Excesso de alimentos inflamatórios\n`;
  prompt += `   - Padrão irregular de alimentação\n`;
  prompt += `   - Outros sinais de alerta\n\n`;
  prompt += `Se não houver alertas graves, retorne array vazio.\n\n`;
  prompt += `Retorne APENAS o JSON estruturado.`;

  return prompt;
}

/**
 * Salva análise no banco
 */
export async function saveCoachAnalysis(params: {
  userId: string;
  tenantId: string;
  context: CoachContext;
  analysis: CoachAnalysis;
}): Promise<void> {
  const pool = getPool();

  await pool.query(
    `INSERT INTO coach_analyses (
      tenant_id, user_id, context_data, analysis_text,
      recommendations, insights, warnings
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.tenantId,
      params.userId,
      JSON.stringify(params.context),
      params.analysis.analysisText,
      params.analysis.recommendations,
      params.analysis.insights,
      params.analysis.warnings
    ]
  );
}
```

#### Arquivo: `app/api/coach/analyze/route.ts`

```typescript
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { init } from '@/lib/init';
import { getSessionData } from '@/lib/types/auth';
import { checkQuota, incrementQuota } from '@/lib/quota';
import {
  gatherUserContext,
  analyzeWithAI,
  saveCoachAnalysis
} from '@/lib/services/coach.service';

export async function POST(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());

    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Verificar quota (Coach IA é feature premium)
    // TODO: Adicionar quota específica para coach_ai no sistema
    // Por ora, não incrementa quota pois não há limite definido ainda

    // Coletar contexto
    const context = await gatherUserContext({
      userId: session.userId,
      tenantId: tenant.id
    });

    // Validar dados mínimos
    if (!context.weight && !context.measurements && (!context.meals || context.meals.recent.length === 0)) {
      return NextResponse.json({
        error: 'insufficient_data',
        message: 'Dados insuficientes para análise. Registre pelo menos peso, medidas ou refeições.'
      }, { status: 400 });
    }

    // Analisar com IA
    const analysis = await analyzeWithAI(context);

    // Salvar no banco
    await saveCoachAnalysis({
      userId: session.userId,
      tenantId: tenant.id,
      context,
      analysis
    });

    return NextResponse.json({
      ok: true,
      analysis
    });
  } catch (err: any) {
    console.error('Coach analyze error:', err);
    return NextResponse.json(
      { error: err.message || 'failed_to_analyze' },
      { status: 500 }
    );
  }
}
```

#### Arquivo: `app/api/coach/history/route.ts`

```typescript
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireTenant } from '@/lib/tenant';
import { auth } from '@/lib/auth';
import { init } from '@/lib/init';
import { getSessionData } from '@/lib/types/auth';
import { getPool } from '@/lib/db';

export async function GET(req: Request) {
  try {
    await init();
    const tenant = await requireTenant(req);
    const session = getSessionData(await auth());

    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    if (session.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, analysis_date, analysis_text,
              recommendations, insights, warnings, model_used
       FROM coach_analyses
       WHERE user_id = $1 AND tenant_id = $2
       ORDER BY analysis_date DESC
       LIMIT 20`,
      [session.userId, tenant.id]
    );

    return NextResponse.json({ ok: true, analyses: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 400 });
  }
}
```

**Checklist:**
- [ ] Criar `lib/services/coach.service.ts`
- [ ] Criar `app/api/coach/analyze/route.ts`
- [ ] Criar `app/api/coach/history/route.ts`
- [ ] Testar análise com dados reais
- [ ] Validar formato de resposta da IA

---

### Sprint 2.3: Frontend - Página do Coach (3h)

#### Arquivo: `app/coach/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';

interface CoachAnalysis {
  id?: string;
  analysisText: string;
  recommendations: string[];
  insights: string[];
  warnings: string[];
  analysis_date?: string;
}

export default function CoachPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
  const [history, setHistory] = useState<CoachAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch('/api/coach/history', {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.ok) {
        setHistory(data.analyses || []);
        if (data.analyses.length > 0) {
          // Mostrar última análise automaticamente
          setAnalysis({
            analysisText: data.analyses[0].analysis_text,
            recommendations: data.analyses[0].recommendations,
            insights: data.analyses[0].insights,
            warnings: data.analyses[0].warnings,
            analysis_date: data.analyses[0].analysis_date
          });
        }
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/coach/analyze', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao analisar');
      }

      if (res.ok && data.analysis) {
        setAnalysis(data.analysis);
        await fetchHistory(); // Atualizar histórico
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>
        🤖 Coach IA
      </h1>

      {/* CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 16,
        padding: 32,
        marginBottom: 32,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Análise Personalizada
        </h2>
        <p style={{ fontSize: 16, marginBottom: 24, opacity: 0.9 }}>
          Receba insights baseados no seu peso, medidas e alimentação
        </p>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            padding: '16px 32px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '⏳ Analisando...' : '🚀 Analisar Agora'}
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div style={{
          padding: 16,
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 12,
          color: '#991b1b',
          marginBottom: 24
        }}>
          ❌ {error}
        </div>
      )}

      {/* Resultado */}
      {analysis && (
        <div>
          {/* Data da análise */}
          {analysis.analysis_date && (
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              📅 Análise de {new Date(analysis.analysis_date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}

          {/* Alertas (se houver) */}
          {analysis.warnings && analysis.warnings.length > 0 && (
            <div style={{
              background: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#ef4444' }}>
                ⚠️ Alertas Importantes
              </h3>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {analysis.warnings.map((warning: string, i: number) => (
                  <li key={i} style={{ fontSize: 16, marginBottom: 12, color: '#991b1b' }}>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Análise Geral */}
          <div style={{
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              📊 Análise Geral
            </h3>
            <div style={{ fontSize: 16, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' }}>
              {analysis.analysisText}
            </div>
          </div>

          {/* Insights */}
          {analysis.insights && analysis.insights.length > 0 && (
            <div style={{
              background: 'white',
              border: '2px solid #3b82f6',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#3b82f6' }}>
                💡 Insights Identificados
              </h3>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {analysis.insights.map((insight: string, i: number) => (
                  <li key={i} style={{ fontSize: 16, marginBottom: 12, color: '#374151' }}>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendações */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div style={{
              background: 'white',
              border: '2px solid #10b981',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#10b981' }}>
                ✅ Recomendações Práticas
              </h3>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {analysis.recommendations.map((rec: string, i: number) => (
                  <li key={i} style={{ fontSize: 16, marginBottom: 12, color: '#374151' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Histórico */}
      {history.length > 1 && (
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: 16,
          padding: 24,
          marginTop: 32
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            📜 Histórico de Análises
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.slice(1).map((h, i) => (
              <button
                key={i}
                onClick={() => setAnalysis({
                  analysisText: h.analysis_text,
                  recommendations: h.recommendations,
                  insights: h.insights,
                  warnings: h.warnings,
                  analysis_date: h.analysis_date
                })}
                style={{
                  padding: 16,
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14
                }}
              >
                📅 {new Date(h.analysis_date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Checklist:**
- [ ] Criar `app/coach/page.tsx`
- [ ] Adicionar link "Coach IA" no menu de navegação
- [ ] Testar responsividade
- [ ] Validar exibição de análises

---

## ✨ Fase 3: Polimento

**Duração estimada:** 2-3h
**Prioridade:** Média
**Status:** 📋 **PLANEJADO**

### Melhorias de UX

1. **Loading States**
   - Skeleton loaders durante análise
   - Animações suaves

2. **Empty States**
   - Mensagem quando não há dados suficientes
   - Guia de primeiros passos

3. **Validações**
   - Limites mínimos de dados para análise
   - Feedback visual de progresso

4. **Quota Integration**
   - Integrar Coach IA no sistema de quotas
   - Paywall para usuários free

**Checklist:**
- [ ] Adicionar loading states
- [ ] Criar empty states
- [ ] Implementar validações
- [ ] Integrar sistema de quota
- [ ] Testar edge cases

---

## 📅 Cronograma

| Fase | Sprints | Duração | Status |
|------|---------|---------|--------|
| **Fase 1** | Medidas Corporais | 4-6h | ✅ **CONCLUÍDO** |
| Sprint 1.1 | Banco de Dados | 1h | ✅ |
| Sprint 1.2 | Backend | 2h | ✅ |
| Sprint 1.3 | Frontend | 2-3h | ✅ |
| **Fase 2** | Coach IA | 6-8h | 🚧 **EM PROGRESSO** |
| Sprint 2.1 | Banco de Dados | 1h | ⏳ |
| Sprint 2.2 | Backend | 3-4h | ⏳ |
| Sprint 2.3 | Frontend | 3h | ⏳ |
| **Fase 3** | Polimento | 2-3h | 📋 **PLANEJADO** |

**Total estimado:** 12-17 horas
**Progresso atual:** ~30% (Fase 1 completa)

---

## 🎯 Critérios de Sucesso

### Fase 1 - Medidas Corporais ✅
- [x] Tabela `body_measurements` criada e funcional
- [x] API de medidas corporais testada
- [x] Página `/peso` expandida com tabs
- [x] Formulário de medidas salvando corretamente
- [x] Timeline mostrando histórico de medidas
- [x] Build passa sem erros

### Fase 2 - Coach IA
- [ ] Tabela `coach_analyses` criada
- [ ] Service de Coach IA funcionando com Gemini
- [ ] Análise retorna dados estruturados
- [ ] Página `/coach` criada e funcional
- [ ] Análises sendo salvas no banco
- [ ] Histórico de análises acessível

### Fase 3 - Polimento
- [ ] Loading states implementados
- [ ] Empty states criados
- [ ] Validações funcionando
- [ ] Quota integration completa
- [ ] App responsivo em mobile
- [ ] Testes manuais concluídos

---

## 🔐 Variáveis de Ambiente

**Já configuradas no projeto:**
```bash
GEMINI_API_KEY=...  # Google Gemini API Key
GEMINI_MODEL=gemini-2.0-flash-exp  # Modelo utilizado
```

---

## 📚 Recursos Necessários

### APIs
- ✅ Google Gemini 2.0 Flash (já integrado)
- ✅ PostgreSQL (Supabase)

### Bibliotecas
- `@google/generative-ai@0.24.1` - ✅ Instalado
- `zod@3.23.8` - ✅ Instalado

---

## 🚀 Próximos Passos

Após conclusão:
1. Integrar Coach IA com planos de assinatura (PREMIUM feature)
2. Adicionar sistema de quotas para análises
3. Criar notificações de recomendações
4. Adicionar gráficos de evolução
5. Exportação de relatórios em PDF

---

**Última atualização:** 2025-10-26
**Autor:** Claude + Edson
**Status:** ⚙️ Fase 1 concluída, Fase 2 em progresso
