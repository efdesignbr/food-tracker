#!/usr/bin/env tsx
/**
 * Validate that the RLS fix is properly applied
 */

import { getPool } from '../lib/db';

async function validate() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🔍 Validating RLS fix...\n');

    // Check RLS status
    const rlsStatus = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('meals', 'food_items', 'nutrition_data', 'users', 'tenants')
      ORDER BY tablename;
    `);

    const hasRLSEnabled = rlsStatus.rows.some(r => r.rowsecurity === true);

    console.log('📊 RLS Status:');
    console.table(rlsStatus.rows);

    // Check policies
    const policies = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public';
    `);

    console.log('\n📋 Policies count:', policies.rows[0].count);

    // Check migration
    const migration = await client.query(`
      SELECT * FROM schema_migrations
      WHERE name = '008_drop_all_rls_policies.sql';
    `);

    const migrationApplied = migration.rows.length > 0;

    console.log('\n📦 Migration 008 applied:', migrationApplied ? '✅ Yes' : '❌ No');
    if (migrationApplied) {
      console.log('   Applied at:', migration.rows[0].applied_at);
    }

    // Final verdict
    console.log('\n' + '='.repeat(50));
    if (!hasRLSEnabled && policies.rows[0].count === '0' && migrationApplied) {
      console.log('✅ ALL CHECKS PASSED!');
      console.log('   - RLS is disabled on all tables');
      console.log('   - No policies are active');
      console.log('   - Migration 008 is applied');
      console.log('\n🎉 The approve flow should work correctly now!');
    } else {
      console.log('⚠️  ISSUES FOUND:');
      if (hasRLSEnabled) console.log('   ❌ RLS is still enabled on some tables');
      if (policies.rows[0].count !== '0') console.log('   ❌ Policies are still active');
      if (!migrationApplied) console.log('   ❌ Migration 008 not applied');
      console.log('\n💡 Run: npm run dev (restart server to apply migrations)');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

validate().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
