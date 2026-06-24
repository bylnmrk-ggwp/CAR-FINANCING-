import express from "express";

const app = express();

export default function handler(req: any, res: any) {
  app(req, res);
}
