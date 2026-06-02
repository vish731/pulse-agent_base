import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchDex, getBestPair, analyzeDexSignals } from "@/lib/data/dexscreener";
import { searchCoin, getCoinData, analyzeCGSignals } from "@/lib/data/coingecko";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are Pulse — elite crypto conviction agent on Base L2.
You receive REAL onchain data and give sharp conviction analysis.

Score each 0-100:
- hype: noise level (high is bad)
- conviction: smart money buying?
- organic: community real or fake?
- insider: alpha wallets positioning?
- sustainability: real structural legs?

Give:
- verdict: "manufactured"|"caution"|"early"|"organic"|"high_conviction"
- verdictLabel: short label
- riskLevel: "low"|"medium"|"high"|"extreme"
- signals: [{type:"bullish"|"bearish"|"neutral", category:string, message:string}]
- summary: 1-2 sharp sentences
- uniqueEdge: hidden pattern most analysts miss

Respond ONLY with valid JSON. No backticks. No preamble.`;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

    const [dexResult, cgCoin] = await Promise.all([
      searchDex(query),
      searchCoin(query).then(found => found ? getCoinData(found.id) : null),
    ]);

    const bestPair = getBestPair(dexResult.pairs);
    const dexAnalysis = bestPair ? analyzeDexSignals(bestPair) : null;
    const cgAnalysis = cgCoin ? analyzeCGSignals(cgCoin) : null;

    const realDataContext = `Analyze "${query}" with this REAL data:
DEX: ${bestPair ? `Price $${bestPair.priceUsd}, Volume $${bestPair.volume?.h24?.toLocaleString()}, Liquidity $${bestPair.liquidity?.usd?.toLocaleString()}, 24h change ${bestPair.priceChange?.h24}%, Buys/Sells ${bestPair.txns?.h24?.buys}/${bestPair.txns?.h24?.sells}, Age ${dexAnalysis?.ageDays} days` : "Not found on DEX"}
CoinGecko: ${cgCoin ? `MCap $${cgCoin.market_data?.market_cap?.usd?.toLocaleString()}, Sentiment ${cgCoin.sentiment_votes_up_percentage}% positive, Dev commits ${cgCoin.developer_data?.commit_count_4_weeks}/4w, Twitter ${cgCoin.community_data?.twitter_followers?.toLocaleString()} followers` : "Not on CoinGecko"}
DEX Signals: ${JSON.stringify(dexAnalysis?.signals || [])}
CG Signals: ${JSON.stringify(cgAnalysis?.signals || [])}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(SYSTEM_PROMPT + "\n\n" + realDataContext);
    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return NextResponse.json({
      ...parsed,
      realData: {
        priceUsd: bestPair?.priceUsd,
        volume24h: bestPair?.volume?.h24,
        liquidity: bestPair?.liquidity?.usd,
        priceChange24h: bestPair?.priceChange?.h24,
        marketCap: cgCoin?.market_data?.market_cap?.usd,
        twitterFollowers: cgCoin?.community_data?.twitter_followers,
        commitCount: cgCoin?.developer_data?.commit_count_4_weeks,
        buyRatio: dexAnalysis?.buyRatio,
        ageDays: dexAnalysis?.ageDays,
      },
      dataSource: [
        bestPair ? "DexScreener ✓" : "DexScreener ✗",
        cgCoin ? "CoinGecko ✓" : "CoinGecko ✗",
        "Gemini AI ✓",
      ].join(" · "),
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "Analysis failed." }, { status: 500 });
  }
}
