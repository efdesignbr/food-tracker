import { getPool } from '../lib/db';

async function checkUser() {
  const pool = getPool();

  const { rows } = await pool.query(`
    SELECT u.id, u.email, u.name, u.password_hash, u.tenant_id, t.slug as tenant_slug
    FROM users u
    LEFT JOIN tenants t ON t.id = u.tenant_id
    WHERE u.email = 'contato@edsonferreira.com'
  `);

  console.log('Usuário encontrado:', rows);

  if (rows.length === 0) {
    console.log('\n❌ Usuário não existe no banco!');
  } else {
    console.log('\n✅ Usuário existe:');
    console.log('  Email:', rows[0].email);
    console.log('  Nome:', rows[0].name);
    console.log('  Tenant:', rows[0].tenant_slug);
    console.log('  Tem senha?', rows[0].password_hash ? 'Sim' : 'Não');
  }

  await pool.end();
}

checkUser().catch(console.error);
