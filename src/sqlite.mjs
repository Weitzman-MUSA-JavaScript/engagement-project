import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDatabase(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const sql = new DatabaseSync(filename);
  sql.exec('PRAGMA journal_mode=WAL;');
  sql.exec('CREATE TABLE IF NOT EXISTS __local_migrations (tag TEXT PRIMARY KEY)');
  // Older previews predate migration tracking; their original schema is already applied.
  if (sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='participants'").get()) {
    sql.prepare('INSERT OR IGNORE INTO __local_migrations (tag) VALUES (?)').run('0000_demo');
  }
  const journal = JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json', import.meta.url), 'utf8'));
  for (const { tag } of journal.entries) {
    if (sql.prepare('SELECT tag FROM __local_migrations WHERE tag = ?').get(tag)) continue;
    sql.exec('BEGIN');
    try {
      sql.exec(readFileSync(new URL(`../drizzle/${tag}.sql`, import.meta.url), 'utf8'));
      sql.prepare('INSERT INTO __local_migrations (tag) VALUES (?)').run(tag);
      sql.exec('COMMIT');
    } catch (error) { sql.exec('ROLLBACK'); sql.close(); throw error; }
  }
  const wrap = (query, args = []) => ({
    bind: (...values) => wrap(query, values),
    first: async () => sql.prepare(query).get(...args) || null,
    all: async () => ({ results: sql.prepare(query).all(...args) }),
    run: async () => ({ meta: { changes: sql.prepare(query).run(...args).changes } }),
  });
  return {
    prepare: (query) => wrap(query),
    async batch(statements) {
      sql.exec('BEGIN');
      try { const results = []; for (const statement of statements) results.push(await statement.run()); sql.exec('COMMIT'); return results; } catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
    close: () => sql.close(),
  };
}
