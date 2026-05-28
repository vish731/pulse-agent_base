// Manipulation Radar — DexScreener + CoinGecko + Claude AI
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { searchDex, getBestPair } from "@/lib/data/dexscreener";
import { searchCoin, getCoinData } from "@/lib/data/coingecko";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

    const [dexResult, cgCoin] = await Promise.all([
      searchDex(query),
      searchCoin(query).then(found => found ? getCoinData(found.id) : null),
    ]);

    const bestPair = getBestPair(dexResult.pairs);

    // Calculate real manipulation signals
    const realSignals: string[] = [];

    if (bestPair) {
      const buys = bestPair.txns?.h24?.buys || 0;
      const sells = bestPair.txns?.h24?.sells || 0;
      const total = buys + sells;
      const buyRatio = total > 0 ? buys / total : 0;

      if (buyRatio > 0.8) realSignals.push(`Extreme buy ratio: ${(buyRatio*100).toFixed(0)}% buys in 24h — likely bot-driven`);
      if (buyRatio > 0.9) realSignals.push("Near-zero sell transactions — honeypot or coordinated buy wall");

      const volLiq = (bestPair.volume?.h24 || 0) / (bestPair.liquidity?.usd || 1);
      if (volLiq > 5) realSignals.push(`Volume/Liquidity: ${volLiq.toFixed(1)}x — artificial volume likely`);

      const age = Math.floor((Date.now() - (bestPair.pairCreatedAt || Date.now())) / 86400000);
      if (age < 7) realSignals.push(`Only ${age} days old — in peak manipulation window`);
    }

    if (cgCoin) {
      const sentiment = cgCoin.sentiment_votes_up_percentage || 0;
      if (sentiment > 85) realSignals.push(`${sentiment.toFixed(0)}% positive sentiment — euphoric, likely farmed votes`);
      const commits = cgCoin.developer_data?.commit_count_4_weeks || 0;
      if (commits === 0) realSignals.push("Zero dev commits in 4 weeks — project may be abandoned despite hype");
    }

    const context = `
Token: "${query}"
Real DEX signals: ${realSignals.join("; ") || "none detected"}
Buy/Sell 24h: ${bestPair ? `${bestPair.txns?.h24?.buys}/${bestPair.txns?.h24?.sells}` : "N/A"}
Volume 24h: $${(bestPair?.volume?.h24 || 0).toLocaleString()}
Liquidity: $${(bestPair?.liquidity?.usd || 0).toLocaleString()}
24h price change: ${bestPair?.priceChange?.h24 || 0}%
Sentiment: ${cgCoin?.sentiment_votes_up_percentage || 0}% positive
Dev activity: ${cgCoin?.developer_data?.commit_count_4_weeks || 0} commits/4w`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 900,
      messages: [{
        role: "user",
        content: `You are Pulse's manipulation radar. Analyze real data for ${query}.
${context}

Detect: coordinated shilling, bot armies, wash trading, narrative injection, exit liquidity manufacturing.
Respond ONLY with JSON:
{
  "token": "string",
  "botActivityIndex": number 0-100,
  "shillCoordination": number 0-100,
  "washTradePercent": number 0-100,
  "narrativeAge": "string",
  "overallManipulationScore": number 0-100,
  "manipulationLevel": "LOW|MODERATE|HIGH|EXTREME",
  "detectedOperations": [{"severity": "critical|high|medium", "title": "string", "description": "string"}],
  "verdict": "string (2 sentences, direct)"
}`
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return NextResponse.json({
      ...parsed,
      realSignalsDetected: realSignals,
      dataSource: [
        bestPair ? "DexScreener ✓" : "DexScreener ✗",
        cgCoin ? "CoinGecko ✓" : "CoinGecko ✗",
        "Claude AI ✓",
      ].join(" · "),
    });

  } catch (err) {
    console.error("Manipulation radar error:", err);
    return NextResponse.json({ error: "Scan failed." }, { status: 500 });
  }
}
