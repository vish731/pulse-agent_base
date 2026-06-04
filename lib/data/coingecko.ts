const CG_BASE = "https://api.coingecko.com/api/v3";

function getHeaders() {
  const key = process.env.COINGECKO_API_KEY;
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (key) headers.set("x-cg-demo-api-key", key);
  return headers;
}

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank: number;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    circulating_supply: number;
    total_supply: number;
  };
  community_data: {
    twitter_followers: number;
    reddit_subscribers: number;
    reddit_average_posts_48h: number;
    reddit_average_comments_48h: number;
    telegram_channel_user_count: number;
  };
  developer_data: {
    forks: number;
    stars: number;
    commit_count_4_weeks: number;
  };
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
}

export async function searchCoin(
  query: string
): Promise<{ id: string; name: string; symbol: string } | null> {
  try {
    const res = await fetch(
      `${CG_BASE}/search?query=${encodeURIComponent(query)}`,
      { headers: getHeaders() }
    );
    const data = await res.json();
    const coin = data.coins?.[0];
    return coin ? { id: coin.id, name: coin.name, symbol: coin.symbol } : null;
  } catch {
    return null;
  }
}

export async function getCoinData(coinId: string): Promise<CoinData | null> {
  try {
    const res = await fetch(
      `${CG_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`,
      { headers: getHeaders() }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function analyzeCGSignals(coin: CoinData) {
  const signals = [];
  let organicScore = 50;
  let sustainabilityScore = 50;

  const vol = coin.market_data?.total_volume?.usd || 0;
  const mcap = coin.market_data?.market_cap?.usd || 1;
  const volMcapRatio = vol / mcap;

  if (volMcapRatio > 1.5) {
    signals.push({ type: "bearish", cat: "Volume", msg: `Volume/MCap: ${volMcapRatio.toFixed(2)}x — possible wash trading.` });
    organicScore -= 20;
  } else if (volMcapRatio > 0.3) {
    signals.push({ type: "bullish", cat: "Volume", msg: `Healthy volume/MCap: ${volMcapRatio.toFixed(2)}x.` });
    organicScore += 10;
  }

  const commits = coin.developer_data?.commit_count_4_weeks || 0;
  if (commits > 50) {
    signals.push({ type: "bullish", cat: "Dev Activity", msg: `${commits} commits in 4 weeks. Active development.` });
    sustainabilityScore += 20;
  } else if (commits === 0) {
    signals.push({ type: "bearish", cat: "Dev Activity", msg: "Zero commits in 4 weeks. Development stalled." });
    sustainabilityScore -= 20;
  }

  const sentimentUp = coin.sentiment_votes_up_percentage || 0;
  if (sentimentUp > 80) {
    signals.push({ type: "neutral", cat: "Sentiment", msg: `${sentimentUp.toFixed(0)}% positive — euphoric. Peak hype risk.` });
    organicScore -= 10;
  }

  const circSupply = coin.market_data?.circulating_supply || 0;
  const totalSupply = coin.market_data?.total_supply || 0;
  const supplyRatio = totalSupply > 0 ? circSupply / totalSupply : 1;
  if (supplyRatio < 0.3) {
    signals.push({ type: "bearish", cat: "Tokenomics", msg: `Only ${(supplyRatio * 100).toFixed(0)}% circulating. Unlock pressure incoming.` });
    sustainabilityScore -= 15;
  }

  return {
    signals,
    organicScore: Math.min(Math.max(Math.round(organicScore), 0), 100),
    sustainabilityScore: Math.min(Math.max(Math.round(sustainabilityScore), 0), 100),
    volume24h: vol,
    marketCap: mcap,
    priceChange24h: coin.market_data?.price_change_percentage_24h || 0,
    commitCount: commits,
    sentimentUp,
    twitterFollowers: coin.community_data?.twitter_followers || 0,
  };
}
