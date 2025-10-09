# 📋 Plano: Sistema de Cadastro, Limites de Uso e Cache de Alimentos

**Data:** 2025-10-09
**Status:** Planejamento
**Prioridade:** Após almoço

---

## 🎯 Objetivo

Implementar sistema completo de:
1. Cadastro público de novos tenants (signup)
2. Controle de uso da API de IA (limites por plano)
3. Cache inteligente de alimentos com embeddings para reduzir custos de IA
4. Sistema de billing e upgrade de planos

---

## 📊 Situação Atual

- ❌ Não há página de signup pública
- ❌ Bootstrap manual via `/api/dev/bootstrap` (apenas dev)
- ✅ Tabela `tenants` básica: `id, slug, name, created_at`
- ❌ Sem controle de uso/limites da API de IA
- ❌ Cada request chama Gemini (custo alto)

---

## 🏗️ Arquitetura Proposta

### **1. Migration 012: Controle de Uso no Tenant**

```sql
-- Migration 012: Add usage tracking and subscription to tenants
-- Date: 2025-10-09
-- Purpose: Track AI usage, subscription plans, and billing

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'basic', 'premium')),
  ADD COLUMN IF NOT EXISTS ai_requests_used INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_requests_limit INT DEFAULT 50,
  ADD COLUMN IF NOT EXISTS ai_requests_reset_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days');

-- Indexes para queries de billing
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_reset_at ON tenants(ai_requests_reset_at);

COMMENT ON COLUMN tenants.status IS 'Account status: trial (7 dias grátis), active (pagando), suspended (limite excedido), cancelled (cancelado)';
COMMENT ON COLUMN tenants.subscription_plan IS 'free (50 req/mês), basic (200 req/mês), premium (ilimitado)';
COMMENT ON COLUMN tenants.ai_requests_used IS 'Contador de chamadas Gemini no período atual';
COMMENT ON COLUMN tenants.ai_requests_limit IS 'Limite mensal baseado no plano';
COMMENT ON COLUMN tenants.ai_requests_reset_at IS 'Data de reset do contador (mensal)';
COMMENT ON COLUMN tenants.trial_ends_at IS 'Data de término do trial (7 dias após criação)';
```

**Limites por Plano:**
- **Trial:** 50 requests (7 dias) → Depois vira Free
- **Free:** 50 requests/mês
- **Basic:** 200 requests/mês (R$ 19,90)
- **Premium:** Ilimitado (R$ 49,90)

---

### **2. Migration 013: Cache de Alimentos com Embeddings**

```sql
-- Migration 013: Food cache with embeddings for smart matching
-- Date: 2025-10-09
-- Purpose: Reduce AI costs by caching food analysis with semantic search

-- Ativar extensão de vetores (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS food_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificação do alimento
  food_name VARCHAR(255) NOT NULL,
  food_name_normalized VARCHAR(255) NOT NULL, -- lowercase, sem acentos
  quantity DECIMAL(10,2),
  unit VARCHAR(50),

  -- Embedding para busca semântica (1536 dimensões do text-embedding-004)
  embedding vector(1536),

  -- Dados nutricionais
  calories DECIMAL(10,2),
  protein_g DECIMAL(10,2),
  carbs_g DECIMAL(10,2),
  fat_g DECIMAL(10,2),

  -- Metadados
  source VARCHAR(50) DEFAULT 'gemini', -- gemini, manual, taco, usda
  language VARCHAR(5) DEFAULT 'pt-BR',
  hit_count INT DEFAULT 1, -- Contador de reutilizações (economia)
  confidence DECIMAL(3,2), -- 0.00-1.00 (confiança da IA na análise)

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  created_by_tenant_id UUID REFERENCES tenants(id)
);

-- Indexes tradicionais
CREATE INDEX idx_food_cache_normalized ON food_cache(food_name_normalized);
CREATE INDEX idx_food_cache_name ON food_cache(food_name);
CREATE INDEX idx_food_cache_last_used ON food_cache(last_used_at);

-- Index vetorial para busca por similaridade (HNSW = rápido)
CREATE INDEX idx_food_cache_embedding ON food_cache
  USING hnsw (embedding vector_cosine_ops);

COMMENT ON TABLE food_cache IS 'Cache global de alimentos com busca semântica por embeddings';
COMMENT ON COLUMN food_cache.embedding IS 'Embedding (Google text-embedding-004) para busca por similaridade';
COMMENT ON COLUMN food_cache.hit_count IS 'Quantas vezes foi reutilizado (cada hit economiza 1 request de IA)';
COMMENT ON COLUMN food_cache.confidence IS 'Confiança da IA na análise (0-1). Usar apenas se > 0.7';
```

---

### **3. Estratégia de Cache com Embeddings**

#### **Por que usar embeddings?**

✅ **Vantagens:**
- **Busca semântica:** "arroz branco" ≈ "arroz cozido" ≈ "arroz polido"
- **Tolerante a typos:** "franfo grelhado" encontra "frango grelhado"
- **Variações:** "pão francês" = "pão de sal" = "cacetinho"
- **Precisão:** Similaridade cosine > 0.90 = match muito confiável

❌ **Alternativas descartadas:**
- **Fuzzy matching (Levenshtein):** Falha com sinônimos ("batata inglesa" vs "batata")
- **Full-text search:** Não entende contexto semântico
- **Regex/LIKE:** Muito rígido, não escala

#### **Como funciona:**

```typescript
// Fluxo de análise de alimento com cache inteligente

async function analyzeFood(foodName: string, tenantId: string) {
  // 1. Gerar embedding do input (rápido, ~100ms, barato)
  const inputEmbedding = await generateEmbedding(foodName);

  // 2. Buscar no cache por similaridade vetorial
  const cached = await db.query(`
    SELECT *,
           1 - (embedding <=> $1) AS similarity
    FROM food_cache
    WHERE 1 - (embedding <=> $1) > 0.90  -- 90% similar
    ORDER BY similarity DESC
    LIMIT 1
  `, [inputEmbedding]);

  // 3. Se encontrou match com alta confiança
  if (cached.rows.length > 0 && cached.rows[0].confidence > 0.7) {
    await incrementCacheHit(cached.rows[0].id);
    return cached.rows[0]; // ✅ ECONOMIZOU 1 REQUEST GEMINI
  }

  // 4. Não encontrou → chamar Gemini
  const usageCheck = await checkAIUsage(tenantId);
  if (!usageCheck.allowed) {
    throw new Error('Limite de requests atingido');
  }

  const geminiResult = await callGeminiVision(foodImage);
  await incrementAIUsage(tenantId);

  // 5. Salvar no cache para próximas vezes
  await saveFoodCache({
    food_name: foodName,
    embedding: inputEmbedding,
    ...geminiResult
  });

  return geminiResult;
}
```

#### **Economia Estimada:**

- **Mês 1:** 20-30% economia (cache vazio)
- **Mês 2:** 50-60% economia (alimentos comuns já cached)
- **Mês 3+:** 70-85% economia (dataset robusto)

**Exemplo:** Usuário tem 200 requests/mês → Com cache, consome apenas 40 requests reais = **160 economizados**

---

### **4. API de Controle de Uso**

**Arquivo:** `/lib/ai-usage.ts`

```typescript
import { getPool } from './db';
import { logger } from './logger';

export interface AIUsageStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  plan: string;
  status: string;
}

/**
 * Verifica se tenant pode fazer request à IA
 * Reseta contador se passou 30 dias
 */
export async function checkAIUsage(tenantId: string): Promise<AIUsageStatus> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Buscar tenant com lock para evitar race condition
    const { rows } = await client.query(`
      SELECT
        status,
        subscription_plan,
        ai_requests_used,
        ai_requests_limit,
        ai_requests_reset_at,
        trial_ends_at
      FROM tenants
      WHERE id = $1
      FOR UPDATE
    `, [tenantId]);

    if (rows.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenant = rows[0];
    const now = new Date();

    // 1. Verificar se trial expirou
    if (tenant.status === 'trial' && new Date(tenant.trial_ends_at) < now) {
      await client.query(`
        UPDATE tenants
        SET status = 'active', subscription_plan = 'free'
        WHERE id = $1
      `, [tenantId]);
      tenant.status = 'active';
      tenant.subscription_plan = 'free';
    }

    // 2. Verificar se precisa resetar contador mensal
    if (new Date(tenant.ai_requests_reset_at) < now) {
      await client.query(`
        UPDATE tenants
        SET
          ai_requests_used = 0,
          ai_requests_reset_at = NOW() + INTERVAL '30 days'
        WHERE id = $1
      `, [tenantId]);
      tenant.ai_requests_used = 0;
      tenant.ai_requests_reset_at = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // 3. Verificar status da conta
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      return {
        allowed: false,
        used: tenant.ai_requests_used,
        limit: tenant.ai_requests_limit,
        remaining: 0,
        resetAt: tenant.ai_requests_reset_at,
        plan: tenant.subscription_plan,
        status: tenant.status
      };
    }

    // 4. Verificar limite (Premium = ilimitado)
    const remaining = tenant.subscription_plan === 'premium'
      ? 999999
      : tenant.ai_requests_limit - tenant.ai_requests_used;

    const allowed = tenant.subscription_plan === 'premium' || remaining > 0;

    return {
      allowed,
      used: tenant.ai_requests_used,
      limit: tenant.ai_requests_limit,
      remaining: Math.max(0, remaining),
      resetAt: tenant.ai_requests_reset_at,
      plan: tenant.subscription_plan,
      status: tenant.status
    };

  } finally {
    client.release();
  }
}

/**
 * Incrementa contador após request bem-sucedido
 * Se atingir limite, suspende conta
 */
export async function incrementAIUsage(tenantId: string): Promise<void> {
  const pool = getPool();

  const { rows } = await pool.query(`
    UPDATE tenants
    SET ai_requests_used = ai_requests_used + 1
    WHERE id = $1
    RETURNING ai_requests_used, ai_requests_limit, subscription_plan
  `, [tenantId]);

  const tenant = rows[0];

  // Se atingiu limite (exceto premium)
  if (tenant.subscription_plan !== 'premium' &&
      tenant.ai_requests_used >= tenant.ai_requests_limit) {
    await pool.query(`
      UPDATE tenants SET status = 'suspended' WHERE id = $1
    `, [tenantId]);

    logger.warn('[BILLING] Tenant suspended - limit reached', {
      tenantId,
      used: tenant.ai_requests_used,
      limit: tenant.ai_requests_limit
    });
  }
}

/**
 * Incrementa hit_count do cache (não conta como uso de IA)
 */
export async function incrementCacheHit(cacheId: string): Promise<void> {
  const pool = getPool();
  await pool.query(`
    UPDATE food_cache
    SET hit_count = hit_count + 1, last_used_at = NOW()
    WHERE id = $1
  `, [cacheId]);
}
```

---

### **5. Modificar `/lib/ai.ts` para usar cache**

```typescript
// Adicionar ao início de analyzeImageWithGemini():

// 1. Tentar buscar no cache primeiro
const cached = await searchFoodCache(foodDescription);
if (cached) {
  logger.info('[AI] Cache HIT - economia de request', { foodId: cached.id });
  await incrementCacheHit(cached.id);
  return cached;
}

// 2. Verificar limite antes de chamar Gemini
const usage = await checkAIUsage(tenantId);
if (!usage.allowed) {
  throw new Error(`Limite de requests atingido. ${usage.remaining} restantes. Reset em ${usage.resetAt}`);
}

// 3. Chamar Gemini
const result = await model.generateContent(...);

// 4. Incrementar uso
await incrementAIUsage(tenantId);

// 5. Salvar no cache
await saveFoodCache({
  food_name: foodDescription,
  embedding: await generateEmbedding(foodDescription),
  ...result
});
```

---

### **6. Página de Signup (`/app/signup/page.tsx`)**

**Fluxo:**
1. Form: Nome, Email, Senha, Nome da Empresa
2. Gera slug automático (lowercase, remove espaços)
3. Cria tenant com status `trial`, `ai_requests_limit=50`, `trial_ends_at=+7dias`
4. Cria user como `owner`
5. Envia email de boas-vindas
6. Redireciona para onboarding

---

### **7. Página de Billing (`/app/account` - nova seção)**

**Mostrar:**
- Status da conta (Trial 5/7 dias restantes | Active | Suspended)
- Plano atual: **Free**
- Uso: `[████████░░] 45 / 50 requests` (90%)
- Economia com cache: `120 hits = R$ 18,00 economizados`
- Reset em: 15 dias
- Botão "Upgrade para Basic" → Stripe Checkout

---

## 📦 Planos e Precificação

| Plano | Requests/mês | Preço | Features |
|-------|--------------|-------|----------|
| **Trial** | 50 | Grátis por 7 dias | Teste completo |
| **Free** | 50 | R$ 0 | Pós-trial, sempre grátis |
| **Basic** | 200 | R$ 19,90/mês | + Suporte email |
| **Premium** | ∞ Ilimitado | R$ 49,90/mês | + Suporte prioritário + Exports CSV |

**Nota:** Cache não conta no limite. Se usar 50 requests mas 200 cache hits = só paga pelos 50.

---

## 🔧 Ordem de Implementação

### **Fase 1: Infraestrutura (Hoje)**
1. ✅ Rodar Migration 012 (controle de uso)
2. ✅ Instalar pgvector no Supabase
3. ✅ Rodar Migration 013 (cache com embeddings)
4. ✅ Criar `/lib/ai-usage.ts`
5. ✅ Modificar `/lib/ai.ts` para usar cache + limites

### **Fase 2: Signup (Amanhã)**
6. 📝 Criar `/app/signup/page.tsx`
7. 📝 Criar `/app/api/signup/route.ts`
8. 📝 Email de boas-vindas (opcional)

### **Fase 3: Billing (Semana que vem)**
9. 💰 Adicionar seção Billing em `/app/account`
10. 💰 Integrar Stripe (checkout + webhooks)
11. 💰 Dashboard de uso (gráficos, histórico)

---

## 🤔 Decisão: Embeddings são a melhor solução?

### **Análise Técnica:**

#### ✅ **SIM, embeddings são ideais porque:**

1. **Busca Semântica Real**
   - "frango grelhado 100g" ≈ "peito de frango na grelha" (similaridade ~0.95)
   - Fuzzy matching falharia aqui (palavras diferentes)

2. **Tolerância Natural a Variações**
   - Typos: "brocolis" encontra "brócolis"
   - Sinônimos: "aipim" = "mandioca" = "macaxeira"
   - Descrições: "banana nanica madura" ≈ "banana prata"

3. **Performance com pgvector**
   - Index HNSW: busca em ~10ms mesmo com 100k alimentos
   - Comparable a Elasticsearch mas sem infraestrutura extra

4. **Custo-Benefício**
   - Embedding (text-embedding-004): $0.00002 / 1K tokens ≈ **R$ 0.0001 por busca**
   - Gemini Vision: ~$0.01 por request ≈ **R$ 0.05 por análise**
   - **ROI:** Economia de 500x no custo

#### 🆚 **Alternativas Consideradas:**

| Método | Pros | Contras | Veredicto |
|--------|------|---------|-----------|
| **Fuzzy (Levenshtein)** | Simples, sem APIs | Não entende semântica | ❌ Insuficiente |
| **Full-text (pg_trgm)** | Nativo no Postgres | Não entende sinônimos | ❌ Limitado |
| **Elasticsearch** | Muito poderoso | Infra complexa, caro | ❌ Overkill |
| **Embeddings (pgvector)** | Preciso, escalável | Requer pgvector | ✅ **Escolhido** |

#### 📊 **Prova de Conceito:**

```sql
-- Query de busca por similaridade (exemplo)
SELECT
  food_name,
  calories,
  protein_g,
  1 - (embedding <=> '[0.123, 0.456, ...]'::vector) AS similarity
FROM food_cache
WHERE 1 - (embedding <=> '[0.123, 0.456, ...]'::vector) > 0.88
ORDER BY similarity DESC
LIMIT 3;

-- Resultado:
-- frango grelhado 100g    | 165 kcal | 31g | 0.95
-- peito de frango assado  | 170 kcal | 30g | 0.92
-- frango sem pele cozido  | 160 kcal | 32g | 0.89
```

### **Conclusão:** ✅ **SIM, embeddings + pgvector é a melhor solução**

---

## 📌 Checklist de Implementação

```markdown
### Fase 1: Infraestrutura
- [ ] Ativar extensão pgvector no Supabase
- [ ] Rodar Migration 012 (tenant billing fields)
- [ ] Rodar Migration 013 (food_cache com embeddings)
- [ ] Criar `/lib/ai-usage.ts`
- [ ] Criar `/lib/embeddings.ts` (Google text-embedding-004)
- [ ] Modificar `/lib/ai.ts` para integrar cache
- [ ] Testar fluxo: request → cache miss → Gemini → save cache
- [ ] Testar fluxo: request → cache hit → economia

### Fase 2: Signup
- [ ] Criar `/app/signup/page.tsx` (form)
- [ ] Criar `/app/api/signup/route.ts` (POST)
- [ ] Validações: email único, slug único
- [ ] Email de boas-vindas (SendGrid/Resend)
- [ ] Redirect para onboarding

### Fase 3: Billing
- [ ] Adicionar seção "Plano & Uso" em `/app/account`
- [ ] Mostrar usage bar, cache hits, reset date
- [ ] Botão "Upgrade" → Stripe Checkout
- [ ] Webhook `/api/stripe/webhook` (payment success)
- [ ] Auto-upgrade após pagamento confirmado
- [ ] Notification quando atingir 80% do limite
```

---

## 🚀 Próximos Passos

**Após o almoço:**
1. Instalar pgvector no Supabase
2. Rodar migrations 012 e 013
3. Implementar `/lib/ai-usage.ts`
4. Modificar `/lib/ai.ts` para usar cache

**Dúvidas a resolver:**
- [ ] Usar Stripe ou outro gateway? (Mercado Pago, Paddle)
- [ ] Email service? (SendGrid, Resend, AWS SES)
- [ ] Embeddings Google ou OpenAI? (Google = mais barato)

---

**Criado por:** Claude Code
**Última atualização:** 2025-10-09 11:30
