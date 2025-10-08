import { Pool } from 'pg';

let pool: Pool | undefined;
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export function getPool(): Pool {
  if (pool) return pool;
  if (global.__pgPool) {
    pool = global.__pgPool;
    return pool;
  }
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error('DATABASE_URL is not set');
  pool = new Pool({ connectionString: cs, max: 5 });
  // Set timezone for all connections
  pool.on('connect', (client) => {
    client.query("SET TIME ZONE 'America/Sao_Paulo'").catch(() => {});
  });
  global.__pgPool = pool;
  return pool;
}
