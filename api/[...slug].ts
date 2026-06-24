let _app: any;

async function getApp() {
  if (_app) return _app;
  try {
    const mod = await import("../src/express-app");
    _app = mod.default;
    return _app;
  } catch (err: any) {
    throw new Error("import express-app failed: " + (err?.message || String(err)));
  }
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    app(req, res);
  } catch (err: any) {
    console.error("Handler error:", err?.message || err);
    try { res.statusCode = 500; res.end(JSON.stringify({ error: err?.message || String(err) })); } catch {}
  }
}
