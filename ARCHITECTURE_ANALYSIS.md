# Food Tracker - Comprehensive Codebase Architecture Analysis

## Executive Summary
Food Tracker is a multi-tenant web application built with **Next.js 14** for meal tracking, nutritional analysis, and health monitoring. It integrates Google's Gemini AI for intelligent meal analysis, uses PostgreSQL for data persistence, Supabase for object storage, and NextAuth for authentication.

---

## 1. Technology Stack & Framework

### Core Framework & Runtime
- **Next.js**: 14.2.5 (App Router)
- **Runtime**: Node.js (>=18.18.0)
- **Language**: TypeScript 5.6.2
- **Frontend**: React 18.3.1 with react-dom
- **CSS**: Styled inline (no CSS framework detected)

### AI & ML
- **Primary AI**: Google Generative AI (Gemini 2.0 Flash Exp)
  - Document: `/lib/ai.ts`
  - API Version: `@google/generative-ai@0.24.1`
  - Uses structured JSON response schemas for parsing meals
  - Brazilian Portuguese (TACO) nutritional reference database
  - Supports both text and image analysis

### Database & Storage
- **Primary DB**: PostgreSQL (via `pg@8.11.5`)
- **ORM/Query**: Raw SQL with parameterized queries (pg library)
- **Connection Pool**: 5 max connections
- **Timezone**: America/Sao_Paulo (hardcoded)
- **Storage**: Supabase (@supabase/supabase-js@2.45.5)
- **Image Processing**: Sharp 0.34.4

### Authentication & Security
- **Auth**: NextAuth 5.0.0-beta.20
- **Strategy**: JWT-based with credentials provider
- **Hashing**: bcryptjs 2.4.3
- **Session TTL**: 30 days
- **Cookie**: Secure HttpOnly path-based

### Additional Libraries
- **UUID**: uuid@9.0.1 (v4 generation)
- **Validation**: zod@3.23.8 (schema validation)
- **PWA**: next-pwa@5.6.0
- **Logging**: Custom logger utility

---

## 2. Database Schema & Data Models

### Core Tables

#### `tenants` (Multi-tenancy)
```
- id: UUID (PK)
- slug: VARCHAR(100) UNIQUE
- name: VARCHAR(200)
- created_at: TIMESTAMP
```
**Purpose**: Supports multi-tenant SaaS architecture

#### `users`
```
- id: UUID (PK)
- email: VARCHAR UNIQUE (per tenant)
- name: VARCHAR
- password_hash: TEXT
- tenant_id: UUID (FK → tenants)
- role: VARCHAR (owner|admin|member)
- phone: VARCHAR(20)
- goal_calories: INT (default 2000)
- goal_protein_g: INT (default 150)
- goal_carbs_g: INT (default 250)
- goal_fat_g: INT (default 65)
- goal_water_ml: INT (default 2000)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```
**Indexes**: 
- UNIQUE(tenant_id, email)

#### `meals`
```
- id: UUID (PK)
- user_id: UUID (FK → users)
- tenant_id: UUID (FK → tenants)
- image_url: VARCHAR (nullable - NOT stored, only for AI)
- meal_type: ENUM ('breakfast'|'lunch'|'dinner'|'snack')
- consumed_at: TIMESTAMP
- status: VARCHAR ('pending'|'approved'|'rejected')
- notes: TEXT (max 500 chars)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```
**Indexes**:
- tenant_id, consumed_at DESC

#### `food_items`
```
- id: UUID (PK)
- meal_id: UUID (FK → meals)
- tenant_id: UUID (FK → tenants)
- name: VARCHAR
- quantity: NUMERIC
- unit: VARCHAR(50)
- confidence_score: NUMERIC (null)
- created_at: TIMESTAMP
```

#### `nutrition_data`
```
- id: UUID (PK)
- food_item_id: UUID (FK → food_items, UNIQUE)
- tenant_id: UUID (FK → tenants)
- calories: NUMERIC
- protein_g: NUMERIC
- carbs_g: NUMERIC
- fat_g: NUMERIC
- fiber_g: NUMERIC
- sodium_mg: NUMERIC
- sugar_g: NUMERIC
```
**ON CONFLICT Strategy**: UPSERT (update all fields)

#### `water_intake`
```
- id: UUID (PK)
- user_id: UUID (FK → users)
- tenant_id: UUID (FK → tenants)
- amount_ml: INT (default 250)
- consumed_at: TIMESTAMP
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```
**Indexes**: user_id, tenant_id, consumed_at, user_date

#### `bowel_movements`
```
- id: UUID (PK)
- user_id: UUID (FK → users)
- tenant_id: UUID (FK → tenants)
- occurred_at: TIMESTAMP
- bristol_type: INT (1-7, Bristol Stool Scale)
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```
**Bristol Scale**:
- 1: Hard pellets (constipation)
- 2: Irregular sausage
- 3: Sausage with cracks (normal)
- 4: Smooth sausage (ideal)
- 5: Soft lumps
- 6: Mushy lumps (loose stool)
- 7: Liquid (severe diarrhea)

### Data Flow Architecture

```
User Input (Photo/Text)
    ↓
Frontend Compression (if photo)
    ↓
AI Analysis (Google Gemini)
    ↓
Structured JSON Response (with nutrition data)
    ↓
User Review & Edit (Capture Page)
    ↓
Approval & Persistence
    ↓
Database Transaction (meals + food_items + nutrition_data)
```

---

## 3. AI Integration Architecture

### Gemini Integration (`/lib/ai.ts`)

#### Two Analysis Modes:
1. **Text-Based**: `analyzeMealFromText(description, mealType?)`
2. **Image-Based**: `analyzeMealFromImage(bytes, mediaType)`

#### Response Schema (Structured Output)
```typescript
type AiMealAnalysis = {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: AiFood[];
  notes?: string;
};

type AiFood = {
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
```

#### Key Features:
- **Reference Database**: Brazilian TACO (Tabela Brasileira de Composição de Alimentos)
- **Temperature**: 0.1 (deterministic responses)
- **Language**: Portuguese
- **Prompt Engineering**: 
  - Requests conservative estimates
  - Emphasizes all macro + micronutrients
  - Includes inflammatory food detection
  - Concise notes (max 400 chars)
- **Note Truncation**: Automatic truncation to 490 chars for DB safety
- **Nutrition Info**: Includes calories, protein, carbs, fats, fiber, sodium, sugars

#### AI Capabilities Used:
- Automatic meal type inference
- Portion size estimation from context
- Inflammatory ingredient identification
- Health quality assessment
- Portuguese language processing

### Image Processing Pipeline (`/lib/images.ts`)

```
Raw Image
  ↓
Auto-rotate (EXIF handling)
  ↓
Resize (max 1024px dimension)
  ↓
JPEG compression (quality: 80→20)
  ↓
Target: <100KB
  ↓
Send to Gemini API
```

---

## 4. Meal Capture & Storage Flow

### Capture Page (`/app/capture/page.tsx`)

#### Two Input Modes:
1. **Photo Mode**
   - File picker with gallery/camera support
   - Frontend compression (500KB limit)
   - Preview before analysis
   
2. **Text Mode**
   - Textarea input
   - Optional meal type selector
   - Direct description analysis

#### Analysis Flow:
```
User Input
  ↓
[Loading State]
  ↓
API Call → /api/meals/analyze-{image|text}
  ↓
Gemini Processing
  ↓
JSON Parse & Validation
  ↓
Display Results with:
    - Total calories badge
    - Food items list
    - Nutritional breakdown
    - AI notes
  ↓
User Edit Form:
    - Meal type (required)
    - Consumed at (timestamp)
    - Additional notes
  ↓
Save Button → /api/meals/approve
```

#### Validation (Zod schemas `/lib/schemas/meal.ts`):
```typescript
AnalyzeTextSchema: {
  description: string (3+ chars)
  meal_type?: string
}

ApproveMealSchema: {
  meal_type: enum (required)
  consumed_at: Date
  notes?: string (max 500)
  foods: FoodItemSchema[]
}

FoodItemSchema: {
  name: string (required)
  quantity: number (>0.01)
  unit: string (max 50)
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sodium_mg?: number
  sugar_g?: number
}
```

---

## 5. Current Navigation & Menu Structure

### Main Pages
```
/               → Home (Dashboard with daily stats)
/capture        → Meal Capture (Photo/Text input)
/history        → Meal History (Calendar view)
/reports        → Analytics & Reports (7d/30d/all)
/account        → User Profile & Settings
/login          → Authentication
/signup         → Registration
```

### Navigation Flow
- **Home Dashboard** displays:
  - Daily progress (calories/macros)
  - Water intake tracking
  - Bowel movements tracking
  - Recent meals (3 most recent)
  - Quick action to capture meals
  
- **Capture** is primary CTA (central focus)
- **History** provides detailed meal review
- **Reports** shows aggregated analytics

### Dashboard Components (Home Page)
1. **Today's Progress Card**
   - Calorie meter
   - Protein/Carbs/Fat grid
   
2. **Hydration Card**
   - Water intake progress
   - Quick add buttons (250ml, 500ml)
   
3. **Intestinal Health Card**
   - Bristol scale tracker
   - 7-item Bristol selector
   
4. **Recent Meals Section**
   - Last 3 meals with timestamps
   - Link to full history

---

## 6. Reports & Analytics Functionality

### Reports Page (`/app/reports/page.tsx`)

#### Period Filters
- Last 7 days
- Last 30 days
- All time

#### Metrics Calculated
**Macro Statistics**:
- Total calories
- Total protein (g)
- Total carbs (g)
- Total fat (g)
- Average calories per meal
- Average calories per day

**Water Tracking**:
- Total water (L)
- Average per day
- Days with water tracking

**Visualization**:
- 7-day calorie trend (bar chart)
- Calories by meal type
- Top 10 foods consumed
- Macro progress bars with goal comparison

#### Data Sources
- `/api/meals` - All meals with foods
- `/api/user/profile` - User goals
- `/api/water-intake?history=true` - Water history

### Inflammation Report (`/api/reports/inflammation`)

**Keywords Tracked** (Brazilian Portuguese):
```
Dairy: leite, queijo, iogurte, manteiga, lactose
Grains: pão, massa, macarrão, bolo, biscoito, glúten
Processed: fritura, frito, bacon, salsicha, embutido
Spicy: pimenta, picante, apimentado
Inflammatory: refrigerante, café, álcool, cerveja, vinho
Legumes: feijão, lentilha, grão de bico
Cruciferous: brócolis, couve-flor, repolho
```

**Report Output**:
- potential_triggers (with occurrence count & dates)
- meal type patterns
- most_common_meal_type

---

## 7. API Endpoints & Architecture

### Meal Endpoints

#### POST `/api/meals/analyze-text`
```
Request: { description: string, meal_type?: string }
Response: { ok: true, tenant, result: AiMealAnalysis }
Error: 400 with error message
```
**Flow**: Text → Gemini → JSON Response

#### POST `/api/meals/analyze-image`
```
Request: FormData with image file
Response: { ok: true, tenant, result: AiMealAnalysis }
Processing: 
  1. Size validation (<5MB)
  2. Frontend compression applied
  3. Sharp processing (resize + JPEG)
  4. Gemini vision analysis
```

#### POST `/api/meals/approve`
```
Request: 
  - JSON: ApproveMealSchema
  - OR FormData with image + payload
  
Response: { ok: true, id: meal.id }

Database Transaction:
  1. BEGIN
  2. Set app.tenant_id context
  3. INSERT meals
  4. INSERT food_items (for each food)
  5. UPSERT nutrition_data
  6. COMMIT
  
Error Handling: Includes diagnostics query on failure
```

#### GET `/api/meals`
```
Query Params: start, end (default: last 30 days)
Response: { meals: Meal[] }
Each meal includes:
  - id, meal_type, consumed_at, notes
  - foods array with nutrition data
```

#### GET `/api/meals/history`
Alias for GET `/api/meals`

### Water Intake Endpoints

#### POST `/api/water-intake`
```
Request: { amount_ml: number }
Response: { total_today_ml: number }
```

#### GET `/api/water-intake`
```
Query: history=true (optional)
Response: 
  - Without history: { total_ml, total_today_ml }
  - With history: { history: WaterRecord[] }
```

### Bowel Movement Endpoints

#### POST `/api/bowel-movements`
```
Request: { bristol_type: 1-7 }
Response: { count_today: number }
```

#### GET `/api/bowel-movements`
```
Response: { count: number }
```

### Reports Endpoints

#### GET `/api/reports/inflammation`
```
Query: start_date, end_date (YYYY-MM-DD format)
Response: {
  ok: true,
  period,
  total_meals,
  potential_triggers: [{ food, occurrences, dates }],
  patterns: { most_common_meal_type }
}
```

### User Endpoints

#### GET `/api/user/profile`
```
Response: { 
  user: {
    goals: {
      calories,
      protein,
      carbs,
      fat,
      water
    }
  }
}
```

#### POST `/api/auth/signup`
User registration endpoint

#### GET/POST `/api/auth/[...nextauth]`
NextAuth authentication handlers

---

## 8. Multi-Tenancy & Security Architecture

### Tenant Isolation
- **Row-Level Security**: Originally attempted, now disabled (migrations show incremental disabling)
- **Application-Level Isolation**:
  - All queries filter by `tenant_id`
  - Tenant context set via `SELECT set_config('app.tenant_id', $1, true)`
  - Validates session tenant matches request tenant

### User Roles
- **owner**: Full tenant admin
- **admin**: Administrative access
- **member**: Standard user (default)

### Authentication Flow
```
User Input (email + password)
  ↓
Lookup user + tenant by email
  ↓
Compare password hash (bcrypt)
  ↓
Create JWT with:
  - userId
  - tenantId
  - tenantSlug
  - role
  ↓
30-day session cookie (HttpOnly, Secure, SameSite=Lax)
```

### Authorization Pattern
```typescript
// In API routes:
const tenant = await requireTenant(req);
const session = getSessionData(await auth());
if (!session) return 401;
if (session.tenantId !== tenant.id) return 403;
// Process with tenant context
```

---

## 9. Key File Structure

### Core Application Files
```
/app/                      # Next.js App Router
├── page.tsx               # Home/Dashboard
├── capture/page.tsx       # Meal capture
├── history/page.tsx       # Meal history
├── reports/page.tsx       # Analytics
├── account/page.tsx       # User profile
├── login/page.tsx         # Auth
├── signup/page.tsx        # Registration
├── layout.tsx             # Root layout
└── api/
    ├── meals/
    │   ├── route.ts       # GET meals
    │   ├── approve/route.ts
    │   ├── analyze-text/route.ts
    │   ├── analyze-image/route.ts
    │   └── history/route.ts
    ├── water-intake/route.ts
    ├── bowel-movements/route.ts
    ├── user/profile/route.ts
    ├── reports/inflammation/route.ts
    └── auth/

/lib/                      # Core business logic
├── ai.ts                  # Gemini integration
├── db.ts                  # PostgreSQL pool
├── storage.ts             # Supabase storage
├── logger.ts              # Logging
├── tenant.ts              # Tenant resolution
├── auth.ts                # Auth utilities (NextAuth config in /auth.ts)
├── init.ts                # Migration runner
├── env.ts                 # Environment variables
├── constants.ts           # Configuration constants
├── repos/
│   ├── meal.repo.ts       # Meal data access
│   └── bowel-movement.repo.ts
├── schemas/
│   ├── meal.ts            # Meal validation
│   └── report.ts          # Report validation
└── types/
    └── auth.ts            # Authentication types

/components/               # React components
├── AuthenticatedLayout.tsx
├── AppLayout.tsx
└── CalendarView.tsx

/migrations/               # Database migrations (SQL)
├── 001_create_tenants.sql
├── 002_add_tenant_id.sql
├── 003_users_auth.sql
├── 010_allow_null_image_url.sql
├── 011_add_user_preferences.sql
├── 012_water_intake_tracking.sql
└── 013_bowel_movements_tracking.sql

/scripts/                  # CLI utilities
├── setup-tenant.ts        # Create tenant + user
├── apply-migrations.ts
├── reset-and-setup.ts
└── ... (debugging/testing scripts)

/public/                   # Static assets
├── manifest.json          # PWA manifest
├── icons/                 # Various sizes
└── ...

auth.ts                    # NextAuth configuration root
middleware.ts              # NextAuth middleware
```

---

## 10. Key Architectural Patterns

### 1. **Multi-Tenancy Pattern**
- Tenant context injection via `set_config`
- All queries filter by tenant_id
- Tenant validation at route level

### 2. **Transaction-Based Data Persistence**
- Atomic inserts (meals + foods + nutrition)
- Rollback on any step failure
- Transaction-aware repository pattern

### 3. **AI Analysis Pipeline**
- Structured output schemas (enforced by Gemini)
- Schema validation (Zod) on both ends
- Conservative nutritional estimates
- Portuguese language optimization

### 4. **Lazy Image Handling**
- Images NOT persisted to database
- Used only for AI analysis
- Frontend compression reduces bandwidth
- Sharp handles server-side processing
- Architectural decision for LGPD compliance + cost

### 5. **State Management**
- Client-side React state (useState/useMemo)
- API-driven (fetch on mount)
- No Redux/Context observed

### 6. **Error Handling**
- Comprehensive error diagnostics in approval endpoint
- Fallback diagnostics query for DB troubleshooting
- User-friendly error messages

### 7. **Validation Layers**
- Zod schema validation (runtime)
- TypeScript types (compile-time)
- Database constraints (schema-time)

---

## 11. Environment Configuration

### Required Environment Variables
```
DATABASE_URL              # PostgreSQL connection string
GEMINI_API_KEY            # Google Gemini API key
NEXT_PUBLIC_SUPABASE_URL  # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY # Supabase service key
AUTH_SECRET               # NextAuth secret
DEFAULT_TENANT_SLUG       # Default tenant for login
AUTO_MIGRATE              # Run migrations on init
AUTO_BOOTSTRAP_DEFAULTS   # (DISABLED in production)
NODE_ENV                  # development|production
MAX_UPLOAD_BYTES          # Max file size (default 5MB)
```

### Constants (in `/lib/constants.ts`)
```typescript
UPLOAD.MAX_BYTES: 5 * 1024 * 1024
IMAGE.MAX_DIMENSION_PX: 1024
IMAGE.TARGET_MAX_SIZE_BYTES: 100 * 1024
IMAGE.INITIAL_QUALITY: 80
IMAGE.MIN_QUALITY: 20
DATABASE.POOL_MAX_CONNECTIONS: 5
DATABASE.DEFAULT_TIMEZONE: 'America/Sao_Paulo'
```

---

## 12. Critical Areas for New Features

### For "Meal Capture with Photos":
- **Current State**: Photos are captured but NOT stored
- **Impact**: Existing `/api/meals/analyze-image` can be reused
- **Consider**: Archive strategy, storage limits, retention policy

### For "Data Models":
- **Extensible**: food_items and nutrition_data already normalized
- **Gap**: No allergen tracking, no recipe/portion templates
- **Consider**: user_meal_templates, allergen_flags tables

### For "AI Integration":
- **Current**: Gemini vision for image analysis only
- **Enhancement Opportunities**:
  - Meal recommendation AI
  - Personalized nutrition planning
  - Pattern analysis (auto-detect trends)
  - Meal-to-meal suggestions based on history

### For "Navigation/Menus":
- **Current**: Simple flat navigation
- **Enhancement**: 
  - Meal templates/quick meals
  - Settings submenu
  - Reports breakdown view

### For "Reports":
- **Current**: Basic aggregation + inflammation keywords
- **Enhancement Opportunities**:
  - Goal tracking vs actual
  - Meal timing analysis
  - Nutrition density scores
  - Weekly recommendations
  - Export functionality

---

## 13. Database Performance Considerations

### Existing Indexes
- meals(tenant_id, consumed_at DESC)
- food_items(tenant_id)
- nutrition_data(tenant_id)
- water_intake(user_id, consumed_at DESC)
- bowel_movements(user_id, occurred_at DESC)

### Query Patterns
- **Common**: Last 30 days by user + tenant
- **Aggregation**: Daily totals for last 7/30/all days
- **Sorting**: Reverse chronological (consumed_at DESC)

### Recommendations for Scaling
- Add index: `(tenant_id, user_id, consumed_at)`
- Consider: Materialized view for daily aggregates
- Archive: Old meals to separate table

---

## 14. Security Audit Notes

### Strengths
- Parameterized queries (no SQL injection)
- Bcrypt password hashing (cost 10)
- Tenant isolation at application level
- HTTPOnly secure cookies
- JWT-based sessions

### Areas to Review
- RLS was disabled (check migrations 004-009) - consider re-enabling
- Image handling: No EXIF stripping before Gemini send
- Rate limiting: Not implemented on AI analysis endpoints
- CORS: Check next.config settings

---

## Summary

This is a production-quality Next.js application with:
- **Robust multi-tenancy**: Tenant context injection + validation
- **AI-powered meal analysis**: Google Gemini + Portuguese localization
- **Health tracking**: Meals, water, bowel movements
- **Analytics**: Period-based filtering + inflammatory food detection
- **Type-safe**: TypeScript throughout
- **Responsive**: Mobile-first design with PWA support
- **Scalable**: Transaction-based architecture + connection pooling

The codebase is well-structured for adding new features around meal analysis, advanced reporting, and personalized recommendations.
