import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.VERCEL
  ? path.join('/tmp', 'mcars-finance-standalone.db')
  : path.join(process.cwd(), 'mcars-finance-standalone.db');

let result = "unknown";

try {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.exec("CREATE TABLE IF NOT EXISTS test_table (id TEXT PRIMARY KEY)");
  result = "ok";
} catch (err: any) {
  result = "err: " + (err?.message || String(err));
}

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.end(result);
}
