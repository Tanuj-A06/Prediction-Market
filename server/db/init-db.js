const { pool } = require("./db");

const initialDatabaseSchema = `
CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT PRIMARY KEY,
  username VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  status VARCHAR(30) DEFAULT 'active',
  balance DECIMAL(18,2) DEFAULT 10000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS markets (
  market_id BIGINT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  market_type VARCHAR(50),
  category VARCHAR(100),
  yes_price DECIMAL(5,4) CHECK (yes_price BETWEEN 0 AND 1),
  no_price DECIMAL(5,4) CHECK (no_price BETWEEN 0 AND 1),
  liquidity DECIMAL(18,2) DEFAULT 0,
  volume DECIMAL(18,2) DEFAULT 0,
  resolution_source VARCHAR(255),
  resolution_script TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  resolved_outcome VARCHAR(3) CHECK (resolved_outcome IN ('YES', 'NO') OR resolved_outcome IS NULL),
  created_by BIGINT,
  start_date TIMESTAMP,
  resolution_date TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS positions (
  position_id BIGINT PRIMARY KEY,
  user_id BIGINT,
  market_id BIGINT,
  outcome VARCHAR(3) CHECK (outcome IN ('YES', 'NO')),
  shares DECIMAL(18,6),
  avg_price DECIMAL(18,6),
  UNIQUE (user_id, market_id, outcome),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (market_id) REFERENCES markets(market_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  txn_id BIGINT PRIMARY KEY,
  user_id BIGINT,
  market_id BIGINT,
  type VARCHAR(10) CHECK (type IN ('BUY', 'SELL', 'CLAIM')),
  outcome VARCHAR(3) CHECK (outcome IN ('YES', 'NO')),
  amount_credits DECIMAL(18,6),
  shares DECIMAL(18,6),
  execution_price DECIMAL(18,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (market_id) REFERENCES markets(market_id)
);

CREATE TABLE IF NOT EXISTS price_history (
  history_id BIGINT PRIMARY KEY,
  market_id BIGINT,
  yes_price DECIMAL(5,4),
  volume_at_time DECIMAL(18,6),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (market_id) REFERENCES markets(market_id)
);
`;

// Safe migrations for existing databases
const migrations = [
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);",
  "ALTER TABLE markets ADD COLUMN IF NOT EXISTS volume DECIMAL(18,2) DEFAULT 0;",
  "ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolved_outcome VARCHAR(3);",
  "ALTER TABLE markets ADD COLUMN IF NOT EXISTS yes_pool DECIMAL(18,6) DEFAULT 500;",
  "ALTER TABLE markets ADD COLUMN IF NOT EXISTS no_pool DECIMAL(18,6) DEFAULT 500;",
  "UPDATE markets SET yes_pool = 1000 * (1 - yes_price), no_pool = 1000 * yes_price WHERE yes_pool IS NULL OR yes_pool = 0;",
];

async function initDb() {
  console.log("Initializing Database...");
  try {
    await pool.query(initialDatabaseSchema);
    console.log("Database tables created successfully.");

    // Run migrations for existing tables
    for (const migration of migrations) {
      try {
        await pool.query(migration);
      } catch (err) {
        // Ignore errors from already-existing columns
        if (!err.message.includes("already exists")) {
          console.warn("Migration warning:", err.message);
        }
      }
    }
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await pool.end();
  }
}

initDb();
