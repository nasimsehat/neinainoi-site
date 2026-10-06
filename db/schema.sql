-- the signup list. one row per address.
CREATE TABLE IF NOT EXISTS subscribers (
  email        TEXT PRIMARY KEY,
  token        TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed
  created_at   TEXT NOT NULL,
  confirmed_at TEXT
);
