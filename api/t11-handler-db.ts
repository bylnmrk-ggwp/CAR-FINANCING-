import Database from 'better-sqlite3';
import path from 'path';

export default function handler(req: any, res: any) {
  try {
    const dbPath = path.join('/tmp', 'handler-test.db');
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.exec("CREATE TABLE IF NOT EXISTS handler_test (id TEXT PRIMARY KEY)");
    const row = db.prepare("SELECT 1 as val").get();
    db.close();
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, row }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end("Error: " + (err?.message || String(err)));
  }
}
