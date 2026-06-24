import express from "express";
export default function handler(_req: any, res: any) {
  res.json({ express: typeof express });
}
