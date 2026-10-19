import type { ISqliteDatabase } from './types.js';
import { V1_SQL } from './schema/v1-sql.js';

export function initializeDatabase(db: ISqliteDatabase): void {
  // 1. Mandatory foreign key enforcement
  db.exec('PRAGMA foreign_keys = ON;');

  // 2. Apply v1.sql schema
  db.exec(V1_SQL);

  // 3. Record migration if not already tracked
  const existing = (db
    .prepare('SELECT version FROM schema_migrations WHERE version = 1;')
    .get() as { version: number } | undefined);

  if (!existing) {
    db.prepare(
      'INSERT INTO schema_migrations (version, name, applied_at) VALUES (1, ?, ?);',
    ).run('v1_initial_schema', new Date().toISOString());
  }
}
