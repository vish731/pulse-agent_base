import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResult } from "./types";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

const SYSTEM_PROMPT = `You are Pulse — elite crypto 
conviction agent on Base L2.

Score each 0-100:
- hype: noise level (high is bad)
- conviction: smart money buying?
- organic: community real or fake?
- insider: alpha wallets positioning?
- sustainability: real structural legs?

Give:
- verdict: "manufactured"|"caution"|"early"|
  "organic"|"high_conviction"
- verdictLabel: short label
- riskLevel: "low"|"medium"|"high"|"extreme"
- signals: [{type:"bullish"|"bearish"|"neutral",
  category:string, message:string}]
- summary: 1-2 sharp sentences
- uniqueEdge: hidden pattern most analysts miss

Respond ONLY with valid JSON. No backticks.`;

export async function analyzeToken(
  query: string
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash" 
  });
  const result = await model.generateContent(
    SYSTEM_PROMPT + "\n\nAnalyze this: " + query
  );
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as AnalysisResult;
}
