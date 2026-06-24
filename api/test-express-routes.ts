import express from "express";

const app = express();
app.get("/api/test-express-routes", (_req, res) => {
  res.json({ routes: "ok" });
});

export default function handler(req: any, res: any) {
  app(req, res);
}
