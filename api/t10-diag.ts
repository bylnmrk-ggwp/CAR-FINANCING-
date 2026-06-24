import db from "../database";

export default function handler(req: any, res: any) {
  try {
    const info: any = {
      type: typeof db,
      hasExec: typeof (db as any).exec,
      hasPrepare: typeof (db as any).prepare,
      hasPragma: typeof (db as any).pragma,
      constructor: (db as any)?.constructor?.name,
    };
    try {
      const stmt = (db as any).prepare("SELECT 1 as val");
      const row = stmt.get();
      info.queryResult = row;
    } catch (queryErr: any) {
      info.queryError = queryErr?.message || String(queryErr);
    }
    res.statusCode = 200;
    res.end(JSON.stringify(info));
  } catch (err: any) {
    res.statusCode = 500;
    res.end("Error: " + (err?.message || String(err)));
  }
}
