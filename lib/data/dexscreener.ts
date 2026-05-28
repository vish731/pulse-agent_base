// DexScreener API — 100% Free, no key needed
// Docs: docs.dexscreener.com

const DS_BASE = "https://api.dexscreener.com";

export interface DexPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd: string;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  volume: { m5: number; h1: number; h6: number; h24: number };
  liquidity: { usd: number; base: number; quote: number };
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    socials?: { type: string; url: string }[];
    websites?: { url: string }[];
  };
}

export interface DexScreenerResult {
  pairs: DexPair[];
  found: boolean;
  error?: string;
}

// Search by token address
export async function getDexData(
  tokenAddress: string
): Promise<DexScreenerResult> {
  try {
    const res = await fetch(
      `${DS_BASE}/latest/dex/tokens/${tokenAddress}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) throw new Error(`DexScreener error: ${res.status}`);
    const data = await res.json();
    return { pairs: data.pairs || [], found: (data.pairs?.length || 0) > 0 };
  } catch (err) {
    return { pairs: [], found: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Search by token name/symbol
export async function searchDex(query: string): Promise<DexScreenerResult> {
  try {
    const res = await fetch(
      `${DS_BASE}/latest/dex/search?q=${encodeURIComponent(query)}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) throw new Error(`DexScreener search error: ${res.status}`);
    const data = await res.json();
    // Filter to Base chain pairs only
    const basePairs = (data.pairs || []).filter(
      (p: DexPair) => p.chainId === "base"
    );
    return {
      pairs: basePairs.length > 0 ? basePairs : (data.pairs || []).slice(0, 5),
      found: (data.pairs?.length || 0) > 0,
    };
  } catch (err) {
    return { pairs: [], found: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

// Get best pair (highest liquidity)
export function getBestPair(pairs: DexPair[]): DexPair | null {
  if (!pairs.length) return null;
  return pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
}

// Analyze DexScreener data for hype signals
export function analyzeDexSignals(pair: DexPair) {
  const signals = [];
  let hypeScore = 50;

  const h24Buys = pair.txns?.h24?.buys || 0;
  const h24Sells = pair.txns?.h24?.sells || 0;
  const totalTxns = h24Buys + h24Sells;
  const buyRatio = totalTxns > 0 ? h24Buys / totalTxns : 0;

  // Buy/sell ratio analysis
  if (buyRatio > 0.75) {
    signals.push({ type: "bearish", msg: `90%+ buy ratio (${(buyRatio*100).toFixed(0)}%) — likely wash trading or bot activity inflating buy side.` });
    hypeScore += 20;
  } else if (buyRatio > 0.6) {
    signals.push({ type: "bullish", msg: `Healthy buy pressure (${(buyRatio*100).toFixed(0)}% buys). Organic demand likely.` });
  }

  // Volume vs liquidity ratio
  const volLiqRatio = pair.volume?.h24 / (pair.liquidity?.usd || 1);
  if (volLiqRatio > 10) {
    signals.push({ type: "bearish", msg: `Volume/Liquidity ratio: ${volLiqRatio.toFixed(1)}x — extremely high, suggests artificial volume.` });
    hypeScore += 15;
  }

  // Price change analysis
  const h1Change = pair.priceChange?.h1 || 0;
  const h24Change = pair.priceChange?.h24 || 0;
  if (h1Change > 20) {
    signals.push({ type: "neutral", msg: `+${h1Change.toFixed(1)}% in 1h — rapid pump detected. Check if smart money or retail FOMO.` });
    hypeScore += 10;
  }

  // Liquidity check
  const liq = pair.liquidity?.usd || 0;
  if (liq < 50000) {
    signals.push({ type: "bearish", msg: `Low liquidity: $${(liq/1000).toFixed(1)}k — high price impact, easy to manipulate.` });
    hypeScore += 15;
  } else if (liq > 500000) {
    signals.push({ type: "bullish", msg: `Strong liquidity: $${(liq/1000).toFixed(0)}k — healthy depth, harder to manipulate.` });
    hypeScore -= 10;
  }

  // Pair age
  const ageMs = Date.now() - (pair.pairCreatedAt || Date.now());
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 3) {
    signals.push({ type: "bearish", msg: `Only ${ageDays.toFixed(0)} days old — extremely new. High rug risk window.` });
    hypeScore += 15;
  }

  return {
    signals,
    hypeScore: Math.min(Math.max(Math.round(hypeScore), 0), 100),
    buyRatio: (buyRatio * 100).toFixed(0),
    volume24h: pair.volume?.h24 || 0,
    liquidity: pair.liquidity?.usd || 0,
    priceUsd: pair.priceUsd,
    h24Change: pair.priceChange?.h24 || 0,
    ageDays: ageDays.toFixed(0),
    totalTxns24h: totalTxns,
  };
}
