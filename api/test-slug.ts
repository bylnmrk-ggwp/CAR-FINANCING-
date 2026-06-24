export default function handler(req: any, res: any) {
  res.json({
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
}
