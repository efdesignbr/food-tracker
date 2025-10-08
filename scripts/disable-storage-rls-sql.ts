#!/usr/bin/env tsx
/**
 * Disable RLS on storage.objects table via SQL
 */

import { getPool } from '../lib/db';

async function disableStorageRLS() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🔍 Disabling RLS on storage.objects...\n');

    // Check current RLS on storage schema
    const rlsCheck = await client.query(`
      SELECT
        n.nspname as schema,
        c.relname as table,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'storage'
      AND c.relkind = 'r'
      ORDER BY c.relname;
    `);

    console.log('Storage tables RLS status:');
    console.table(rlsCheck.rows);

    // Disable RLS on storage.objects
    console.log('\n🔧 Disabling RLS on storage.objects...');
    await client.query('ALTER TABLE IF EXISTS storage.objects DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE IF EXISTS storage.buckets DISABLE ROW LEVEL SECURITY');

    console.log('✅ RLS disabled on storage.objects');
    console.log('✅ RLS disabled on storage.buckets');

    // Check policies
    const policies = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname
      FROM pg_policies
      WHERE schemaname = 'storage'
      ORDER BY tablename, policyname;
    `);

    if (policies.rows.length > 0) {
      console.log('\n📋 Found storage policies:');
      console.table(policies.rows);

      console.log('\n🗑️  Dropping all storage policies...');
      for (const policy of policies.rows) {
        try {
          await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON storage.${policy.tablename}`);
          console.log(`✅ Dropped ${policy.policyname} on storage.${policy.tablename}`);
        } catch (e: any) {
          console.log(`⚠️  Could not drop ${policy.policyname}:`, e.message);
        }
      }
    }

    // Verify
    const newStatus = await client.query(`
      SELECT
        n.nspname as schema,
        c.relname as table,
        c.relrowsecurity as rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'storage'
      AND c.relkind = 'r'
      ORDER BY c.relname;
    `);

    console.log('\n📊 New status:');
    console.table(newStatus.rows);

    console.log('\n✅ Done! Storage RLS should be disabled now.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

disableStorageRLS().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
