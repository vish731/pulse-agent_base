import { AnalysisResult } from "./types";

export function buildShareText(result: AnalysisResult): string {
  const riskEmoji: Record<string, string> = {
    low: "🟢", medium: "🟡", high: "🟠", extreme: "🔴",
  };

  return `⬡ Pulse Analysis — ${result.token}

Conviction: ${result.scores.conviction}/100
Verdict: ${result.verdictLabel}
Risk: ${riskEmoji[result.riskLevel] ?? "⚪"} ${result.riskLevel.toUpperCase()}

Scores:
• Hype:         ${result.scores.hype}/100
• Conviction:   ${result.scores.conviction}/100
• Organic:      ${result.scores.organic}/100
• Insider:      ${result.scores.insider}/100
• Sustainability: ${result.scores.sustainability}/100

"${result.summary}"

— Pulse Conviction Agent · Built on Base`;
}

