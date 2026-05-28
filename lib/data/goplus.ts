// GoPlus Security API — Free, no key needed
// Docs: docs.gopluslabs.io

const GOPLUS_BASE_URL = "https://api.gopluslabs.io/api/v1";

// Chain IDs
export const CHAIN_IDS = {
  ethereum: "1",
  base: "8453",
  bsc: "56",
  polygon: "137",
  arbitrum: "42161",
  solana: "solana",
};

export interface GoPlusTokenSecurity {
  is_honeypot: "0" | "1";
  honeypot_with_same_creator: "0" | "1";
  buy_tax: string;           // e.g. "0.05" = 5%
  sell_tax: string;
  is_mintable: "0" | "1";
  is_proxy: "0" | "1";
  is_blacklisted: "0" | "1";
  is_whitelisted: "0" | "1";
  is_open_source: "0" | "1";
  owner_address: string;
  creator_address: string;
  lp_holders: LPHolder[];
  holders: Holder[];
  holder_count: string;
  total_supply: string;
  token_name: string;
  token_symbol: string;
  owner_percent: string;
  creator_percent: string;
  can_take_back_ownership: "0" | "1";
  owner_change_balance: "0" | "1";
  hidden_owner: "0" | "1";
  selfdestruct: "0" | "1";
  external_call: "0" | "1";
  is_in_dex: "0" | "1";
  is_anti_whale: "0" | "1";
  anti_whale_modifiable: "0" | "1";
  trading_cooldown: "0" | "1";
  personal_slippage_modifiable: "0" | "1";
}

export interface LPHolder {
  address: string;
  tag: string;
  is_contract: number;
  balance: string;
  percent: string;
  is_locked: number;
  locked_detail?: { amount: string; end_time: string; opt: string }[];
}

export interface Holder {
  address: string;
  tag: string;
  is_contract: number;
  balance: string;
  percent: string;
  is_locked: number;
}

export interface GoPlusResult {
  raw: GoPlusTokenSecurity | null;
  found: boolean;
  error?: string;
}

export async function scanTokenSecurity(
  contractAddress: string,
  chainId: string = CHAIN_IDS.base
): Promise<GoPlusResult> {
  try {
    const url = `${GOPLUS_BASE_URL}/token_security/${chainId}?contract_addresses=${contractAddress.toLowerCase()}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 }, // cache 1 min
    });

    if (!res.ok) throw new Error(`GoPlus API error: ${res.status}`);

    const data = await res.json();
    if (data.code !== 1) throw new Error(data.message || "GoPlus returned error");

    const tokenData = data.result?.[contractAddress.toLowerCase()];
    if (!tokenData) return { raw: null, found: false };

    return { raw: tokenData as GoPlusTokenSecurity, found: true };
  } catch (err) {
    return {
      raw: null,
      found: false,
      error: err instanceof Error ? err.message : "GoPlus scan failed",
    };
  }
}

// Parse GoPlus raw data into clean threat signals
export function parseGoPlusThreats(raw: GoPlusTokenSecurity) {
  const threats = [];
  let threatScore = 0;

  // CRITICAL threats (30pts each)
  if (raw.is_honeypot === "1") {
    threats.push({ severity: "critical", label: "🚨 Honeypot Detected", desc: "You can buy but CANNOT sell. This is a trap." });
    threatScore += 35;
  }
  if (raw.is_mintable === "1") {
    threats.push({ severity: "critical", label: "🚨 Unlimited Mint Function", desc: "Owner can mint infinite tokens at any time — infinite dilution." });
    threatScore += 25;
  }
  if (raw.hidden_owner === "1") {
    threats.push({ severity: "critical", label: "🚨 Hidden Owner", desc: "Contract has a concealed owner who can modify behavior without detection." });
    threatScore += 25;
  }
  if (raw.can_take_back_ownership === "1") {
    threats.push({ severity: "critical", label: "🚨 Ownership Reclaim", desc: "Renounced ownership can be taken back. Not truly renounced." });
    threatScore += 20;
  }
  if (raw.selfdestruct === "1") {
    threats.push({ severity: "critical", label: "🚨 Self-Destruct Function", desc: "Contract can be destroyed, wiping all balances." });
    threatScore += 25;
  }

  // HIGH threats (15pts each)
  const buyTax = parseFloat(raw.buy_tax || "0") * 100;
  const sellTax = parseFloat(raw.sell_tax || "0") * 100;
  if (sellTax > 10) {
    threats.push({ severity: "high", label: `⚠ High Sell Tax: ${sellTax.toFixed(1)}%`, desc: `${sellTax.toFixed(1)}% tax on every sell. Kills exit liquidity.` });
    threatScore += Math.min(sellTax * 1.5, 20);
  }
  if (raw.is_blacklisted === "1") {
    threats.push({ severity: "high", label: "⚠ Blacklist Function", desc: "Owner can block specific wallets from trading — can target you." });
    threatScore += 15;
  }
  if (raw.owner_change_balance === "1") {
    threats.push({ severity: "high", label: "⚠ Balance Manipulation", desc: "Owner can modify token balances directly. Dangerous." });
    threatScore += 20;
  }
  if (raw.trading_cooldown === "1") {
    threats.push({ severity: "high", label: "⚠ Trading Cooldown", desc: "Artificial delays on selling can prevent timely exits." });
    threatScore += 10;
  }
  if (raw.personal_slippage_modifiable === "1") {
    threats.push({ severity: "high", label: "⚠ Slippage Manipulation", desc: "Owner can set personal slippage limits per wallet." });
    threatScore += 10;
  }

  // MEDIUM threats (5pts each)
  if (raw.is_open_source !== "1") {
    threats.push({ severity: "medium", label: "~ Unverified Contract", desc: "Source code not publicly verified. Cannot audit for hidden functions." });
    threatScore += 8;
  }

  // Check LP lock status
  const lpLocked = raw.lp_holders?.some(lp => lp.is_locked === 1);
  if (!lpLocked && raw.is_in_dex === "1") {
    threats.push({ severity: "high", label: "⚠ LP Not Locked", desc: "Liquidity can be pulled at any time. Rug risk is real." });
    threatScore += 18;
  }

  // Whale concentration
  const topHolderPct = parseFloat(raw.holders?.[0]?.percent || "0") * 100;
  if (topHolderPct > 20) {
    threats.push({ severity: "high", label: `⚠ Whale Concentration: ${topHolderPct.toFixed(1)}%`, desc: `Top wallet holds ${topHolderPct.toFixed(1)}% of supply. Single dump risk.` });
    threatScore += 12;
  }

  // SAFE signals
  if (raw.is_honeypot === "0") {
    threats.push({ severity: "safe", label: "✓ Not a Honeypot", desc: "Selling function works normally. You can exit." });
  }
  if (raw.is_open_source === "1") {
    threats.push({ severity: "safe", label: "✓ Contract Verified", desc: "Source code publicly auditable on block explorer." });
  }
  if (lpLocked) {
    threats.push({ severity: "safe", label: "✓ LP Locked", desc: "Liquidity pool is locked. Owner cannot pull funds immediately." });
  }
  if (raw.is_mintable === "0") {
    threats.push({ severity: "safe", label: "✓ No Mint Function", desc: "Token supply is fixed. No inflation risk from owner." });
  }

  return {
    threats,
    threatScore: Math.min(Math.round(threatScore), 100),
    buyTax: buyTax.toFixed(1),
    sellTax: sellTax.toFixed(1),
    holderCount: parseInt(raw.holder_count || "0"),
    isHoneypot: raw.is_honeypot === "1",
    lpLocked,
    tokenName: raw.token_name,
    tokenSymbol: raw.token_symbol,
  };
}

