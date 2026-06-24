import express from "express";
import serverless from "serverless-http";

const app = express();
app.get("/api/test-express-sl3", (_req, res) => {
  res.json({ expressSl3: "ok" });
});

export const handler = serverless(app);
