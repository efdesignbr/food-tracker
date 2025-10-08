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
  // Bootstrap desabilitado - sistema requer cadastro manual de tenants via scripts/setup-tenant.ts
}
