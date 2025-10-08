#!/usr/bin/env tsx
/**
 * Script to disable RLS on all tables to fix INSERT errors
 */

import { getPool } from '../lib/db';

async function fixRLS() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🔍 Checking current RLS status...');

    // Check current RLS status
    const rlsStatus = await client.query(`
      SELECT
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('meals', 'food_items', 'nutrition_data', 'users', 'tenants')
      ORDER BY tablename;
    `);

    console.log('\n📊 Current RLS Status:');
    console.table(rlsStatus.rows);

    // Disable RLS on all tables
    console.log('\n🔧 Disabling RLS on all tables...');

    const tables = ['meals', 'food_items', 'nutrition_data', 'users', 'tenants'];

    for (const table of tables) {
      await client.query(`ALTER TABLE IF EXISTS ${table} NO FORCE ROW LEVEL SECURITY`);
      await client.query(`ALTER TABLE IF EXISTS ${table} DISABLE ROW LEVEL SECURITY`);
      console.log(`✅ Disabled RLS on ${table}`);
    }

    // Verify new status
    const newStatus = await client.query(`
      SELECT
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('meals', 'food_items', 'nutrition_data', 'users', 'tenants')
      ORDER BY tablename;
    `);

    console.log('\n📊 New RLS Status:');
    console.table(newStatus.rows);

    // Test insert
    console.log('\n🧪 Testing insert...');
    await client.query('BEGIN');

    // Get a test user
    const userRes = await client.query(`
      SELECT id, tenant_id FROM users LIMIT 1
    `);

    if (userRes.rows.length === 0) {
      console.log('❌ No users found in database');
      await client.query('ROLLBACK');
      return;
    }

    const { id: userId, tenant_id: tenantId } = userRes.rows[0];

    try {
      const testMeal = await client.query(`
        INSERT INTO meals (user_id, tenant_id, image_url, meal_type, consumed_at, status)
        VALUES ($1, $2, $3, $4, NOW(), 'approved')
        RETURNING id
      `, [userId, tenantId, 'https://example.com/test.png', 'lunch']);

      console.log('✅ Test insert successful! Meal ID:', testMeal.rows[0].id);
      await client.query('ROLLBACK');
    } catch (e: any) {
      console.log('❌ Test insert failed:', e.message);
      await client.query('ROLLBACK');
      throw e;
    }

    console.log('\n✅ RLS fix completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixRLS().catch((error) => {
  console.error('Failed to fix RLS:', error);
  process.exit(1);
});
