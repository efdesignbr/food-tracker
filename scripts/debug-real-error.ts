#!/usr/bin/env tsx
/**
 * Debug the ACTUAL error happening in production
 */

import { getPool } from '../lib/db';

async function debugError() {
  const pool = getPool();

  console.log('🔍 Debugging the REAL error...\n');

  // Test 1: Check what user we're connecting as
  const client1 = await pool.connect();
  try {
    const userInfo = await client1.query(`
      SELECT
        current_user,
        current_database(),
        session_user,
        inet_client_addr(),
        inet_server_addr()
    `);
    console.log('📊 Connection Info:');
    console.log(userInfo.rows[0]);

    // Check what roles this user has
    const roles = await client1.query(`
      SELECT
        r.rolname,
        r.rolsuper,
        r.rolinherit,
        r.rolcreaterole,
        r.rolcreatedb,
        r.rolcanlogin,
        r.rolbypassrls
      FROM pg_roles r
      WHERE r.rolname = current_user;
    `);
    console.log('\n🔐 Current Role Capabilities:');
    console.log(roles.rows[0]);

  } finally {
    client1.release();
  }

  // Test 2: Try the EXACT insert that's failing
  const client2 = await pool.connect();
  try {
    console.log('\n🧪 Attempting the EXACT failing insert...\n');

    await client2.query('BEGIN');

    // Get tenant and user
    const tenant = await client2.query('SELECT id, slug FROM tenants LIMIT 1');
    const user = await client2.query('SELECT id FROM users WHERE tenant_id = $1 LIMIT 1', [tenant.rows[0].id]);

    const tenantId = tenant.rows[0].id;
    const userId = user.rows[0].id;

    console.log('Tenant ID:', tenantId);
    console.log('User ID:', userId);

    // Set config like the code does
    await client2.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    await client2.query(`SET LOCAL app.tenant_id = '${tenantId}'`);

    console.log('\nAttempting INSERT INTO meals...');

    try {
      const result = await client2.query(
        `INSERT INTO meals (user_id, tenant_id, image_url, meal_type, consumed_at, status, notes)
         VALUES ($1,$2,$3,$4,NOW(),'approved',$5) RETURNING *`,
        [userId, tenantId, 'https://example.com/test.png', 'lunch', 'Test meal']
      );
      console.log('✅ INSERT succeeded!', result.rows[0].id);
    } catch (insertError: any) {
      console.log('❌ INSERT FAILED with error:');
      console.log('Message:', insertError.message);
      console.log('Code:', insertError.code);
      console.log('Detail:', insertError.detail);
      console.log('Table:', insertError.table);
      console.log('Schema:', insertError.schema);
      console.log('Constraint:', insertError.constraint);
      console.log('\nFull error object:', JSON.stringify(insertError, null, 2));
    }

    await client2.query('ROLLBACK');

  } finally {
    client2.release();
  }

  // Test 3: Check if RLS is REALLY disabled at the Supabase level
  const client3 = await pool.connect();
  try {
    console.log('\n🔍 Deep RLS check...\n');

    // Check pg_class for relrowsecurity
    const rlsCheck = await client3.query(`
      SELECT
        n.nspname as schema,
        c.relname as table,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname IN ('meals', 'food_items', 'nutrition_data', 'users', 'tenants')
      ORDER BY c.relname;
    `);

    console.log('RLS Status (from pg_class):');
    console.table(rlsCheck.rows);

    // Check for any policies
    const policiesCheck = await client3.query(`
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

    console.log('\nActive Policies:');
    if (policiesCheck.rows.length === 0) {
      console.log('✅ No policies found');
    } else {
      console.table(policiesCheck.rows);
    }

  } finally {
    client3.release();
    await pool.end();
  }
}

debugError().catch((error) => {
  console.error('Debug failed:', error);
  process.exit(1);
});
