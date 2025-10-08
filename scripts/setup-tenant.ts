#!/usr/bin/env tsx
/**
 * Setup real tenant with user
 * Usage: TENANT_SLUG=edson TENANT_NAME="Edson" USER_EMAIL=edson@example.com USER_NAME="Edson Ferreira" USER_PASSWORD=senha123 npx tsx scripts/setup-tenant.ts
 */

import { getPool } from '../lib/db';
import bcrypt from 'bcryptjs';

async function setupTenant() {
  const tenantSlug = process.env.TENANT_SLUG || process.argv[2];
  const tenantName = process.env.TENANT_NAME || process.argv[3];
  const userEmail = process.env.USER_EMAIL || process.argv[4];
  const userName = process.env.USER_NAME || process.argv[5];
  const userPassword = process.env.USER_PASSWORD || process.argv[6];

  if (!tenantSlug || !tenantName || !userEmail || !userName || !userPassword) {
    console.error('❌ Uso: TENANT_SLUG=slug TENANT_NAME=nome USER_EMAIL=email USER_NAME=nome USER_PASSWORD=senha npx tsx scripts/setup-tenant.ts');
    console.error('\nOu passe como argumentos:');
    console.error('  npx tsx scripts/setup-tenant.ts <slug> <tenant-name> <email> <user-name> <password>');
    process.exit(1);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('👤 Configurando tenant...\n');

    await client.query('BEGIN');

    // Check if tenant exists
    const existingTenant = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [tenantSlug]
    );

    let tenantId: string;

    if (existingTenant.rows.length > 0) {
      tenantId = existingTenant.rows[0].id;
      console.log('⚠️  Tenant já existe:', tenantId);

      // Update tenant name
      await client.query(
        'UPDATE tenants SET name = $1 WHERE id = $2',
        [tenantName, tenantId]
      );
      console.log('✅ Nome do tenant atualizado');
    } else {
      const newTenant = await client.query(
        'INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING id',
        [tenantSlug, tenantName]
      );
      tenantId = newTenant.rows[0].id;
      console.log('✅ Tenant criado:', tenantId);
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
    console.log('📋 Credenciais:');
    console.log('   Tenant:', tenantName, `(${tenantSlug})`);
    console.log('   Tenant ID:', tenantId);
    console.log('   Email:', userEmail);
    console.log('   Nome:', userName);

    if (tenantSlug !== 'default') {
      console.log('\n💡 Para usar este tenant como padrão, atualize .env.local:');
      console.log(`   DEFAULT_TENANT_SLUG=${tenantSlug}`);
    }

    console.log('\n🔐 Faça login em /login com:');
    console.log('   Email:', userEmail);
    console.log('   Senha: (a que você definiu)');

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupTenant().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
