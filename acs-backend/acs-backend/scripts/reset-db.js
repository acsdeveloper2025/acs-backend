#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const cx = await pool.connect();
  try {
    await cx.query('BEGIN');
    await cx.query('TRUNCATE TABLE audit_logs, attachments, auto_saves, background_sync_queue, cases, client_products, client_verification_types, devices, locations, notification_tokens, office_verification_reports, product_verification_types, products, refresh_tokens, residence_verification_reports, users, verification_types RESTART IDENTITY CASCADE');
    await cx.query('COMMIT');
    console.log('Database reset complete');
  } catch (e) {
    await cx.query('ROLLBACK');
    console.error('Reset failed', e);
    process.exit(1);
  } finally {
    cx.release();
    await pool.end();
  }
}

main();

