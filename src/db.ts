import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
    })
  : null;

/**
 * Initializes PostgreSQL database tables automatically on server startup if connected.
 */
export async function initDb() {
  if (!pool) {
    console.log('ℹ️  No DATABASE_URL set; using fallback in-memory store.');
    return;
  }

  try {
    const client = await pool.connect();
    console.log('✅ Connected to local PostgreSQL database.');

    // 1. Places table
    await client.query(`
      CREATE TABLE IF NOT EXISTS worship_places (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        religion VARCHAR(100) NOT NULL,
        venue_type VARCHAR(100),
        congregation_day VARCHAR(50),
        city VARCHAR(100),
        country VARCHAR(100),
        address TEXT,
        image_url TEXT,
        admin_name VARCHAR(255),
        preacher_title VARCHAR(100),
        preacher_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(100),
        description TEXT,
        follower_count INT DEFAULT 0,
        languages_offered JSONB,
        approval_status VARCHAR(50) DEFAULT 'approved',
        facilities JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Sermons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sermons (
        id VARCHAR(100) PRIMARY KEY,
        place_id VARCHAR(100) REFERENCES worship_places(id) ON DELETE CASCADE,
        place_name VARCHAR(255),
        religion VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        speaker_name VARCHAR(255),
        speaker_title VARCHAR(100),
        original_language VARCHAR(50),
        original_language_code VARCHAR(10),
        date VARCHAR(50),
        original_text TEXT,
        summary TEXT,
        key_takeaways JSONB,
        scripture_reference TEXT,
        topic_tags JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Admin Accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_accounts (
        id VARCHAR(100) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        place_id VARCHAR(100),
        place_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'masjid_admin',
        status VARCHAR(50) DEFAULT 'pending',
        requested_at VARCHAR(100),
        approved_at VARCHAR(100)
      );
    `);

    // 4. Broadcast Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS broadcast_logs (
        id VARCHAR(100) PRIMARY KEY,
        sermon_id VARCHAR(100),
        sermon_title VARCHAR(255),
        place_name VARCHAR(255),
        timestamp VARCHAR(100),
        channel VARCHAR(50),
        recipients_count INT,
        language_breakdown JSONB,
        sample_messages JSONB
      );
    `);

    client.release();
    console.log('✅ PostgreSQL schemas verified/created successfully.');
  } catch (err) {
    console.error('⚠️  Failed to connect to local PostgreSQL database:', err);
    console.log('⚠️  Falling back to in-memory store.');
  }
}
