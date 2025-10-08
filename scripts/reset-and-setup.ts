#!/usr/bin/env tsx
/**
 * Reset food data and setup real tenant
 */

import { getPool } from '../lib/db';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function resetAndSetup() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🗑️  Limpando dados de alimentação...\n');

    await client.query('BEGIN');

    // Delete all food data
    const deletedNutrition = await client.query('DELETE FROM nutrition_data RETURNING id');
    console.log(`✅ Deletados ${deletedNutrition.rowCount} registros de nutrition_data`);

    const deletedFoodItems = await client.query('DELETE FROM food_items RETURNING id');
    console.log(`✅ Deletados ${deletedFoodItems.rowCount} registros de food_items`);

    const deletedMeals = await client.query('DELETE FROM meals RETURNING id');
    console.log(`✅ Deletados ${deletedMeals.rowCount} registros de meals`);

    await client.query('COMMIT');

    console.log('\n✅ Dados de alimentação limpos com sucesso!\n');

    // Setup real tenant
    console.log('👤 Configurando tenant real...\n');

    const tenantSlug = await question('Slug do tenant (ex: edson): ');
    const tenantName = await question('Nome do tenant (ex: Edson Ferreira): ');
    const userEmail = await question('Seu email: ');
    const userName = await question('Seu nome completo: ');
    const userPassword = await question('Sua senha: ');

    await client.query('BEGIN');

    // Check if tenant exists
    const existingTenant = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [tenantSlug]
    );

    let tenantId: string;

    if (existingTenant.rows.length > 0) {
      tenantId = existingTenant.rows[0].id;
      console.log('\n⚠️  Tenant já existe:', tenantId);
    } else {
      const newTenant = await client.query(
        'INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING id',
        [tenantSlug, tenantName]
      );
      tenantId = newTenant.rows[0].id;
      console.log('\n✅ Tenant criado:', tenantId);
    }

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [userEmail, tenantId]
    );

    const passwordHash = bcrypt.hashSync(userPassword, 10);

    if (existingUser.rows.length > 0) {
      // Update existing user
      await client.query(
        'UPDATE users SET name = $1, password_hash = $2, role = $3 WHERE id = $4',
        [userName, passwordHash, 'owner', existingUser.rows[0].id]
      );
      console.log('✅ Usuário atualizado:', existingUser.rows[0].id);
    } else {
      // Create new user
      const newUser = await client.query(
        'INSERT INTO users (email, name, password_hash, tenant_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userEmail, userName, passwordHash, tenantId, 'owner']
      );
      console.log('✅ Usuário criado:', newUser.rows[0].id);
    }

    await client.query('COMMIT');

    console.log('\n🎉 Setup completo!\n');
    console.log('📋 Dados:');
    console.log('   Tenant:', tenantName, `(${tenantSlug})`);
    console.log('   Email:', userEmail);
    console.log('   Tenant ID:', tenantId);
    console.log('\n💡 Para fazer login, use:');
    console.log('   Email:', userEmail);
    console.log('   Senha:', '***');

    if (tenantSlug !== 'default') {
      console.log('\n⚠️  Atualize o .env.local:');
      console.log(`   DEFAULT_TENANT_SLUG=${tenantSlug}`);
    }

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
    rl.close();
  }
}

resetAndSetup().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
