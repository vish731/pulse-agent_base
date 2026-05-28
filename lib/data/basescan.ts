// Basescan API — Free, 100k calls/day
// Get key: basescan.org/apis
// Docs: docs.basescan.org

const BASESCAN_BASE = "https://api.basescan.org/api";

function getKey() {
  return process.env.BASESCAN_API_KEY || "";
}

export interface TokenInfo {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  divisor: string;
  tokenType: string;
  totalSupply: string;
  blueCheckmark: string;
  description: string;
  website: string;
  email: string;
  blog: string;
  reddit: string;
  slack: string;
  facebook: string;
  twitter: string;
  bitcointalk: string;
  github: string;
  telegram: string;
  wechat: string;
  linkedin: string;
  discord: string;
  whitepaper: string;
  tokenPriceUSD: string;
}

export interface TokenHolder {
  TokenHolderAddress: string;
  TokenHolderQuantity: string;
}

export interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  input: string;
  type: string;
  gas: string;
  gasUsed: string;
  isError: string;
}

// Get deployer address from contract creation tx
export async function getDeployerAddress(contractAddress: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASESCAN_BASE}?module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${getKey()}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data.status === "1" && data.result?.[0]) {
      return data.result[0].contractCreator;
    }
    return null;
  } catch { return null; }
}

// Check if deployer has created other contracts (rug history check)
export async function getDeployerHistory(deployerAddress: string): Promise<{
  contractsDeployed: number;
  recentTxCount: number;
  firstSeen: string;
  isHighRisk: boolean;
}> {
  try {
    const res = await fetch(
      `${BASESCAN_BASE}?module=account&action=txlist&address=${deployerAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${getKey()}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const txs: Transaction[] = data.result || [];

    const contractCreations = txs.filter(tx => tx.to === "" || tx.to === null);
    const firstSeen = txs[0]
      ? new Date(parseInt(txs[0].timeStamp) * 1000).toLocaleDateString()
      : "Unknown";

    // Deployer with many contracts in short time = high risk
    const isHighRisk = contractCreations.length > 5;

    return {
      contractsDeployed: contractCreations.length,
      recentTxCount: txs.length,
      firstSeen,
      isHighRisk,
    };
  } catch {
    return { contractsDeployed: 0, recentTxCount: 0, firstSeen: "Unknown", isHighRisk: false };
  }
}

// Get top token holders
export async function getTopHolders(contractAddress: string): Promise<TokenHolder[]> {
  try {
    const res = await fetch(
      `${BASESCAN_BASE}?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=10&apikey=${getKey()}`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    return data.result || [];
  } catch { return []; }
}

// Get token transaction count (activity metric)
export async function getTokenTxCount(contractAddress: string): Promise<number> {
  try {
    const res = await fetch(
      `${BASESCAN_BASE}?module=token&action=tokentx&contractaddress=${contractAddress}&page=1&offset=1&sort=desc&apikey=${getKey()}`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    return parseInt(data.result?.[0]?.blockNumber || "0");
  } catch { return 0; }
}

// Is contract verified on Basescan?
export async function isContractVerified(contractAddress: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${BASESCAN_BASE}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${getKey()}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return data.result?.[0]?.SourceCode !== "";
  } catch { return false; }
}

