export default function handler(req: any, res: any) {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "catch-all works", url: req.url, method: req.method }));
}
