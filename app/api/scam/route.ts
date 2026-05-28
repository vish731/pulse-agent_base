// REAL Scam Detector — GoPlus + Basescan + DexScreener + Claude AI
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { scanTokenSecurity, parseGoPlusThreats, CHAIN_IDS } from "@/lib/data/goplus";
import { getDexData, getBestPair, analyzeDexSignals } from "@/lib/data/dexscreener";
import { getDeployerAddress, getDeployerHistory, isContractVerified } from "@/lib/data/basescan";

const client = new Anthropic();

// Detect if input is a contract address
function isContractAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input.trim());
}

// Detect if input is a URL
function isURL(input: string): boolean {
  return input.includes("http") || input.includes("www.") || input.includes(".io") || input.includes(".xyz") || input.includes(".com");
}

export async function POST(req: NextRequest) {
  try {
    const { query, chainId } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const input = query.trim();
    const chain = chainId || CHAIN_IDS.base;
    const result: Record<string, unknown> = { query: input };

    // ---- PATH A: Contract Address — full onchain scan ----
    if (isContractAddress(input)) {
      // Run GoPlus, DexScreener, Basescan in parallel
      const [goplusResult, dexResult, deployerAddr, verified] = await Promise.all([
        scanTokenSecurity(input, chain),
        getDexData(input),
        getDeployerAddress(input),
        isContractVerified(input),
      ]);

      let totalThreatScore = 0;
      const allThreats: unknown[] = [];
      const allSignals: unknown[] = [];

      // GoPlus analysis
      if (goplusResult.found && goplusResult.raw) {
        const parsed = parseGoPlusThreats(goplusResult.raw);
        totalThreatScore += parsed.threatScore * 0.5;
        allThreats.push(...parsed.threats);
        result.tokenName = parsed.tokenName;
        result.tokenSymbol = parsed.tokenSymbol;
        result.isHoneypot = parsed.isHoneypot;
        result.buyTax = parsed.buyTax;
        result.sellTax = parsed.sellTax;
        result.holderCount = parsed.holderCount;
        result.lpLocked = parsed.lpLocked;
      }

      // DexScreener analysis
      const bestPair = getBestPair(dexResult.pairs);
      if (bestPair) {
        const dexAnalysis = analyzeDexSignals(bestPair);
        totalThreatScore += dexAnalysis.hypeScore * 0.3;
        allSignals.push(...dexAnalysis.signals);
        result.priceUsd = dexAnalysis.priceUsd;
        result.volume24h = dexAnalysis.volume24h;
        result.liquidity = dexAnalysis.liquidity;
        result.h24Change = dexAnalysis.h24Change;
        result.buyRatio = dexAnalysis.buyRatio;
        result.ageDays = dexAnalysis.ageDays;
      }

      // Deployer history
      if (deployerAddr) {
        const deployerHistory = await getDeployerHistory(deployerAddr);
        result.deployerAddress = deployerAddr;
        result.deployerContractsDeployed = deployerHistory.contractsDeployed;
        result.deployerFirstSeen = deployerHistory.firstSeen;

        if (deployerHistory.isHighRisk) {
          allThreats.push({
            severity: "high",
            label: `⚠ Serial Deployer: ${deployerHistory.contractsDeployed} contracts`,
            desc: `Deployer has created ${deployerHistory.contractsDeployed} contracts. High correlation with rug operations.`,
          });
          totalThreatScore += 15;
        }
      }

      if (!verified) {
        allThreats.push({
          severity: "medium",
          label: "~ Contract Not Verified",
          desc: "Source code not verified on Basescan. Cannot audit for hidden functions.",
        });
        totalThreatScore += 8;
      }

      const finalThreatScore = Math.min(Math.round(totalThreatScore), 100);
      const riskLevel =
        finalThreatScore >= 70 ? "EXTREME" :
        finalThreatScore >= 45 ? "HIGH" :
        finalThreatScore >= 20 ? "MEDIUM" : "LOW";

      // Ask Claude to synthesize the verdict
      const aiVerdict = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `You are Pulse, a crypto security agent. Based on this onchain scan data, write a sharp 2-sentence verdict:
Token: ${result.tokenName || input}
Threat Score: ${finalThreatScore}/100
Is Honeypot: ${result.isHoneypot}
LP Locked: ${result.lpLocked}
Sell Tax: ${result.sellTax}%
Threats found: ${(allThreats as Array<{label: string}>).map(t => t.label).join(", ")}
Be direct. If dangerous, say so clearly. If safe, confirm it.`
        }],
      });

      const verdictText = aiVerdict.content[0].type === "text" ? aiVerdict.content[0].text : "Scan complete.";

      return NextResponse.json({
        ...result,
        threatScore: finalThreatScore,
        riskLevel,
        threats: allThreats,
        signals: allSignals,
        verdict: verdictText,
        isScam: finalThreatScore >= 70,
        dataSource: "GoPlus + DexScreener + Basescan + Claude AI",
      });
    }

    // ---- PATH B: URL — phishing check via Claude ----
    if (isURL(input)) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: `Analyze this URL for crypto phishing/scam patterns: "${input}"
Check: domain age indicators, typosquatting of known projects, suspicious TLD, known phishing patterns.
Respond as JSON only: {"threatScore": number, "riskLevel": "LOW|MEDIUM|HIGH|EXTREME", "threats": [{"severity": "safe|warning|danger", "label": "string", "desc": "string"}], "verdict": "string", "isScam": boolean}`
        }],
      });
      const text = response.content[0].type === "text" ? response.content[0].text : "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      return NextResponse.json({ ...parsed, query: input, dataSource: "Claude AI" });
    }

    // ---- PATH C: Token name — search + analyze ----
    const [dexSearch] = await Promise.all([
      import("@/lib/data/dexscreener").then(m => m.searchDex(input)),
    ]);

    const topPair = getBestPair(dexSearch.pairs);
    const dexContext = topPair ? `
Price: $${topPair.priceUsd}
Liquidity: $${(topPair.liquidity?.usd || 0).toLocaleString()}
24h Volume: $${(topPair.volume?.h24 || 0).toLocaleString()}
24h Change: ${topPair.priceChange?.h24 || 0}%
Age: ${Math.floor((Date.now() - (topPair.pairCreatedAt || Date.now())) / 86400000)} days old
Buy/Sell ratio: ${topPair.txns?.h24?.buys || 0} buys / ${topPair.txns?.h24?.sells || 0} sells` : "No DEX data found";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `You are Pulse security agent. Analyze "${input}" crypto token for scam risk.
Real DEX data: ${dexContext}
Respond as JSON only: {"threatScore": number 0-100, "riskLevel": "LOW|MEDIUM|HIGH|EXTREME", "threats": [{"severity": "safe|warning|danger", "label": "string", "desc": "string"}], "verdict": "string (2 sentences, direct)", "isScam": boolean}`
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return NextResponse.json({
      ...parsed,
      query: input,
      priceUsd: topPair?.priceUsd,
      volume24h: topPair?.volume?.h24,
      liquidity: topPair?.liquidity?.usd,
      dataSource: "DexScreener + Claude AI",
    });

  } catch (err) {
    console.error("Scam detector error:", err);
    return NextResponse.json({ error: "Scan failed. Please try again." }, { status: 500 });
  }
}
