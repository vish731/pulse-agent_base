import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { scanTokenSecurity, parseGoPlusThreats, CHAIN_IDS } from "@/lib/data/goplus";
import { getDexData, getBestPair, analyzeDexSignals } from "@/lib/data/dexscreener";
import { getDeployerAddress, getDeployerHistory, isContractVerified } from "@/lib/data/basescan";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function isContractAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input.trim());
}
function isURL(input: string): boolean {
  return input.includes("http") || input.includes("www.") || input.includes(".io") || input.includes(".xyz") || input.includes(".com");
}

export async function POST(req: NextRequest) {
  try {
    const { query, chainId } = await req.json();
    if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

    const input = query.trim();
    const chain = chainId || CHAIN_IDS.base;
    const result: Record<string, unknown> = { query: input };

    if (isContractAddress(input)) {
      const [goplusResult, dexResult, deployerAddr, verified] = await Promise.all([
        scanTokenSecurity(input, chain),
        getDexData(input),
        getDeployerAddress(input),
        isContractVerified(input),
      ]);

      let totalThreatScore = 0;
      const allThreats: unknown[] = [];
      const allSignals: unknown[] = [];

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

      const bestPair = getBestPair(dexResult.pairs);
      if (bestPair) {
        const dexAnalysis = analyzeDexSignals(bestPair);
        totalThreatScore += dexAnalysis.hypeScore * 0.3;
        allSignals.push(...dexAnalysis.signals);
        result.priceUsd = dexAnalysis.priceUsd;
        result.volume24h = dexAnalysis.volume24h;
        result.liquidity = dexAnalysis.liquidity;
      }

      if (deployerAddr) {
        const deployerHistory = await getDeployerHistory(deployerAddr);
        result.deployerAddress = deployerAddr;
        if (deployerHistory.isHighRisk) {
          allThreats.push({ severity: "high", label: `⚠ Serial Deployer: ${deployerHistory.contractsDeployed} contracts`, desc: "High rug correlation." });
          totalThreatScore += 15;
        }
      }

      if (!verified) {
        allThreats.push({ severity: "medium", label: "~ Contract Not Verified", desc: "Cannot audit for hidden functions." });
        totalThreatScore += 8;
      }

      const finalThreatScore = Math.min(Math.round(totalThreatScore), 100);
      const riskLevel = finalThreatScore >= 70 ? "EXTREME" : finalThreatScore >= 45 ? "HIGH" : finalThreatScore >= 20 ? "MEDIUM" : "LOW";

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const aiResult = await model.generateContent(`You are Pulse crypto security agent. Write sharp 2-sentence verdict:
Token: ${result.tokenName || input}, Threat: ${finalThreatScore}/100, Honeypot: ${result.isHoneypot}, LP Locked: ${result.lpLocked}, Sell Tax: ${result.sellTax}%
Threats: ${(allThreats as Array<{label:string}>).map(t => t.label).join(", ")}
Be direct.`);

      return NextResponse.json({
        ...result, threatScore: finalThreatScore, riskLevel,
        threats: allThreats, signals: allSignals,
        verdict: aiResult.response.text(),
        isScam: finalThreatScore >= 70,
        dataSource: "GoPlus + DexScreener + Basescan + Gemini AI",
      });
    }

    if (isURL(input)) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const aiResult = await model.generateContent(`Analyze URL for crypto phishing: "${input}". JSON only: {"threatScore":number,"riskLevel":"LOW|MEDIUM|HIGH|EXTREME","threats":[{"severity":"safe|warning|danger","label":"string","desc":"string"}],"verdict":"string","isScam":boolean}`);
      const parsed = JSON.parse(aiResult.response.text().replace(/```json|```/g, "").trim());
      return NextResponse.json({ ...parsed, query: input, dataSource: "Gemini AI" });
    }

    const dexSearch = await import("@/lib/data/dexscreener").then(m => m.searchDex(input));
    const topPair = getBestPair(dexSearch.pairs);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const aiResult = await model.generateContent(`Analyze "${input}" for scam risk.
DEX: ${topPair ? `Price $${topPair.priceUsd}, Liq $${topPair.liquidity?.usd?.toLocaleString()}, Age ${Math.floor((Date.now()-(topPair.pairCreatedAt||Date.now()))/86400000)}d, Buys/Sells ${topPair.txns?.h24?.buys}/${topPair.txns?.h24?.sells}` : "Not found"}
JSON only: {"threatScore":number,"riskLevel":"LOW|MEDIUM|HIGH|EXTREME","threats":[{"severity":"safe|warning|danger","label":"string","desc":"string"}],"verdict":"string","isScam":boolean}`);
    const parsed = JSON.parse(aiResult.response.text().replace(/```json|```/g, "").trim());
    return NextResponse.json({ ...parsed, query: input, dataSource: "DexScreener + Gemini AI" });

  } catch (err) {
    console.error("Scam error:", err);
    return NextResponse.json({ error: "Scan failed." }, { status: 500 });
  }
}
