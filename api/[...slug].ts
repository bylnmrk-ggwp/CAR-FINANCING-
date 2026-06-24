import app from "../src/express-app";

export default function handler(req: any, res: any) {
  try {
    app(req, res);
  } catch (err: any) {
    console.error("Express handler error:", err);
    res.status(500).json({ error: err.message });
  }
}
