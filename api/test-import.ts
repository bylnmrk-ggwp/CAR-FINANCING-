import cors from "cors";

export default function handler(_req: any, res: any) {
  res.json({ cors: typeof cors });
}
