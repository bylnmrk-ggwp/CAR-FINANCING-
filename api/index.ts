import app from "../src/express-app";

export default function handler(req: any, res: any) {
  try {
    app(req, res);
  } catch (err: any) {
    console.error("handler error:", err?.message || err);
    try { res.statusCode = 500; res.end(JSON.stringify({ error: err?.message || String(err) })); } catch {}
  }
}
