import express from "express";
import serverless from "serverless-http";

const app = express();
app.get("/api/test-express", (_req, res) => {
  res.json({ express: "ok" });
});

export const handler = serverless(app);
