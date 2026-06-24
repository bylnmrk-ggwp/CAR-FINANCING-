import serverless from "serverless-http";

const handler = serverless(async (_req: any, res: any) => {
  res.json({ serverless: "ok" });
});

export { handler };
