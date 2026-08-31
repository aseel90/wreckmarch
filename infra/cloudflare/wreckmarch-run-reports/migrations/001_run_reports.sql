-- Wreckmarch run-report ingestion schema.
-- Apply as an explicit D1 migration; never execute this DDL from the /report or /bridge hot paths.
CREATE TABLE IF NOT EXISTS run_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL UNIQUE,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  report_json TEXT NOT NULL,
  github_issue_number INTEGER,
  github_issue_url TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_run_reports_status ON run_reports(status);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('2026-08-31-run-reports-v2');
