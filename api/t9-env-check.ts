export default function handler(req: any, res: any) {
  const info = {
    VERCEL: process.env.VERCEL,
    CWD: process.cwd(),
    PWD: process.env.PWD,
    PATH: process.env.PATH ? process.env.PATH.substring(0, 200) : undefined,
  };
  res.statusCode = 200;
  res.end(JSON.stringify(info));
}
