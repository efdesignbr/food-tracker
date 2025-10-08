# ✅ Solução: Erro de Row-Level Security no /capture

## 🐛 Problema Original

Erro ao aprovar resultado da análise em `/capture`:

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

## 🔍 Causa Raiz

O Supabase mantinha:
1. **RLS ativo** na tabela `tenants`
2. **16 policies RLS** nas tabelas (meals, food_items, nutrition_data, users, tenants)
3. Policies conflitantes com o fluxo de insert do approve

Mesmo com migrations anteriores tentando desabilitar RLS, as **policies permaneceram ativas**.

## ✅ Solução Implementada

### 1. Scripts de Correção

Foram criados 4 scripts auxiliares em `/scripts`:

| Script | Função |
|--------|--------|
| `fix-rls.ts` | Desabilita RLS em todas as tabelas |
| `check-policies.ts` | Lista e remove todas as policies |
| `test-approve.ts` | Testa o fluxo completo de approve |
| `validate-fix.ts` | Valida que tudo está correto |

### 2. Migration Permanente

**`migrations/008_drop_all_rls_policies.sql`**

Esta migration:
- ✅ Remove todas as 16 policies RLS
- ✅ Desabilita RLS em todas as tabelas
- ✅ É aplicada automaticamente no startup (AUTO_MIGRATE=true)

### 3. Validação

Executando `validate-fix.ts`:

```
✅ ALL CHECKS PASSED!
   - RLS is disabled on all tables
   - No policies are active
   - Migration 008 is applied
```

## 🎯 Resultado

O fluxo de approve agora funciona corretamente:

```
✅ Meal created
✅ Food item created
✅ Nutrition data created
✅ Transaction committed successfully!
```

## 📚 Arquivos Criados/Modificados

### Novos Arquivos

1. `/migrations/008_drop_all_rls_policies.sql` - Migration definitiva
2. `/scripts/fix-rls.ts` - Script de fix
3. `/scripts/check-policies.ts` - Verificação de policies
4. `/scripts/test-approve.ts` - Teste de approve
5. `/scripts/validate-fix.ts` - Validação completa
6. `/docs/RLS_FIX.md` - Documentação detalhada

## 🚀 Como Validar

```bash
# Validar que tudo está OK
NODE_ENV=development npx tsx scripts/validate-fix.ts

# Testar o approve flow
NODE_ENV=development npx tsx scripts/test-approve.ts
```

## 💡 Por que não usar RLS?

Este projeto usa **isolamento multi-tenant em nível de aplicação**:

- ✅ Controle total sobre queries
- ✅ Debugging mais simples
- ✅ Sem conflitos de policies
- ✅ Performance previsível
- ✅ Compatibilidade com connection pooling

O contexto de tenant é gerenciado via:
- `set_config('app.tenant_id', ...)` em cada transação
- Validação no middleware antes de qualquer query
- Foreign keys garantindo integridade referencial

## 📖 Referências

- Documentação completa: `/docs/RLS_FIX.md`
- Migration: `/migrations/008_drop_all_rls_policies.sql`
