# Food Tracker — Next.js (web/)

Este diretório contém o app Next.js fullstack (App Router) com suporte a multi-tenant por subdomínio ou header em dev.

## Desenvolvimento

- Node 18+.
- Copie `.env.example` para `.env.local` e preencha as variáveis.
- Com dependências instaladas, rode `npm run dev`.

## Tenancy

- Produção: subdomínio (`acme.app.seudominio.com`) detectado no `middleware.ts`.
- Dev: defina `X-Tenant-Slug` (algumas telas permitem informar o tenant manualmente).

## Estrutura

- `app/` — páginas e APIs (`app/api/*`).
- `lib/` — utilitários (`db`, `tenant`, `schemas`).
- `migrations/` — SQL para criação de tenants e adição de `tenant_id`.

## Rotas API (stubs)

As rotas principais estão criadas e retornam `501 not_implemented` até integração com DB/IA/Storage:

- `POST /api/meals/analyze-image`
- `POST /api/meals/analyze-text`
- `POST /api/meals/approve`
- `GET  /api/meals/history?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET  /api/reports/inflammation?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

## Próximos passos

- Integrar Supabase Storage e Anthropic nos handlers (parcialmente implementado).
- Implementar persistência real no Postgres filtrando por `tenant_id` (approve/history já preparados).
- Adicionar autenticação (NextAuth) e RBAC conforme `docs/ARQUITETURA_NEXT_MULTI_TENANT.md` (rotas protegidas).

## Bootstrap (dev)

1. Rode as migrations do diretório `web/migrations` no seu banco (na mesma base do backend, se for o caso).
2. Faça o bootstrap do tenant default (apenas dev):
   - `POST /api/dev/bootstrap` cria o tenant `DEFAULT_TENANT_SLUG` e associa registros órfãos.
3. Crie um usuário com `tenant_id` do default e defina `password_hash` (bcrypt). Exemplo SQL:
   ```sql
   UPDATE users SET tenant_id = '<TENANT_ID>', password_hash = '$2a$10$...'
   WHERE email = 'user@foodtracker.local';
   ```
   Gere um hash com bcrypt (custo 10). Ex.: `node -e "console.log(require('bcryptjs').hashSync('senha123', 10))"`.

## Autenticação

- Endpoint NextAuth: `POST /api/auth/callback/credentials` com headers de tenant.
- Cabeçalho de tenant é validado nos callbacks; a sessão inclui `tenantId`, `tenantSlug`, `role`.
 - Em dev, use a página ` /login` (envie também o `tenant`).
