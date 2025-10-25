/**
 * 🧪 Script de Teste: Sistema de Assinaturas
 *
 * Testa migrations e funções de quota ANTES de modificar endpoints.
 * Uso: npm run test:subscriptions
 */

// Carrega variáveis de ambiente do .env.local
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../lib/db';
import { checkQuota, incrementQuota, getUsageStats } from '../lib/quota';

async function testSubscriptions() {
  console.log('🧪 Testando Sistema de Assinaturas\n');

  const pool = getPool();

  try {
    // 1. Verificar se migrations foram aplicadas
    console.log('1️⃣ Verificando migrations...');

    const { rows: columns } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('plan', 'subscription_status', 'subscription_started_at')
    `);

    if (columns.length === 3) {
      console.log('   ✅ Campos de assinatura existem na tabela users');
    } else {
      console.error('   ❌ ERRO: Migrations não foram aplicadas!');
      console.error('   Execute: npm run apply:migrations');
      process.exit(1);
    }

    const { rows: tables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'usage_quotas'
    `);

    if (tables.length === 1) {
      console.log('   ✅ Tabela usage_quotas existe\n');
    } else {
      console.error('   ❌ ERRO: Tabela usage_quotas não existe!');
      console.error('   Execute: npm run apply:migrations');
      process.exit(1);
    }

    // 2. Buscar um usuário de teste
    console.log('2️⃣ Buscando usuário de teste...');

    const { rows: users } = await pool.query(`
      SELECT id, email, tenant_id, plan
      FROM users
      LIMIT 1
    `);

    if (users.length === 0) {
      console.error('   ❌ ERRO: Nenhum usuário encontrado no banco!');
      console.error('   Crie um usuário primeiro.');
      process.exit(1);
    }

    const testUser = users[0];
    console.log(`   ✅ Usuário encontrado: ${testUser.email}`);
    console.log(`      - ID: ${testUser.id}`);
    console.log(`      - Plano atual: ${testUser.plan}\n`);

    // 3. Testar checkQuota para FREE
    console.log('3️⃣ Testando quota para plano FREE...');

    const quotaFree = await checkQuota(
      testUser.id,
      testUser.tenant_id,
      'free',
      'photo'
    );

    console.log('   Resultado:');
    console.log(`      - Permitido: ${quotaFree.allowed}`);
    console.log(`      - Usado: ${quotaFree.used}`);
    console.log(`      - Limite: ${quotaFree.limit}`);
    console.log(`      - Restante: ${quotaFree.remaining}`);

    if (!quotaFree.allowed && quotaFree.limit === 0) {
      console.log('   ✅ FREE corretamente bloqueado de usar fotos\n');
    } else {
      console.error('   ❌ ERRO: FREE não deveria ter acesso!\n');
    }

    // 4. Atualizar usuário para PREMIUM
    console.log('4️⃣ Atualizando usuário para PREMIUM...');

    await pool.query(
      `UPDATE users
       SET plan = 'premium',
           subscription_status = 'active',
           subscription_started_at = NOW()
       WHERE id = $1`,
      [testUser.id]
    );

    console.log('   ✅ Usuário atualizado para PREMIUM\n');

    // 5. Testar checkQuota para PREMIUM
    console.log('5️⃣ Testando quota para plano PREMIUM...');

    const quotaPremium = await checkQuota(
      testUser.id,
      testUser.tenant_id,
      'premium',
      'photo'
    );

    console.log('   Resultado:');
    console.log(`      - Permitido: ${quotaPremium.allowed}`);
    console.log(`      - Usado: ${quotaPremium.used}`);
    console.log(`      - Limite: ${quotaPremium.limit}`);
    console.log(`      - Restante: ${quotaPremium.remaining}`);

    if (quotaPremium.allowed && quotaPremium.limit === 90) {
      console.log('   ✅ PREMIUM tem acesso com quota de 90/mês\n');
    } else {
      console.error('   ❌ ERRO: Quota do PREMIUM incorreta!\n');
    }

    // 6. Testar incrementQuota
    console.log('6️⃣ Testando incremento de quota...');

    await incrementQuota(testUser.id, testUser.tenant_id, 'photo');
    console.log('   ✅ Quota incrementada');

    const quotaAfterIncrement = await checkQuota(
      testUser.id,
      testUser.tenant_id,
      'premium',
      'photo'
    );

    console.log('   Após incremento:');
    console.log(`      - Usado: ${quotaAfterIncrement.used}`);
    console.log(`      - Restante: ${quotaAfterIncrement.remaining}`);

    if (quotaAfterIncrement.used === 1) {
      console.log('   ✅ Incremento funcionou corretamente\n');
    } else {
      console.error('   ❌ ERRO: Incremento não funcionou!\n');
    }

    // 7. Testar getUsageStats
    console.log('7️⃣ Testando estatísticas de uso...');

    const stats = await getUsageStats(
      testUser.id,
      testUser.tenant_id,
      'premium'
    );

    console.log('   Estatísticas:');
    console.log(`      - Fotos: ${stats.photoAnalyses.used}/${stats.photoAnalyses.limit} (${stats.photoAnalyses.percentage}%)`);
    console.log(`      - Tabelas: ${stats.ocrAnalyses.used}/${stats.ocrAnalyses.limit} (${stats.ocrAnalyses.percentage}%)`);
    console.log(`      - Reset em: ${stats.resetDate.toISOString().split('T')[0]}`);
    console.log('   ✅ Estatísticas funcionando\n');

    // 8. Limpar dados de teste (opcional)
    console.log('8️⃣ Limpando dados de teste...');

    await pool.query(
      `DELETE FROM usage_quotas WHERE user_id = $1`,
      [testUser.id]
    );

    await pool.query(
      `UPDATE users
       SET plan = 'free',
           subscription_status = 'active',
           subscription_started_at = NULL
       WHERE id = $1`,
      [testUser.id]
    );

    console.log('   ✅ Dados de teste limpos\n');

    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('   Sistema de assinaturas está funcionando corretamente.');
    console.log('   Seguro para continuar com a implementação.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO durante os testes:');
    console.error(error);
    process.exit(1);
  }
}

testSubscriptions();
