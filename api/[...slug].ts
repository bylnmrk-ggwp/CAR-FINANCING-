import serverless from "serverless-http";
import app from "../src/express-app.ts";

export const handler = serverless(app);
