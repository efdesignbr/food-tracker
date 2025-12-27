
import { getPool } from '../lib/db';

async function run() {
  const pool = getPool();
  const email = 'edson@foodtracker.com'; // Ajuste se seu email for diferente, vou buscar o primeiro user se falhar
  
  const client = await pool.connect();
  try {
    // 1. Pegar ID do usuário
    const userRes = await client.query(`SELECT id, email, tenant_id FROM users LIMIT 1`);
    const user = userRes.rows[0];
    console.log('Usuário encontrado:', user.email, user.id);

    // 2. Buscar em Compras (shopping_items)
    console.log('\n--- Buscando "feijão" em shopping_items ---');
    const shopRes = await client.query(`
      SELECT si.id, si.name, si.is_purchased, sl.user_id as list_owner, si.created_at
      FROM shopping_items si
      JOIN shopping_lists sl ON si.list_id = sl.id
      WHERE si.name ILIKE '%feijão%' OR si.name ILIKE '%feijao%'
    `);
    
    if (shopRes.rows.length === 0) console.log('Nenhum feijão encontrado nas compras.');
    else console.table(shopRes.rows);

    // 3. Buscar em Consumo (food_items / meals)
    console.log('\n--- Buscando "feijão" em food_items/meals ---');
    const mealRes = await client.query(`
      SELECT fi.id, fi.name, m.user_id as meal_owner, m.location_type, m.consumed_at
      FROM food_items fi
      JOIN meals m ON fi.meal_id = m.id
      WHERE (fi.name ILIKE '%feijão%' OR fi.name ILIKE '%feijao%')
      AND m.user_id = $1
    `, [user.id]);

    if (mealRes.rows.length === 0) console.log('Nenhum feijão encontrado no consumo.');
    else console.table(mealRes.rows);

  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

run();
