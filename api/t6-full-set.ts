import express from "express";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import cors from "cors";
import { getCache } from "../src/cache";
import { getJobQueue } from "../src/job-queue";
import { getWebhookManager } from "../src/webhooks";
import { initializeDatabase } from "../database";
import db from "../database";

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.end("ok");
}
