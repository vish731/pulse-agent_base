// REAL Conviction Analyzer — DexScreener + CoinGecko + Claude AI
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { searchDex, getBestPair, analyzeDexSignals } from "@/lib/data/dexscreener";
import { searchCoin, getCoinData, analyzeCGSignals } from "@/lib/data/coingecko";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Pulse — elite crypto conviction agent on Base L2.

You receive REAL onchain data and must give sharp conviction analysis.

Score each 0-100:
- hype: How much noise/attention (high ≠ good)
- conviction: Is smart money actually buying?
- organic: Is community real or manufactured?
- insider: Are alpha wallets/insiders positioning?
- sustainability: Does narrative have real structural legs?

Also give:
- verdict: "manufactured" | "caution" | "early" | "organic" | "high_conviction"
- verdictLabel: short human label
- riskLevel: "low" | "medium" | "high" | "extreme"
- signals: array of {type: "bullish"|"bearish"|"neutral", category: string, message: string}
- summary: 1-2 sharp sentences — be direct, not generic
- uniqueEdge: the hidden pattern most analysts miss — specific, not obvious

Use the real data provided. Do not make things up. If data is limited, say so in your signals.

Respond ONLY with valid JSON, no preamble, no backticks.`;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

    // Fetch real data in parallel
    const [dexResult, cgCoin] = await Promise.all([
      searchDex(query),
      searchCoin(query).then(found => found ? getCoinData(found.id) : null),
    ]);

    const bestPair = getBestPair(dexResult.pairs);
    const dexAnalysis = bestPair ? analyzeDexSignals(bestPair) : null;
    const cgAnalysis = cgCoin ? analyzeCGSignals(cgCoin) : null;

    // Build real data context for Claude
    const realDataContext = `
REAL DATA FOR: "${query}"

=== DEX DATA (DexScreener) ===
${bestPair ? `
Token: ${bestPair.baseToken.name} (${bestPair.baseToken.symbol})
Price: $${bestPair.priceUsd}
24h Change: ${bestPair.priceChange?.h24 || 0}%
1h Change: ${bestPair.priceChange?.h1 || 0}%
24h Volume: $${(bestPair.volume?.h24 || 0).toLocaleString()}
Liquidity: $${(bestPair.liquidity?.usd || 0).toLocaleString()}
24h Buys: ${bestPair.txns?.h24?.buys || 0}
24h Sells: ${bestPair.txns?.h24?.sells || 0}
Buy Ratio: ${dexAnalysis?.buyRatio}%
Pair Age: ${dexAnalysis?.ageDays} days
DEX Signals: ${JSON.stringify(dexAnalysis?.signals)}
` : "No DEX data found for this token."}

=== MARKET DATA (CoinGecko) ===
${cgCoin ? `
Name: ${cgCoin.name} (${cgCoin.symbol?.toUpperCase()})
Market Cap: $${(cgCoin.market_data?.market_cap?.usd || 0).toLocaleString()}
24h Volume: $${(cgCoin.market_data?.total_volume?.usd || 0).toLocaleString()}
Price Change 24h: ${cgCoin.market_data?.price_change_percentage_24h || 0}%
Price Change 7d: ${cgCoin.market_data?.price_change_percentage_7d || 0}%
Sentiment Up: ${cgCoin.sentiment_votes_up_percentage || 0}%
Twitter Followers: ${(cgCoin.community_data?.twitter_followers || 0).toLocaleString()}
Reddit Subscribers: ${(cgCoin.community_data?.reddit_subscribers || 0).toLocaleString()}
Dev Commits (4w): ${cgCoin.developer_data?.commit_count_4_weeks || 0}
Circulating/Total Supply: ${cgCoin.market_data?.circulating_supply?.toLocaleString()} / ${cgCoin.market_data?.total_supply?.toLocaleString()}
CG Analysis: ${JSON.stringify(cgAnalysis?.signals)}
` : "Not found on CoinGecko — likely very new or unlisted."}

Based on this real data, provide conviction analysis.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: realDataContext }],
    });

    const text = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    // Attach real market data to response
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
        "Claude AI ✓",
      ].join(" · "),
    });

  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "Analysis failed." }, { status: 500 });
  }
}
