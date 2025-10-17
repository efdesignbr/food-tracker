# Food Tracker - Quick Reference Guide

## Project Overview
A Next.js 14 multi-tenant meal tracking app with AI-powered nutritional analysis, powered by Google Gemini.

---

## Stack at a Glance

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Next.js 14 (App Router), TypeScript |
| **Backend** | Node.js 18+, Next.js API Routes |
| **Database** | PostgreSQL (raw SQL, pg driver) |
| **AI** | Google Gemini 2.0 Flash (text + vision) |
| **Storage** | Supabase (images) |
| **Auth** | NextAuth 5 (JWT + credentials) |
| **Validation** | Zod schemas |
| **Image Processing** | Sharp (resize + compress) |

---

## Database Tables Quick View

```
tenants ─────────────────────┐
  ├─ id (PK, UUID)           │
  ├─ slug (unique)            │
  └─ name                     │
                              │
    users ─────────────────────────┐
    ├─ id, email, password_hash    │
    ├─ tenant_id (FK)             │
    ├─ role, phone                │
    └─ goals (5 columns)          │
                                  │
      meals ────────────────────────────┐
      ├─ id, user_id, tenant_id        │
      ├─ meal_type, consumed_at        │
      └─ image_url (nullable, not stored)
            │
            ├─ food_items ────────────────┐
            │  ├─ name, quantity, unit    │
            │  └─ confidence_score        │
            │       │
            │       └─ nutrition_data ────────────┐
            │          ├─ calories                │
            │          ├─ protein_g, carbs_g      │
            │          ├─ fat_g, fiber_g         │
            │          └─ sodium_mg, sugar_g     │
            │
            └─ water_intake ──────────┐
                ├─ amount_ml          │
                ├─ consumed_at        │
                └─ notes              │

bowel_movements ────────────────┐
├─ bristol_type (1-7)           │
├─ occurred_at                  │
└─ user_id, tenant_id           │
```

---

## API Endpoints Summary

### Meals
- `POST /api/meals/analyze-text` - AI text analysis
- `POST /api/meals/analyze-image` - AI image analysis
- `POST /api/meals/approve` - Save meal
- `GET /api/meals` - List user meals

### Water & Bowel
- `POST /api/water-intake` - Log water
- `GET /api/water-intake` - Get water stats
- `POST /api/bowel-movements` - Log BM
- `GET /api/bowel-movements` - Get BM count

### Reports
- `GET /api/reports/inflammation` - Inflammation triggers

### Auth & User
- `POST /api/auth/signup` - Register
- `GET/POST /api/auth/[...nextauth]` - NextAuth
- `GET /api/user/profile` - User profile

---

## UI Pages & Routes

```
/ .................. Home/Dashboard
  ├─ Daily stats (calories/macros)
  ├─ Water tracking
  ├─ Bowel movements
  └─ Recent meals (3)

/capture ........... Meal Capture
  ├─ Photo mode
  ├─ Text mode
  └─ AI analysis display

/history ........... Meal History
  └─ Calendar view

/reports ........... Analytics
  ├─ 7d/30d/all filters
  ├─ Macro trends
  ├─ Top foods
  └─ Water tracking

/account ........... Profile & Settings
/login ............. Login page
/signup ............ Registration
```

---

## Key Files & Responsibilities

| File | Purpose |
|------|---------|
| `/lib/ai.ts` | Gemini integration (text + image analysis) |
| `/lib/db.ts` | PostgreSQL connection pool |
| `/lib/repos/meal.repo.ts` | Meal CRUD operations |
| `/lib/schemas/meal.ts` | Input validation (Zod) |
| `/lib/constants.ts` | Image compression settings, DB config |
| `/app/capture/page.tsx` | Meal capture UI + flow |
| `/app/reports/page.tsx` | Analytics page |
| `/migrations/` | Database schema (SQL) |
| `auth.ts` | NextAuth configuration |

---

## Meal Capture Flow (Visual)

```
┌─ User chooses mode (Photo/Text)
│
├─ PHOTO PATH:
│  ├─ File picker
│  ├─ Frontend compress (500KB limit)
│  ├─ Preview image
│  └─ POST /analyze-image
│
├─ TEXT PATH:
│  ├─ Textarea input
│  ├─ Optional meal type
│  └─ POST /analyze-text
│
├─ AI Processing (Gemini):
│  ├─ Portuguese prompting
│  ├─ TACO references
│  └─ Structured JSON response
│
├─ Display Results:
│  ├─ Total calories badge
│  ├─ Food list with macros
│  └─ AI quality notes
│
├─ User Review Form:
│  ├─ Meal type (required)
│  ├─ Timestamp (default: now SP time)
│  └─ Additional notes
│
└─ POST /api/meals/approve
   └─ Database transaction:
      ├─ Insert meal
      ├─ Insert food_items
      ├─ UPSERT nutrition_data
      └─ Commit/Rollback
```

---

## Multi-Tenancy Pattern

Every API endpoint follows this pattern:

```typescript
// 1. Verify user is authenticated
const session = getSessionData(await auth());
if (!session) return 401;

// 2. Resolve tenant from request headers
const tenant = await requireTenant(req);

// 3. Verify user's tenant matches request
if (session.tenantId !== tenant.id) return 403;

// 4. Set context for all queries
await client.query(
  "SELECT set_config('app.tenant_id', $1, true)", 
  [tenant.id]
);

// 5. Execute query (automatically filtered by tenant)
// No need to add WHERE tenant_id = ... manually
```

---

## Gemini AI Integration

### Text Analysis (`analyzeMealFromText`)
- Input: Description (Portuguese)
- Output: Structured JSON
- Features: Meal type detection, portion estimation

### Image Analysis (`analyzeMealFromImage`)
- Input: Image bytes (after Sharp processing)
- Processing: Resize to 1024px, JPEG compress <100KB
- Output: Same structured JSON
- Features: Food detection, portion estimation from visual

### Quality Controls
- Temperature: 0.1 (deterministic)
- TACO database reference
- Conservative estimates
- 490 char max notes (DB safety)
- All nutrients included when possible

---

## Image Processing Pipeline

```
Raw Image (User's file)
    ↓
Frontend Compression (canvas, <500KB)
    ↓
Server-side Sharp Processing:
    1. Auto-rotate (EXIF)
    2. Resize (max 1024px)
    3. JPEG encode (quality: 80)
    ↓
Quality Check (size <100KB)
    ↓
If too large: Reduce quality (80→20)
    ↓
Send to Gemini API
    ↓
Base64 encode for API call
```

---

## Data Validation Layers

### Input Validation (Zod)
- `AnalyzeTextSchema`: description + meal_type
- `FoodItemSchema`: name, quantity, unit + nutrition
- `ApproveMealSchema`: meal_type (required), consumed_at, foods array

### Database Constraints
- UNIQUE(tenant_id, email) on users
- UNIQUE(food_item_id) on nutrition_data
- CHECK constraints on integers (calories > 0, bristol_type 1-7)
- Foreign key constraints with CASCADE delete

### TypeScript Types
- Compile-time safety throughout
- `DbMeal`, `DbFoodItem`, `AiMealAnalysis` types
- All API responses typed

---

## Reports & Analytics

### Period Filters
- Week: Last 7 days
- Month: Last 30 days
- All: All-time data

### Metrics Tracked
- Total/average calories
- Total macros (protein, carbs, fat)
- Water consumption
- Top 10 foods (de-duplicated)
- Meal type distribution
- Inflammation triggers (keyword-based)

### Inflammation Keywords (Portuguese)
- Dairy: leite, queijo, iogurte, manteiga
- Grains: pão, massa, bolo, glúten
- Processed: fritura, bacon, salsicha
- And 30+ more...

---

## Environment Variables Needed

```bash
DATABASE_URL="postgresql://user:pass@host/dbname"
GEMINI_API_KEY="your-api-key"
NEXT_PUBLIC_SUPABASE_URL="https://your.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-key"
AUTH_SECRET="random-secret-key"
DEFAULT_TENANT_SLUG="default"
AUTO_MIGRATE="true"
NODE_ENV="development"
```

---

## Common Tasks

### Add New Meal Nutrient
1. Add column to `nutrition_data` table (migration)
2. Update `FoodItemSchema` in `/lib/schemas/meal.ts`
3. Update `AiFood` type in `/lib/ai.ts`
4. Add to Gemini prompt template

### Modify AI Behavior
- Edit prompt in `/lib/ai.ts` (system + user prompts)
- Adjust temperature (0.1 = deterministic)
- Change responseSchema JSON

### Add Report Metric
1. Add calculation to `/app/reports/page.tsx` (stats memoization)
2. Add UI card to render metric
3. If inflammatory: Update keywords in `/lib/reports.ts`

### Add New Role
1. Update CHECK constraint in users table
2. Update authorization logic in route handlers
3. Add permissions mapping

---

## Performance Notes

### Database
- Connection pool: 5 max
- Timezone: America/Sao_Paulo (hardcoded)
- Indexes on: tenant_id, consumed_at, user_id

### Image Processing
- Frontend: max 500KB before upload
- Server: max 5MB hard limit
- Final: <100KB to Gemini (JPEG)

### AI Calls
- No caching implemented
- Consider rate limiting (not current)
- Temperature 0.1 = slower but deterministic

---

## Security Features

- **Auth**: JWT with 30-day expiry
- **Passwords**: Bcrypt (cost 10)
- **Queries**: Parameterized (no SQL injection)
- **Tenant Isolation**: Application-level filtering
- **Cookies**: HttpOnly, Secure, SameSite=Lax
- **EXIF Stripping**: Auto-rotate only (no full strip)

---

## Testing

Set up tenant for testing:
```bash
TENANT_SLUG=dev TENANT_NAME="Dev" \
USER_EMAIL=test@dev.local USER_NAME=Test \
USER_PASSWORD=test123 \
npx tsx scripts/setup-tenant.ts
```

Then login at `/login` with test@dev.local / test123

---

## File Size Reference

- Package size: ~400MB (node_modules)
- Source code: ~500KB (TS/TSX)
- Migrations: ~10KB (SQL)
- Build output: Varies

---

**Last Updated**: Oct 16, 2025
**Food Tracker Version**: 0.1.0
**Status**: Production-ready multi-tenant SaaS
