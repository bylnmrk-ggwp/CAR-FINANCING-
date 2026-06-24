import app from "../src/express-app";

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.end(JSON.stringify({ routes: app._router?.stack?.length || 0 }));
}
