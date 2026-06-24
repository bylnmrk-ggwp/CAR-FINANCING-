let _app: any;

async function getApp() {
  if (_app) return _app;
  const mod = await import("../src/express-app");
  _app = mod.default;
  return _app;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    app(req, res);
  } catch (err: any) {
    console.error("Express handler error:", err.message);
    try {
      res.status(500).json({ error: err.message, stack: err.stack });
    } catch {}
  }
}
