CREATE TABLE IF NOT EXISTS catalog_tracks (
  content_id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_catalog_tracks_category ON catalog_tracks(category_id);
CREATE TABLE IF NOT EXISTS catalog_categories (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
