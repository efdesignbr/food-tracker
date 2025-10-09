# 📋 Plano de Implementação: Sistema de Cadastro de Tenants

**Data:** 2025-10-09
**Status:** Planejamento aprovado
**Prioridade:** Próxima feature (v1.0)

---

## 🎯 **Objetivo**

Permitir que novos usuários se cadastrem **publicamente** e criem suas próprias contas (tenants), sem precisar de scripts manuais.

---

## 🏗️ **Arquitetura Proposta (Versão Simplificada)**

### **1. Rota Pública de Signup**

**Arquivo:** `/app/signup/page.tsx` (novo)

**Campos do formulário:**
- 👤 Nome completo
- 📧 Email
- 🔒 Senha (mínimo 8 caracteres)
- 🏢 Nome da empresa/conta (opcional - usa nome se vazio)

**Fluxo:**
1. Usuário preenche form
2. Submit → POST `/api/auth/signup`
3. Backend cria **tenant + user owner** em transação atômica
4. Auto-login (via NextAuth)
5. Redirect para home (onboarding opcional futuro)

---

### **2. API de Signup**

**Arquivo:** `/app/api/auth/signup/route.ts` (novo)

**Validações:**
- Email único (não pode existir em nenhum tenant)
- Senha forte (mínimo 8 chars)
- Tenant slug único (gerado auto: `empresa-xyz-abc123`)

**Processo:**
```typescript
BEGIN TRANSACTION
  1. Criar tenant:
     - slug: auto-gerado (nome + random)
     - name: "Nome da Empresa"
     - status: 'active' (sem trial por enquanto)
     - ai_requests_limit: 50 (free tier) - FUTURO

  2. Criar user:
     - tenant_id: do tenant criado
     - role: 'owner'
     - password_hash: bcrypt
     - goal_calories: 2000 (default)
     - goal_protein_g: 150 (default)
     - goal_carbs_g: 250 (default)
     - goal_fat_g: 65 (default)
     - goal_water_ml: 2000 (default)

  3. Se algum falhar → ROLLBACK
COMMIT
```

**Resposta:**
- Sucesso: `{ ok: true, tenantId, userId }`
- Erro: `{ error: "Email já cadastrado" }` ou outro erro

---

### **3. Modificações Necessárias**

#### **3.1. Página de Login - Adicionar link para Signup**

**Arquivo:** `/app/login/page.tsx` (modificar)

**Mudança:** Adicionar link/botão abaixo do form:
```jsx
<p style={{ textAlign: 'center', marginTop: 16, color: '#666', fontSize: 14 }}>
  Não tem conta? {' '}
  <a
    href="/signup"
    style={{
      color: '#2196F3',
      fontWeight: 600,
      textDecoration: 'none'
    }}
  >
    Criar conta grátis
  </a>
</p>
```

**Risco:** ⚠️ **ZERO** - apenas adiciona link, não muda lógica existente

---

#### **3.2. Middleware - Liberar rota /signup**

**Arquivo:** `/middleware.ts` (modificar)

**Mudança:** Adicionar `/signup` e `/api/auth/signup` na lista de rotas públicas:
```typescript
// Rotas públicas que não requerem auth
const publicRoutes = [
  '/login',
  '/signup',
  '/api/auth/signin',
  '/api/auth/signup'
];

// No matcher do middleware, verificar se a rota é pública
if (publicRoutes.some(route => pathname.startsWith(route))) {
  return NextResponse.next();
}
```

**Risco:** ⚠️ **ZERO** - apenas permite acesso à nova rota

---

#### **3.3. Tabela tenants - Campos opcionais**

**Situação atual:** Tenants já têm estrutura básica funcionando

**Mudança:** **NENHUMA POR ENQUANTO**
- Não precisa modificar schema
- Sistema de billing/limits fica para Fase 2
- Por enquanto, todos tenants são "free" (50 requests/mês já seria suficiente)

**Risco:** ⚠️ **ZERO** - não toca no banco

---

### **4. Segurança**

#### **4.1. Rate Limiting**
**Proteção:** Limitar cadastros por IP (ex: 3 por hora)
**Implementação:** Middleware simples ou usar Vercel Rate Limit
**Fase:** 2 (opcional)

#### **4.2. Email Verification**
**Por enquanto:** Cadastro direto (sem verificação)
**Futuro:** Enviar email de confirmação
**Fase:** 2 (opcional)

#### **4.3. Validações Backend**
- Email válido (regex)
- Senha mínima 8 chars
- Slug único (auto-check no INSERT com retry)
- Transação atômica (se tenant falhar, user não é criado)
- Sanitização de inputs

---

## 📂 **Estrutura de Arquivos**

```
app/
  signup/
    page.tsx          ← Novo (form de cadastro)

  api/
    auth/
      signup/
        route.ts      ← Novo (POST handler)

  login/
    page.tsx          ← Modificar (adicionar link signup)

middleware.ts         ← Modificar (liberar /signup e /api/auth/signup)
```

**Total:** 2 arquivos novos + 2 modificações mínimas

---

## 🔒 **Pontos de Atenção (Não Quebrar)**

### ✅ **O que NÃO mudar:**
1. **Sistema de auth atual** (NextAuth) - apenas adiciona rota
2. **Estrutura de tenants/users** - usa tabelas como estão
3. **Fluxo de login existente** - não toca
4. **Lógica de sessão** - mantém igual
5. **Migrations antigas** - não altera
6. **Rota /api/auth/signin** - NextAuth continua usando
7. **Scripts existentes** (`setup-tenant.ts`) - continuam funcionando

### ⚠️ **Cuidados especiais:**
1. **Email único global** - verificar em ALL tenants (não só no tenant atual)
2. **Transação atômica** - criar tenant + user juntos ou rollback completo
3. **Auto-login após signup** - usar `signIn()` do NextAuth após criação
4. **Slug collision** - adicionar random suffix se nome já existe
5. **Sanitização** - remover caracteres especiais do slug
6. **Password hash** - usar bcrypt com salt 10 (igual login atual)

---

## 🧪 **Testes Necessários**

**Cenários a validar:**

### Signup
1. ✅ Cadastro bem-sucedido → tenant + user criados
2. ✅ Email duplicado → erro "Email já cadastrado"
3. ✅ Tenant slug duplicado → auto-gera novo slug com suffix
4. ✅ Senha fraca → erro "Senha deve ter no mínimo 8 caracteres"
5. ✅ Auto-login funciona após signup
6. ✅ Campos opcionais (empresa) funcionam
7. ✅ Goals padrão são criados corretamente

### Regressão
8. ✅ Login existente continua funcionando (não quebrou)
9. ✅ Tenants existentes continuam funcionando
10. ✅ Logout/login normal não afetado
11. ✅ Middleware protege rotas corretas
12. ✅ Multi-tenancy continua isolado

---

## 📊 **Complexidade vs Risco**

| Componente | Complexidade | Risco de Quebrar | Justificativa |
|------------|--------------|------------------|---------------|
| `/signup/page.tsx` | 🟢 Baixa | 🟢 Zero | Arquivo novo, isolado |
| `/api/auth/signup` | 🟡 Média | 🟢 Baixa | Usa lógica similar a `setup-tenant.ts` |
| Link em `/login` | 🟢 Trivial | 🟢 Zero | Apenas HTML |
| Middleware route | 🟢 Trivial | 🟢 Zero | Adiciona items em array |

**Veredicto:** ✅ **Implementação segura e de baixo risco**

---

## 🚀 **Implementação Sugerida (Ordem)**

### **Fase 1: Backend Primeiro (mais seguro)**
1. ✅ Criar `/app/api/auth/signup/route.ts`
2. ✅ Implementar lógica de criação (tenant + user)
3. ✅ Testar via Postman/curl (sem UI)
4. ✅ Validar transação atômica
5. ✅ Validar rollback em caso de erro
6. ✅ Testar geração de slug único

### **Fase 2: Frontend**
7. ✅ Criar `/app/signup/page.tsx`
8. ✅ Implementar form com validações client-side
9. ✅ Adicionar link em `/login/page.tsx`
10. ✅ Modificar `/middleware.ts`

### **Fase 3: Testes End-to-End**
11. ✅ Cadastro completo via UI
12. ✅ Login com conta nova
13. ✅ Verificar isolamento entre tenants
14. ✅ Testar erros (email duplicado, etc)
15. ✅ Testar regressão (login antigo)

---

## 💡 **Melhorias Futuras (Opcional - Não fazer agora)**

**Deixar preparado para Fase 2:**
1. Email de boas-vindas (SendGrid/Resend)
2. Sistema de trials (7 dias)
3. Verificação de email (link de confirmação)
4. Rate limiting por IP (anti-spam)
5. Captcha anti-bot (hCaptcha/reCAPTCHA)
6. Dashboard de billing/uso
7. Onboarding wizard (tour inicial)

---

## 📝 **Detalhes de Implementação**

### **Geração de Slug Único**

```typescript
function generateSlug(name: string): string {
  // 1. Lowercase e remover acentos
  let slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 2. Substituir espaços e caracteres especiais por hífen
  slug = slug.replace(/[^a-z0-9]+/g, '-');

  // 3. Remover hífens no início/fim
  slug = slug.replace(/^-+|-+$/g, '');

  // 4. Adicionar sufixo aleatório para garantir unicidade
  const random = Math.random().toString(36).substring(2, 8);
  slug = `${slug}-${random}`;

  return slug;
}

// Exemplo: "Minha Empresa" → "minha-empresa-a7f3x2"
```

### **Validação de Email**

```typescript
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### **Verificação de Email Único**

```typescript
async function isEmailUnique(email: string): Promise<boolean> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );
  return rows.length === 0;
}
```

---

## 🎯 **Resumo Executivo**

**Proposta:** Criar signup público simples para v1.0

**Arquivos novos:** 2
- `/app/signup/page.tsx` - Form de cadastro
- `/app/api/auth/signup/route.ts` - Handler backend

**Arquivos modificados:** 2
- `/app/login/page.tsx` - Adicionar link "Criar conta"
- `/middleware.ts` - Liberar rotas /signup e /api/auth/signup

**Risco de quebrar:** 🟢 **Muito baixo**
- Não toca em auth existente (NextAuth)
- Não modifica schema do banco
- Usa mesma lógica do script `setup-tenant.ts` (já testado em produção)
- Transação atômica garante consistência
- Rotas isoladas (não afeta fluxo atual)

**Tempo estimado:** 2-3 horas
- Backend: 1 hora
- Frontend: 1 hora
- Testes: 30-60 min

**Dependências:** Nenhuma (usa stack atual)

**Pré-requisitos:** Nenhum (banco já está pronto)

---

## 🔗 **Referências**

- Script atual: `/scripts/setup-tenant.ts`
- Auth config: `/auth.ts`
- Middleware: `/middleware.ts`
- Login page: `/app/login/page.tsx`
- Plano completo de billing: `/SIGNUP_BILLING_PLAN.md`

---

## ✅ **Checklist de Aceitação**

Antes de considerar concluído:

- [ ] Cadastro via UI funciona
- [ ] Email duplicado é rejeitado
- [ ] Slug é gerado corretamente
- [ ] Transação é atômica (rollback em erro)
- [ ] Auto-login após signup funciona
- [ ] Link na página de login aparece
- [ ] Middleware libera rotas públicas
- [ ] Login existente não foi afetado
- [ ] Tenants ficam isolados entre si
- [ ] Goals padrão são criados

---

**Criado por:** Claude Code
**Última atualização:** 2025-10-09 17:30
**Próximo passo:** Aguardar aprovação para implementar
