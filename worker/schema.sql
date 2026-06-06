-- D1 schema for Waktu Sholat push backend (Level 2).
-- Apply with: wrangler d1 execute waqt --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_endpoint
ON subscriptions(endpoint);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  city TEXT,
  country TEXT,
  country_code TEXT,
  timezone TEXT,
  madhhab TEXT NOT NULL,
  calculation_method TEXT NOT NULL,
  notification_enabled INTEGER NOT NULL,
  at_start INTEGER NOT NULL,
  before_start_minutes TEXT NOT NULL, -- JSON array, e.g. "[15]"
  before_end_minutes TEXT NOT NULL,   -- JSON array, e.g. "[10,5]"
  next_notification_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- The cron query is driven entirely by this index; it never scans all users.
CREATE INDEX IF NOT EXISTS idx_user_settings_next_notification_at
ON user_settings(next_notification_at);
