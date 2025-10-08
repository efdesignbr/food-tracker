import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

async function setupProduction() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('🚀 Configurando produção...\n');

  try {
    // Criar tenant
    console.log('1️⃣ Criando tenant "edsonferreira"...');
    const tenantResult = await pool.query(
      `INSERT INTO tenants (slug, name)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = $2
       RETURNING id, slug, name`,
      ['edsonferreira', 'Edson Ferreira']
    );
    const tenant = tenantResult.rows[0];
    console.log('   ✅ Tenant:', tenant.slug);

    // Criar usuário
    console.log('\n2️⃣ Criando usuário...');
    const email = 'contato@edsonferreira.com';
    const password = '@Efdg0586';
    const passwordHash = bcrypt.hashSync(password, 10);

    await pool.query(
      `INSERT INTO users (tenant_id, email, name, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, email)
       DO UPDATE SET password_hash = $4, name = $3, role = $5`,
      [tenant.id, email, 'Edson Ferreira', passwordHash, 'owner']
    );

    console.log('   ✅ Usuário:', email);
    console.log('   ✅ Senha:', password);

    console.log('\n✅ Produção configurada com sucesso!');
    console.log('\n📝 Credenciais:');
    console.log('   Email:', email);
    console.log('   Senha:', password);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

setupProduction();
