# 🗄️ Database Schema Documentation

Este diretório contém a documentação automática do schema do banco de dados.

## 📋 Arquivos

### `CURRENT_SCHEMA.md`
Documentação completa e **atualizada automaticamente** do schema do banco de dados, incluindo:
- ✅ Todas as tabelas
- ✅ Todas as colunas com tipos corretos
- ✅ Foreign keys
- ✅ Índices
- ✅ Políticas RLS

**⚠️ IMPORTANTE**: **SEMPRE consulte este arquivo antes de criar migrações!**

## 🔄 Como atualizar a documentação

### Opção 1: Comando npm (recomendado)
```bash
npm run db:schema
```

### Opção 2: Manualmente
```bash
npx tsx scripts/extract-schema.ts
```

### Opção 3: Com variáveis de ambiente específicas
```bash
set -a && source .env.local && set +a && npx tsx scripts/extract-schema.ts
```

## 📝 Quando atualizar?

Execute o comando `npm run db:schema` sempre que:

1. ✅ **Após aplicar uma migração** no Supabase
2. ✅ **Antes de criar uma nova migração** (para verificar o estado atual)
3. ✅ **Após modificações manuais** no banco via dashboard do Supabase
4. ✅ **Periodicamente** (pelo menos uma vez por semana) para manter atualizado

## 🛡️ Fluxo recomendado para criar migrações

### Passo 1: Consultar o schema atual
```bash
npm run db:schema
```

### Passo 2: Ver o arquivo gerado
Abra `/docs/database/CURRENT_SCHEMA.md` e verifique:
- Tipos de dados de cada coluna
- Foreign keys existentes
- Estrutura das tabelas

### Passo 3: Criar a migração
Crie o arquivo SQL em `/docs/migrations/` com os tipos corretos:
- Usar `UUID` para IDs (não `SERIAL` ou `INTEGER`)
- Usar `UUID` para foreign keys de `tenants` e `users`
- Usar `TIMESTAMP` com `DEFAULT now()` (não `CURRENT_TIMESTAMP`)

### Passo 4: Executar no Supabase
Copie e cole o SQL no dashboard do Supabase

### Passo 5: Atualizar documentação
```bash
npm run db:schema
```

## ✅ Checklist antes de criar migrações

- [ ] Executei `npm run db:schema` para ver o schema atual
- [ ] Consultei o arquivo `CURRENT_SCHEMA.md`
- [ ] Verifiquei os tipos de dados corretos (`UUID`, `TIMESTAMP`, etc.)
- [ ] Verifiquei as foreign keys existentes
- [ ] Minha migração usa os mesmos padrões do banco atual
- [ ] Testei a migração em ambiente de desenvolvimento

## 🚨 Erros comuns evitados

### ❌ Antes (com erros)
```sql
CREATE TABLE example (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),  -- ERRADO!
  user_id INTEGER REFERENCES users(id),      -- ERRADO!
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- pode dar problema
);
```

### ✅ Agora (correto)
```sql
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);
```

## 🎯 Benefícios

1. **Zero erros de tipo** em migrações
2. **Documentação sempre atualizada**
3. **Processo padronizado** para todos os desenvolvedores
4. **Economia de tempo** (não precisa adivinhar tipos)
5. **Histórico visual** do schema (via git)

---

**💡 Dica**: Adicione este comando ao seu workflow diário:
```bash
npm run db:schema
```
