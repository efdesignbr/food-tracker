import { Pool, PoolClient } from 'pg';
import { config } from './environment';
import { logger } from '../shared/utils/logger';

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      ssl: config.server.env === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database error', { error: err });
    });

    // Set timezone to America/Sao_Paulo
    this.pool.on('connect', (client) => {
      client.query("SET timezone = 'America/Sao_Paulo'");
    });
  }

  async query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result.rows as T[];
    } catch (error) {
      logger.error('Query error', { text, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT NOW()');
      logger.info('Database connection successful');
      return true;
    } catch (error) {
      logger.error('Database connection failed', { error });
      return false;
    }
  }
}

export const db = new Database();
