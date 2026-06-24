export default async function handler(req: any, res: any) {
  try {
    const mod = await import("../src/express-app");
    const app = mod.default;
    app(req, res);
  } catch (err: any) {
    console.error("handler error:", err?.message || err);
    try { res.statusCode = 500; res.end("err: " + (err?.message || String(err))); } catch {}
  }
}
