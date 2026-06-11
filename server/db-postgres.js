const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      member_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      title TEXT,
      group_name TEXT,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      notes TEXT,
      gender TEXT,
      password TEXT,
      recovery_email TEXT,
      password_reset_otp TEXT,
      password_reset_otp_expiry BIGINT
    );

    CREATE TABLE IF NOT EXISTS givings (
      id SERIAL PRIMARY KEY,
      member_id INTEGER REFERENCES members(id),
      amount NUMERIC NOT NULL,
      giving_date TIMESTAMP WITH TIME ZONE NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS tithes (
      id SERIAL PRIMARY KEY,
      member_id INTEGER REFERENCES members(id),
      amount NUMERIC NOT NULL,
      giving_date TIMESTAMP WITH TIME ZONE NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      category TEXT NOT NULL,
      total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      expense TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      date TIMESTAMP WITH TIME ZONE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      project_name TEXT NOT NULL,
      member_id INTEGER REFERENCES members(id),
      amount NUMERIC NOT NULL,
      date TIMESTAMP WITH TIME ZONE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      item TEXT NOT NULL,
      qty INTEGER NOT NULL,
      storage TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS department_transactions (
      id SERIAL PRIMARY KEY,
      department TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      transaction_type TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  const result = await query('SELECT COUNT(*) FROM admins');
  if (Number(result.rows[0].count) === 0) {
    await query(
      'INSERT INTO admins (username, password, role) VALUES ($1, $2, $3), ($4, $5, $6)',
      ['pastor', '$2a$10$WzTgN0xwFjF1Y7dH2QxI5Oza/tgynw0kLJYv2X2BQ1YWnjUXLZkOS', 'pastor', 'Elder', '$2a$10$uRFJuYxGe/sQvVHZ7YkIr.9jF1w5oSVt8qj68.EVDswyvRsNf2F.FW', 'elder']
    );
  }
}

module.exports = { pool, query, initDatabase, transaction };
