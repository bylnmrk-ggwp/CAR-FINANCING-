import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join("/tmp", "test.db");
let db: Database.Database;
let error: string | null = null;

try {
  db = new Database(dbPath);
  db.exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)");
  db.close();
} catch (err: any) {
  error = err.message;
}

export default function handler(_req: any, res: any) {
  if (error) {
    res.status(500).json({ error });
  } else {
    res.json({ betterSqlite3: "ok" });
  }
}
