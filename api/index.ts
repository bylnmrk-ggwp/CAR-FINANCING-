import app from "../src/express-app";

export default function handler(req: any, res: any) {
  app(req, res);
}
