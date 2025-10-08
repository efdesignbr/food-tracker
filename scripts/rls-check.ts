import { config } from 'dotenv';
import { getPool } from '../lib/db';

config({ path: './.env.local' });

async function main() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tenantSlug = process.env.DEFAULT_TENANT_SLUG || 'default';
    const t = await client.query('SELECT id, slug FROM tenants WHERE slug = $1', [tenantSlug]);
    if (t.rows.length === 0) throw new Error('tenant not found');
    const tenantId = t.rows[0].id as string;
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const info = await client.query("SELECT current_user, session_user, current_setting('app.tenant_id', true) AS app_tenant_id");
    const rls = await client.query(`
      SELECT c.relname, c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname IN ('tenants','users','meals','food_items','nutrition_data')
    `);
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, cmd, roles, permissive, qual, with_check
      FROM pg_policies
      WHERE schemaname='public' AND tablename IN ('users','meals','food_items','nutrition_data')
      ORDER BY tablename, policyname
    `);
    const u = await client.query('SELECT id FROM users WHERE tenant_id = $1 LIMIT 1', [tenantId]);
    let dummy: any = { meal: null, food_item: null, nutrition: null };
    if (u.rows.length) {
      await client.query('SAVEPOINT sp');
      try {
        const ins = await client.query(
          `INSERT INTO meals (user_id, tenant_id, image_url, meal_type, consumed_at, status)
           VALUES ($1,$2,$3,$4,NOW(),'approved') RETURNING id`,
          [u.rows[0].id, tenantId, 'https://example.com/test.png', 'lunch']
        );
        const mealId = ins.rows[0].id;
        dummy.meal = { ok: true, id: mealId };
        try {
          const fi = await client.query(
            `INSERT INTO food_items (meal_id, tenant_id, name, quantity, unit)
             VALUES ($1,$2,$3,$4,$5) RETURNING id`,
            [mealId, tenantId, 'teste item', 1, 'un']
          );
          dummy.food_item = { ok: true, id: fi.rows[0].id };
          try {
            const nd = await client.query(
              `INSERT INTO nutrition_data (food_item_id, tenant_id, calories)
               VALUES ($1,$2,$3) RETURNING id`,
              [fi.rows[0].id, tenantId, 10]
            );
            dummy.nutrition = { ok: true, id: nd.rows[0].id };
          } catch (e: any) {
            dummy.nutrition = { ok: false, code: e.code, message: e.message, detail: e.detail };
          }
        } catch (e: any) {
          dummy.food_item = { ok: false, code: e.code, message: e.message, detail: e.detail };
        }
      } catch (e: any) {
        dummy.meal = { ok: false, code: e.code, message: e.message, detail: e.detail, hint: e.hint, routine: e.routine };
      } finally {
        await client.query('ROLLBACK TO SAVEPOINT sp');
      }
    }
    await client.query('COMMIT');
    console.log(JSON.stringify({ info: info.rows[0], rls: rls.rows, policies: policies.rows, dummy }, null, 2));
  } finally {
    client.release();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
