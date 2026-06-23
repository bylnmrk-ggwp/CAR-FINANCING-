import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./src/app";

const PORT = 3000;

async function startAutomatedServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Car Finance Server running on http://localhost:${PORT}`);
  });
}

startAutomatedServer();
