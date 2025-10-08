#!/usr/bin/env tsx
/**
 * Test the approve endpoint flow to ensure RLS is fully resolved
 */

import { getPool } from '../lib/db';

async function testApprove() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🧪 Testing approve flow...\n');

    // Get tenant and user
    const tenantRes = await client.query('SELECT id, slug FROM tenants LIMIT 1');
    if (tenantRes.rows.length === 0) {
      console.log('❌ No tenant found');
      return;
    }
    const tenant = tenantRes.rows[0];
    console.log('✅ Found tenant:', tenant.slug);

    const userRes = await client.query('SELECT id FROM users WHERE tenant_id = $1 LIMIT 1', [tenant.id]);
    if (userRes.rows.length === 0) {
      console.log('❌ No user found for tenant');
      return;
    }
    const userId = userRes.rows[0].id;
    console.log('✅ Found user:', userId);

    // Start transaction (mimicking the approve route)
    console.log('\n🔄 Starting transaction with tenant context...');
    await client.query('BEGIN');

    // Set tenant context (like in the code)
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenant.id]);
    await client.query(`SET LOCAL app.tenant_id = '${tenant.id}'`);

    const configCheck = await client.query("SELECT current_user, current_setting('app.tenant_id', true) AS app_tenant_id");
    console.log('📊 Context:', configCheck.rows[0]);

    // Try to insert a meal
    console.log('\n📝 Inserting meal...');
    const mealRes = await client.query(
      `INSERT INTO meals (user_id, tenant_id, image_url, meal_type, consumed_at, status, notes)
       VALUES ($1, $2, $3, $4, NOW(), 'approved', $5) RETURNING *`,
      [userId, tenant.id, 'https://example.com/test.png', 'lunch', 'Test meal']
    );
    const meal = mealRes.rows[0];
    console.log('✅ Meal created:', meal.id);

    // Try to insert food_item
    console.log('\n🍎 Inserting food_item...');
    const foodRes = await client.query(
      `INSERT INTO food_items (meal_id, tenant_id, name, quantity, unit, confidence_score)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [meal.id, tenant.id, 'Arroz', 100, 'g', 0.9]
    );
    const foodItem = foodRes.rows[0];
    console.log('✅ Food item created:', foodItem.id);

    // Try to insert nutrition_data
    console.log('\n📊 Inserting nutrition_data...');
    const nutritionRes = await client.query(
      `INSERT INTO nutrition_data (food_item_id, tenant_id, calories, protein_g, carbs_g, fat_g)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [foodItem.id, tenant.id, 130, 2.7, 28, 0.3]
    );
    console.log('✅ Nutrition data created:', nutritionRes.rows[0].id);

    // Commit
    await client.query('COMMIT');
    console.log('\n✅ Transaction committed successfully!');

    console.log('\n🎉 All tests passed! The approve flow should work now.');

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during test:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.detail) console.error('Detail:', error.detail);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testApprove().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
