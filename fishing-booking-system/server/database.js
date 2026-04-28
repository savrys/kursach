const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'fishing_base',
  password: '12345',
  port: 5433,
});

// Создание всех таблиц
const initTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS places (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        coordinates_x INTEGER DEFAULT 300,
        coordinates_y INTEGER DEFAULT 250,
        description TEXT DEFAULT '',
        max_capacity INTEGER DEFAULT 2,
        image TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        place_id TEXT REFERENCES places(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status TEXT DEFAULT 'pending',
        catch_amount REAL DEFAULT 0,
        extended_count INTEGER DEFAULT 0,
        cancel_requested BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        approved_at TIMESTAMP,
        approved_by TEXT,
        rejected_at TIMESTAMP,
        rejected_by TEXT,
        cancelled_at TIMESTAMP,
        cancelled_by TEXT
      );

      CREATE TABLE IF NOT EXISTS stats_fishing (
        user_id TEXT REFERENCES users(id),
        username TEXT,
        total_catch REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS stats_visits (
        user_id TEXT REFERENCES users(id),
        username TEXT,
        total_hours REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT REFERENCES chats(id),
        sender_id TEXT REFERENCES users(id),
        text TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    client.release();
  }
};

// Функции для работы с базой
const query = async (text, params) => {
  const result = await pool.query(text, params);
  return result;
};

module.exports = { pool, query, initTables };