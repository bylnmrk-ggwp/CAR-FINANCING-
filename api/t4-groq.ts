import Groq from "groq-sdk";

const client = new Groq({ apiKey: "MOCK_KEY" });

export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.end("groq-loaded");
}
