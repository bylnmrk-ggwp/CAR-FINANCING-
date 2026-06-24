import { getJobQueue } from "../src/job-queue";
import db from "../database";

export default function handler(_req: any, res: any) {
  const q = getJobQueue(db);
  res.statusCode = 200;
  res.end("jobqueue-loaded");
}
