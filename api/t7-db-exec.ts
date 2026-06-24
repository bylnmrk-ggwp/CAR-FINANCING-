import db from "../database";

export default function handler(req: any, res: any) {
  try {
    db.exec("CREATE TABLE IF NOT EXISTS test_table (id TEXT PRIMARY KEY)");
    res.statusCode = 200;
    res.end("db-exec-ok");
  } catch (err: any) {
    res.statusCode = 500;
    res.end("db-exec-err: " + (err?.message || String(err)));
  }
}
