import serverless from "serverless-http";
import app from "../src/express-app";

export const handler = serverless(app);
