import serverless from "serverless-http";

const app = (req: any, res: any) => {
  res.json({ serverless: "ok" });
};

export const handler = serverless(app);
