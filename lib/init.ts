import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getPool } from './db';
import { env } from './env';

let didInit = false;

export async function init() {
  if (didInit) return;
  const e = env();
  if (e.AUTO_MIGRATE) {
    await applyMigrations();
  }
  if (e.AUTO_BOOTSTRAP_DEFAULTS) {
    await bootstrapDefaults();
  }
  didInit = true;
}

async function applyMigrations() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`);
    const { rows: applied } = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
    const appliedSet = new Set(applied.map(r => r.name));
    const dir = path.resolve(process.cwd(), 'migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (appliedSet.has(file)) continue;
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file]);
    }
  } finally {
    client.release();
  }
}

async function bootstrapDefaults() {
  const e = env();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const slug = e.DEFAULT_TENANT_SLUG;
    const t = await client.query('SELECT id, slug, name FROM tenants WHERE slug = $1', [slug]);
    let tenant = t.rows[0];
    if (!tenant) {
      const ins = await client.query('INSERT INTO tenants (slug, name) VALUES ($1,$2) RETURNING id, slug, name', [slug, slug]);
      tenant = ins.rows[0];
    }
    // Set tenant context for RLS-aware writes
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenant.id]);
    // Attach orphan records
    await client.query('UPDATE users SET tenant_id = $1 WHERE tenant_id IS NULL', [tenant.id]);
    await client.query('UPDATE meals SET tenant_id = $1 WHERE tenant_id IS NULL', [tenant.id]).catch(() => {});
    await client.query('UPDATE food_items SET tenant_id = $1 WHERE tenant_id IS NULL', [tenant.id]).catch(() => {});
    await client.query('UPDATE nutrition_data SET tenant_id = $1 WHERE tenant_id IS NULL', [tenant.id]).catch(() => {});

    // Ensure admin user
    const { rows: users } = await client.query('SELECT id, password_hash FROM users WHERE email = $1 AND tenant_id = $2', [e.DEFAULT_ADMIN_EMAIL, tenant.id]);
    const passHash = bcrypt.hashSync(e.DEFAULT_ADMIN_PASSWORD, 10);
    if (users.length === 0) {
      await client.query(
        'INSERT INTO users (id, email, name, tenant_id, password_hash, role) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)',
        [e.DEFAULT_ADMIN_EMAIL, e.DEFAULT_ADMIN_NAME, tenant.id, passHash, 'owner']
      );
    } else if (!users[0].password_hash) {
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passHash, users[0].id]);
    }
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}
