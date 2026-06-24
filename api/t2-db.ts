import db from "../database";

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.end("db-loaded");
}
