/**
 * Script para extrair o schema atual do banco de dados
 *
 * Uso: npx tsx scripts/extract-schema.ts
 *
 * Este script conecta no banco de dados e extrai:
 * - Estrutura de todas as tabelas
 * - Tipos de dados de cada coluna
 * - Foreign keys e constraints
 * - Índices
 * - Políticas RLS
 *
 * O resultado é salvo em docs/database/CURRENT_SCHEMA.md
 */

import { getPool } from '../lib/db';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  udt_name: string;
}

interface ForeignKeyInfo {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  constraint_name: string;
}

interface IndexInfo {
  table_name: string;
  index_name: string;
  column_name: string;
  is_unique: boolean;
}

interface RLSPolicy {
  table_name: string;
  policy_name: string;
  command: string;
  permissive: string;
  roles: string[];
  qual: string;
  with_check: string;
}

async function extractSchema() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🔍 Extraindo schema do banco de dados...\n');

    // 1. Extrair informações das colunas
    const columnsResult = await client.query<ColumnInfo>(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    // 2. Extrair foreign keys
    const foreignKeysResult = await client.query<ForeignKeyInfo>(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);

    // 3. Extrair índices
    const indexesResult = await client.query<IndexInfo>(`
      SELECT
        t.relname AS table_name,
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relkind = 'r'
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND i.relname NOT LIKE '%_pkey'
      ORDER BY t.relname, i.relname
    `);

    // 4. Extrair políticas RLS
    const rlsPoliciesResult = await client.query<RLSPolicy>(`
      SELECT
        schemaname || '.' || tablename AS table_name,
        policyname AS policy_name,
        cmd AS command,
        permissive,
        roles,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);

    // Organizar dados por tabela
    const tables = new Map<string, any>();

    columnsResult.rows.forEach(col => {
      if (!tables.has(col.table_name)) {
        tables.set(col.table_name, {
          name: col.table_name,
          columns: [],
          foreignKeys: [],
          indexes: [],
          rlsPolicies: []
        });
      }
      tables.get(col.table_name)!.columns.push(col);
    });

    foreignKeysResult.rows.forEach(fk => {
      if (tables.has(fk.table_name)) {
        tables.get(fk.table_name)!.foreignKeys.push(fk);
      }
    });

    indexesResult.rows.forEach(idx => {
      if (tables.has(idx.table_name)) {
        tables.get(idx.table_name)!.indexes.push(idx);
      }
    });

    rlsPoliciesResult.rows.forEach(policy => {
      const tableName = policy.table_name.split('.')[1];
      if (tables.has(tableName)) {
        tables.get(tableName)!.rlsPolicies.push(policy);
      }
    });

    // Gerar documentação em Markdown
    let markdown = `# 🗄️ DATABASE SCHEMA - Food Tracker\n\n`;
    markdown += `**Gerado automaticamente em**: ${new Date().toLocaleString('pt-BR')}\n\n`;
    markdown += `**⚠️ IMPORTANTE**: Este arquivo é gerado automaticamente. Sempre consulte este arquivo antes de criar migrações!\n\n`;
    markdown += `---\n\n`;
    markdown += `## 📊 Resumo\n\n`;
    markdown += `- **Total de tabelas**: ${tables.size}\n`;
    markdown += `- **Total de colunas**: ${columnsResult.rows.length}\n`;
    markdown += `- **Total de foreign keys**: ${foreignKeysResult.rows.length}\n`;
    markdown += `- **Total de índices**: ${indexesResult.rows.length}\n`;
    markdown += `- **Total de políticas RLS**: ${rlsPoliciesResult.rows.length}\n\n`;
    markdown += `---\n\n`;
    markdown += `## 📋 Tabelas\n\n`;

    // Para cada tabela
    Array.from(tables.values()).sort((a, b) => a.name.localeCompare(b.name)).forEach(table => {
      markdown += `### \`${table.name}\`\n\n`;

      // Colunas
      markdown += `#### Colunas\n\n`;
      markdown += `| Coluna | Tipo | Nullable | Default | Tipo Real |\n`;
      markdown += `|--------|------|----------|---------|----------|\n`;
      table.columns.forEach((col: ColumnInfo) => {
        const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
        const defaultValue = col.column_default || '-';
        markdown += `| \`${col.column_name}\` | \`${col.data_type}\` | ${nullable} | \`${defaultValue}\` | \`${col.udt_name}\` |\n`;
      });
      markdown += `\n`;

      // Foreign Keys
      if (table.foreignKeys.length > 0) {
        markdown += `#### Foreign Keys\n\n`;
        markdown += `| Coluna | Referencia | Constraint |\n`;
        markdown += `|--------|------------|------------|\n`;
        table.foreignKeys.forEach((fk: ForeignKeyInfo) => {
          markdown += `| \`${fk.column_name}\` | \`${fk.foreign_table_name}.${fk.foreign_column_name}\` | \`${fk.constraint_name}\` |\n`;
        });
        markdown += `\n`;
      }

      // Índices
      if (table.indexes.length > 0) {
        markdown += `#### Índices\n\n`;
        markdown += `| Nome | Coluna | Único |\n`;
        markdown += `|------|--------|-------|\n`;
        const uniqueIndexes = new Set();
        table.indexes.forEach((idx: IndexInfo) => {
          const key = `${idx.index_name}-${idx.column_name}`;
          if (!uniqueIndexes.has(key)) {
            uniqueIndexes.add(key);
            const isUnique = idx.is_unique ? '✅' : '❌';
            markdown += `| \`${idx.index_name}\` | \`${idx.column_name}\` | ${isUnique} |\n`;
          }
        });
        markdown += `\n`;
      }

      // Políticas RLS
      if (table.rlsPolicies.length > 0) {
        markdown += `#### Políticas RLS\n\n`;
        table.rlsPolicies.forEach((policy: RLSPolicy) => {
          markdown += `**${policy.policy_name}**\n`;
          markdown += `- **Comando**: \`${policy.command}\`\n`;
          markdown += `- **Permissive**: \`${policy.permissive}\`\n`;
          markdown += `- **Roles**: \`${policy.roles.join(', ')}\`\n`;
          if (policy.qual) markdown += `- **Condição**: \`${policy.qual}\`\n`;
          if (policy.with_check) markdown += `- **With Check**: \`${policy.with_check}\`\n`;
          markdown += `\n`;
        });
      }

      markdown += `---\n\n`;
    });

    // Criar diretório se não existir
    const docsDir = join(process.cwd(), 'docs', 'database');
    mkdirSync(docsDir, { recursive: true });

    // Salvar arquivo
    const outputPath = join(docsDir, 'CURRENT_SCHEMA.md');
    writeFileSync(outputPath, markdown, 'utf-8');

    console.log('✅ Schema extraído com sucesso!');
    console.log(`📄 Arquivo salvo em: ${outputPath}`);
    console.log(`\n📊 Estatísticas:`);
    console.log(`   - ${tables.size} tabelas`);
    console.log(`   - ${columnsResult.rows.length} colunas`);
    console.log(`   - ${foreignKeysResult.rows.length} foreign keys`);
    console.log(`   - ${indexesResult.rows.length} índices`);
    console.log(`   - ${rlsPoliciesResult.rows.length} políticas RLS`);

  } catch (error) {
    console.error('❌ Erro ao extrair schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
extractSchema().catch(console.error);
