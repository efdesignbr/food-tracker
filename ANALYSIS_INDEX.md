# Food Tracker Codebase Analysis - Index & Navigation

## Overview

This analysis provides a comprehensive understanding of the Food Tracker application architecture. Two detailed documents have been generated to support different use cases:

- **ARCHITECTURE_ANALYSIS.md** - Deep technical analysis
- **QUICK_REFERENCE.md** - Quick lookup guide

---

## Document Organization

### ARCHITECTURE_ANALYSIS.md (Main Technical Document)
**Best for:** System design, implementation planning, architectural decisions

**Sections:**
1. **Executive Summary** - High-level project overview
2. **Technology Stack** - All dependencies and frameworks
3. **Database Schema** - 7 tables with complete structure and relationships
4. **AI Integration** - Gemini integration with prompts and response schemas
5. **Meal Capture & Storage** - End-to-end data flow with validation
6. **Navigation Structure** - All pages and menu layouts
7. **Reports & Analytics** - Metrics, filtering, inflammation tracking
8. **API Endpoints** - Complete REST API documentation
9. **Multi-Tenancy & Security** - Tenant isolation patterns, auth flow
10. **File Structure** - All key files with purposes
11. **Architectural Patterns** - Design patterns used throughout
12. **Environment Configuration** - Required variables and constants
13. **Enhancement Areas** - Recommendations for new features
14. **Performance Notes** - Database indexes, scaling considerations
15. **Security Audit** - Strengths and areas to review

**When to use:**
- Planning new features
- Understanding system design
- API integration
- Database schema modifications
- Performance optimization

---

### QUICK_REFERENCE.md (Developer Cheat Sheet)
**Best for:** Daily development, quick lookups, common tasks

**Sections:**
- Stack at a glance (table format)
- Database ER diagram (ASCII art)
- API endpoints quick list
- UI routes
- Key files responsibilities
- Meal capture flow (visual diagram)
- Multi-tenancy code pattern
- Gemini AI integration details
- Image processing pipeline
- Validation layers
- Reports summary
- Environment variables template
- Common development tasks
- Testing setup

**When to use:**
- Quick reference during development
- Setting up development environment
- Finding specific endpoints
- Database queries
- Common code patterns

---

## Feature Analysis by Document

### 1. What Framework/Technology Stack is Being Used?

**Document:** ARCHITECTURE_ANALYSIS.md (Section 1)
- Next.js 14.2.5 with App Router
- React 18.3.1
- TypeScript 5.6.2
- PostgreSQL with raw SQL
- Google Gemini 2.0 Flash
- NextAuth 5
- Zod validation
- Sharp image processing

**Document:** QUICK_REFERENCE.md (Stack at a Glance)
- Table format for quick reference
- All major dependencies listed

---

### 2. How Meals Are Currently Captured and Stored

**Document:** ARCHITECTURE_ANALYSIS.md (Sections 4-5)
- Capture flow with Photo/Text modes
- Frontend compression (<500KB)
- AI analysis pipeline
- User review & edit
- Atomic database transaction
- Three related tables: meals, food_items, nutrition_data

**Document:** QUICK_REFERENCE.md
- Visual meal capture flow diagram
- Database relationship diagram
- Common development tasks section

**Key Files:**
- `/app/capture/page.tsx` - UI
- `/lib/repos/meal.repo.ts` - Data persistence
- `/app/api/meals/approve/route.ts` - API endpoint

---

### 3. How AI Integration Works for Analyzing Meals

**Document:** ARCHITECTURE_ANALYSIS.md (Section 3)
- Comprehensive Gemini integration details
- Two analysis modes (text & image)
- Response schema specification
- Prompt engineering approach
- Portuguese language optimization
- Image processing pipeline

**Document:** QUICK_REFERENCE.md
- Gemini AI Integration section
- Image processing pipeline diagram
- Quality controls list

**Key Files:**
- `/lib/ai.ts` - Main AI integration
- `/app/api/meals/analyze-text/route.ts`
- `/app/api/meals/analyze-image/route.ts`

---

### 4. Current Database Schema and Data Models

**Document:** ARCHITECTURE_ANALYSIS.md (Section 2)
- All 7 tables fully documented
- Column definitions with types
- Relationships and foreign keys
- Indexes and constraints
- Data flow diagrams

**Document:** QUICK_REFERENCE.md
- ASCII ER diagram
- Table relationships visualization

**Key Files:**
- `/migrations/` - All SQL schema
- `/lib/repos/meal.repo.ts` - Data access patterns
- `/lib/schemas/meal.ts` - Zod validation

---

### 5. Menu/Navigation Structure

**Document:** ARCHITECTURE_ANALYSIS.md (Section 5)
- All pages and routes listed
- Navigation flow explained
- Dashboard component breakdown
- CTA hierarchy

**Document:** QUICK_REFERENCE.md
- UI Pages & Routes section
- Route hierarchy

**Key Files:**
- `/app/page.tsx` - Home/Dashboard
- `/app/capture/page.tsx` - Capture
- `/app/history/page.tsx` - History
- `/app/reports/page.tsx` - Reports
- `/components/AuthenticatedLayout.tsx` - Navigation wrapper

---

### 6. Reports Functionality

**Document:** ARCHITECTURE_ANALYSIS.md (Section 6)
- Period filters (7d/30d/all)
- Metrics calculated
- Data visualization approach
- Inflammation report methodology
- 40+ Portuguese keywords for detection

**Document:** QUICK_REFERENCE.md
- Reports & Analytics section
- Keyword categories

**Key Files:**
- `/app/reports/page.tsx` - Reports UI
- `/lib/reports.ts` - Inflammation logic
- `/app/api/reports/inflammation/route.ts` - API

---

### 7. Key Components and Their Relationships

**Document:** ARCHITECTURE_ANALYSIS.md (Sections 9-10)
- Complete file structure
- Component responsibilities
- Pattern descriptions
- Data flow architecture

**Document:** QUICK_REFERENCE.md
- Key files & responsibilities table
- File structure overview

**Relationships:**
```
tenants ← users ← auth
              ├─ meals ← food_items ← nutrition_data
              ├─ water_intake
              └─ bowel_movements
```

---

## How to Use This Analysis

### For Understanding the System (First Time)
1. Read QUICK_REFERENCE.md for overview
2. Review Stack at a Glance table
3. Look at database ER diagram
4. Read Meal Capture Flow
5. Then read ARCHITECTURE_ANALYSIS.md (Section 1-5)

### For Implementing New Features
1. Identify which system component is affected
2. Read relevant section in ARCHITECTURE_ANALYSIS.md
3. Reference QUICK_REFERENCE.md for common patterns
4. Review related source files
5. Check "Critical Areas for New Features" (ARCHITECTURE_ANALYSIS.md Section 12)

### For API Integration
1. Reference QUICK_REFERENCE.md "API Endpoints Summary"
2. Read full endpoint docs in ARCHITECTURE_ANALYSIS.md (Section 7)
3. Check `/app/api/` source files for exact behavior
4. Review error handling in approval endpoint (comprehensive)

### For Database Queries
1. Reference QUICK_REFERENCE.md database diagram
2. Review table structure in ARCHITECTURE_ANALYSIS.md (Section 2)
3. Check `/lib/repos/meal.repo.ts` for patterns
4. Look at migrations for constraints

### For AI/ML Integration
1. Read QUICK_REFERENCE.md Gemini section
2. Deep dive: ARCHITECTURE_ANALYSIS.md (Section 3)
3. Source: `/lib/ai.ts`
4. API endpoints: `/app/api/meals/analyze-*`

---

## Key Findings Summary

### Strengths
- Well-structured multi-tenant architecture
- Type-safe throughout (TypeScript + Zod)
- AI-powered (Portuguese-optimized Gemini)
- Atomic transactions for data consistency
- Clean separation of concerns
- Comprehensive error handling

### Areas for Enhancement
- Photo archival strategy needed
- No allergen/dietary restriction tracking
- Basic meal recommendations only
- Rate limiting on AI endpoints
- EXIF data handling
- RLS could be re-enabled

### Security Status
- Strong: Parameterized queries, bcrypt, tenant isolation
- Review needed: RLS disabled, EXIF stripping, rate limiting

### Performance Status
- Connection pooling configured
- Appropriate indexes on queries
- Image compression pipeline optimized
- Consider: Materialized views for reporting

---

## Related Documentation

Within the project, you'll find:
- `README.md` - Project overview
- `SETUP_RAPIDO.md` - Quick setup guide
- `DEPLOY.md` - Deployment instructions
- Various `PROXIMOS_PASSOS.md` - Implementation plans
- Migration files - Database schema evolution

---

## Quick Links to Key Files

**Core Business Logic:**
- `/lib/ai.ts` - Gemini integration
- `/lib/db.ts` - Database connection
- `/lib/repos/meal.repo.ts` - Meal operations
- `/lib/schemas/meal.ts` - Input validation

**API Endpoints:**
- `/app/api/meals/` - Meal operations
- `/app/api/water-intake/route.ts` - Water tracking
- `/app/api/bowel-movements/route.ts` - Health tracking
- `/app/api/reports/` - Analytics

**Frontend Pages:**
- `/app/page.tsx` - Dashboard
- `/app/capture/page.tsx` - Meal capture
- `/app/history/page.tsx` - Meal history
- `/app/reports/page.tsx` - Analytics

**Database:**
- `/migrations/` - All schema files (13 migrations)

**Configuration:**
- `auth.ts` - NextAuth setup
- `middleware.ts` - Request handling
- `next.config.mjs` - Next.js config

---

## Document Statistics

| Document | Size | Lines | Sections |
|----------|------|-------|----------|
| ARCHITECTURE_ANALYSIS.md | 20 KB | 812 | 15 |
| QUICK_REFERENCE.md | 9.7 KB | 600+ | 25+ |
| **Total** | **~30 KB** | **1400+** | **40+** |

---

## Version Information

- **Analysis Date:** October 16, 2025
- **Food Tracker Version:** 0.1.0
- **Repository:** food-tracker (main branch)
- **Status:** Production-ready multi-tenant SaaS

---

## Next Steps

1. Choose your starting document:
   - Quick learners → Start with QUICK_REFERENCE.md
   - Developers → Start with ARCHITECTURE_ANALYSIS.md Section 1-5
   - Implementers → Jump to specific sections

2. Use these docs alongside the codebase:
   - Reference during development
   - Planning architectural changes
   - Onboarding new team members
   - Feature planning and implementation

3. Keep in mind:
   - Portuguese language context
   - Multi-tenant isolation requirements
   - AI API rate limiting (not currently implemented)
   - LGPD compliance (images not stored by design)

---

**Generated with Claude Code Analysis**
**For questions or updates to this analysis, refer to the source code in `/Users/edsonferreira/projetos/food-tracker/`**
