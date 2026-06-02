import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchDex, getBestPair } from "@/lib/data/dexscreener";
import { searchCoin, getCoinData } from "@/lib/data/coingecko";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

    const [dexResult, cgCoin] = await Promise.all([
      searchDex(query),
      searchCoin(query).then(found => found ? getCoinData(found.id) : null),
    ]);

    const bestPair = getBestPair(dexResult.pairs);
    const realSignals: string[] = [];

    if (bestPair) {
      const buys = bestPair.txns?.h24?.buys || 0;
      const sells = bestPair.txns?.h24?.sells || 0;
      const total = buys + sells;
      const buyRatio = total > 0 ? buys / total : 0;
      if (buyRatio > 0.8) realSignals.push(`Extreme buy ratio: ${(buyRatio*100).toFixed(0)}% — likely bot-driven`);
      const volLiq = (bestPair.volume?.h24 || 0) / (bestPair.liquidity?.usd || 1);
      if (volLiq > 5) realSignals.push(`Volume/Liquidity: ${volLiq.toFixed(1)}x — artificial volume`);
      const age = Math.floor((Date.now() - (bestPair.pairCreatedAt || Date.now())) / 86400000);
      if (age < 7) realSignals.push(`Only ${age} days old — peak manipulation window`);
    }

    if (cgCoin) {
      const sentiment = cgCoin.sentiment_votes_up_percentage || 0;
      if (sentiment > 85) realSignals.push(`${sentiment.toFixed(0)}% positive — euphoric, likely farmed`);
      if ((cgCoin.developer_data?.commit_count_4_weeks || 0) === 0) realSignals.push("Zero dev commits — abandoned despite hype");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`Pulse manipulation radar for "${query}".
Real signals: ${realSignals.join("; ") || "none"}
Buy/Sell 24h: ${bestPair ? `${bestPair.txns?.h24?.buys}/${bestPair.txns?.h24?.sells}` : "N/A"}
Volume: $${(bestPair?.volume?.h24||0).toLocaleString()}, Liq: $${(bestPair?.liquidity?.usd||0).toLocaleString()}
Sentiment: ${cgCoin?.sentiment_votes_up_percentage||0}% positive
JSON only: {"token":"string","botActivityIndex":number,"shillCoordination":number,"washTradePercent":number,"narrativeAge":"string","overallManipulationScore":number,"manipulationLevel":"LOW|MODERATE|HIGH|EXTREME","detectedOperations":[{"severity":"critical|high|medium","title":"string","description":"string"}],"verdict":"string"}`);

    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json({ ...parsed, realSignalsDetected: realSignals, dataSource: "DexScreener + Gemini AI" });

  } catch (err) {
    console.error("Manipulation error:", err);
    return NextResponse.json({ error: "Scan failed." }, { status: 500 });
  }
}
