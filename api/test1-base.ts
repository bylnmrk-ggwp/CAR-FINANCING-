import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.end("ok");
}
