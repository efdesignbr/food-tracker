#!/usr/bin/env tsx
/**
 * Check for any remaining RLS policies that might still be causing issues
 */

import { getPool } from '../lib/db';

async function checkPolicies() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🔍 Checking for existing RLS policies...\n');

    const policies = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    if (policies.rows.length === 0) {
      console.log('✅ No RLS policies found.');
    } else {
      console.log('📋 Found RLS policies:');
      console.table(policies.rows.map(p => ({
        table: p.tablename,
        policy: p.policyname,
        cmd: p.cmd,
        roles: p.roles
      })));

      console.log('\n🗑️  Dropping all policies...');
      for (const policy of policies.rows) {
        await client.query(`DROP POLICY IF EXISTS ${policy.policyname} ON ${policy.tablename}`);
        console.log(`✅ Dropped ${policy.policyname} on ${policy.tablename}`);
      }
    }

    // Check for FORCE ROW LEVEL SECURITY
    console.log('\n🔍 Checking for FORCE ROW LEVEL SECURITY...');
    const forceRLS = await client.query(`
      SELECT
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND rowsecurity = true;
    `);

    if (forceRLS.rows.length > 0) {
      console.log('⚠️  Found tables with RLS still enabled:');
      console.table(forceRLS.rows);
    } else {
      console.log('✅ No tables with RLS enabled.');
    }

    console.log('\n✅ Policy check completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkPolicies().catch((error) => {
  console.error('Failed to check policies:', error);
  process.exit(1);
});
