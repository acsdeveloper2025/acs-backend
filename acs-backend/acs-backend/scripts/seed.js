#!/usr/bin/env node
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const cx = await pool.connect();
  try {
    await cx.query('BEGIN');

    const now = new Date();

    const password = 'admin123';
    const hash = await bcrypt.hash(password, 12);

    // Create admin user if not exists
    await cx.query(
      `INSERT INTO users (id, name, username, password, "passwordHash", role, "createdAt")
       VALUES (gen_random_uuid()::text, 'System Administrator', 'admin', $1, $2, 'ADMIN', CURRENT_TIMESTAMP)
       ON CONFLICT (username) DO NOTHING`,
      [password, hash]
    );

    // Create sample client
    await cx.query(
      `INSERT INTO clients (id, name, code, "createdAt")
       VALUES (gen_random_uuid()::text, 'ABC Bank Ltd.', 'CLI001', CURRENT_TIMESTAMP)
       ON CONFLICT (code) DO NOTHING`
    );

    // Create sample products
    await cx.query(
      `INSERT INTO products (id, name, code, "createdAt") VALUES
       (gen_random_uuid()::text, 'Personal Loan Verification', 'PERSONAL_LOAN', CURRENT_TIMESTAMP),
       (gen_random_uuid()::text, 'Home Loan Verification', 'HOME_LOAN', CURRENT_TIMESTAMP)
       ON CONFLICT (code) DO NOTHING`
    );

    await cx.query('COMMIT');
    console.log('Seed completed');
  } catch (e) {
    await cx.query('ROLLBACK');
    console.error('Seed failed', e);
    process.exit(1);
  } finally {
    cx.release();
    await pool.end();
  }
}

main();

