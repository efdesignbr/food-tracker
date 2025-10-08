import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './database';
import { logger } from '../shared/utils/logger';

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    const migrationFile = join(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = readFileSync(migrationFile, 'utf-8');

    await db.query(sql);

    logger.info('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed', { error });
    process.exit(1);
  }
}

runMigrations();
