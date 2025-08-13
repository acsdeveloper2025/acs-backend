import { config } from 'dotenv';
config();

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../config/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

// Create migrations table if it doesn't exist
async function createMigrationsTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await pool.query(sql);
  logger.info('Migrations table created or verified');
}

// Get list of executed migrations
async function getExecutedMigrations(): Promise<string[]> {
  const result = await pool.query('SELECT id FROM migrations ORDER BY executed_at');
  return result.rows.map(row => row.id);
}

// Record migration as executed
async function recordMigration(migration: Migration): Promise<void> {
  await pool.query(
    'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
    [migration.id, migration.filename]
  );
}

// Load migration files
function loadMigrations(): Migration[] {
  const migrations: Migration[] = [
    {
      id: '001_create_location_tables',
      filename: '001_create_location_tables.sql',
      sql: readFileSync(join(__dirname, '001_create_location_tables.sql'), 'utf8')
    }
  ];

  return migrations;
}

// Run pending migrations
export async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting database migrations...');
    
    await createMigrationsTable();
    const executedMigrations = await getExecutedMigrations();
    const allMigrations = loadMigrations();
    
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.id)
    );
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    for (const migration of pendingMigrations) {
      logger.info(`Running migration: ${migration.filename}`);
      
      // Execute migration in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
          [migration.id, migration.filename]
        );
        await client.query('COMMIT');
        
        logger.info(`Migration completed: ${migration.filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

// CLI runner
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}
