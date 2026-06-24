import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.end("ok");
}
