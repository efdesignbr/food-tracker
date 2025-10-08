# RLS Fix Documentation

## Problema

Erro ao aprovar refeições em `/capture`:

```json
{
  "error": "new row violates row-level security policy",
  "diagnostics": {
    "info": {
      "current_user": "postgres",
      "app_tenant_id": "4264bdd9-4f50-4efd-b119-d7b91e5a54ce"
    }
  }
}
```

## Causa Raiz

O Supabase estava com Row-Level Security (RLS) habilitado nas tabelas:
- `meals`
- `food_items`
- `nutrition_data`
- `users`
- `tenants`

Mesmo com as migrations 006 e 007 tentando desabilitar o RLS, as **policies ainda estavam ativas** no banco. O Supabase preserva as policies mesmo quando RLS é desabilitado via `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`.

## Solução Implementada

### 1. Scripts de Diagnóstico e Correção

Criados três scripts auxiliares:

#### `scripts/fix-rls.ts`
- Verifica o status atual do RLS
- Desabilita RLS em todas as tabelas
- Testa insert para validar

#### `scripts/check-policies.ts`
- Lista todas as policies RLS existentes
- Remove todas as policies
- Valida que não há mais RLS ativo

#### `scripts/test-approve.ts`
- Simula o fluxo completo do approve
- Testa insert de meal, food_item e nutrition_data
- Valida contexto de tenant

### 2. Migration Definitiva

**`migrations/008_drop_all_rls_policies.sql`**

Remove todas as policies e desabilita RLS permanentemente:

```sql
-- Remove todas as policies
DROP POLICY IF EXISTS meals_tenant_insert ON meals;
-- ... (outras policies)

-- Desabilita RLS
ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
-- ... (outras tabelas)
```

## Como Executar

### Para aplicar o fix:

```bash
# Executar script de fix
NODE_ENV=development npx tsx scripts/fix-rls.ts

# Verificar policies
NODE_ENV=development npx tsx scripts/check-policies.ts

# Testar approve flow
NODE_ENV=development npx tsx scripts/test-approve.ts
```

### Para aplicar via migration:

```bash
# A migration será aplicada automaticamente no próximo deploy
# Ou execute manualmente:
psql $DATABASE_URL -f migrations/008_drop_all_rls_policies.sql
```

## Validação

Após aplicar o fix, o approve flow deve funcionar:

```bash
✅ Meal created
✅ Food item created
✅ Nutrition data created
✅ Transaction committed successfully!
```

## Por que não usar RLS?

Neste projeto, o isolamento multi-tenant é gerenciado em **nível de aplicação**:

1. **Contexto explícito**: Cada transação define `app.tenant_id` via `set_config()`
2. **Validação na aplicação**: O middleware valida tenant antes de qualquer query
3. **Simplicidade**: Evita complexidade de policies RLS que podem falhar silenciosamente

### Benefícios desta abordagem:

- ✅ Controle total sobre queries
- ✅ Debugging mais simples
- ✅ Sem conflitos de policies
- ✅ Performance previsível
- ✅ Compatibilidade com connection pooling

## Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-tenant Architecture Patterns](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/tenant-isolation.html)
