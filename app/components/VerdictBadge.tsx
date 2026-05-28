"use client";

import { AnalysisResult } from "@/lib/types";

const VERDICT_CONFIG: Record<
  AnalysisResult["verdict"],
  { label: string; classes: string; border: string }
> = {
  manufactured: {
    label: "⚠ Manufactured Hype",
    classes: "bg-red-950 text-red-300",
    border: "border-red-700",
  },
  caution: {
    label: "⚡ High Hype / Low Conviction",
    classes: "bg-amber-950 text-amber-300",
    border: "border-amber-700",
  },
  early: {
    label: "🔭 Early Signal",
    classes: "bg-blue-950 text-blue-300",
    border: "border-blue-700",
  },
  organic: {
    label: "✦ Organic Growth",
    classes: "bg-green-950 text-green-300",
    border: "border-green-800",
  },
  high_conviction: {
    label: "🎯 High Conviction",
    classes: "bg-emerald-950 text-emerald-300",
    border: "border-emerald-700",
  },
};

export function VerdictBadge({
  verdict,
}: {
  verdict: AnalysisResult["verdict"];
}) {
  const cfg = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.caution;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cfg.classes} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

export function VerdictSummary({ result }: { result: AnalysisResult }) {
  const cfg = VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG.caution;
  return (
    <div
      className={`rounded-xl p-4 border ${cfg.border} ${cfg.classes} border-opacity-60`}
    >
      <p className="text-sm font-medium leading-relaxed">{result.summary}</p>
    </div>
  );
}

export function UniqueEdge({ edge }: { edge: string }) {
  return (
    <div className="rounded-xl p-4 border border-purple-800 bg-purple-950">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
          Pulse Signal
        </span>
        <span className="text-purple-500 text-xs">· hidden pattern</span>
      </div>
      <p className="text-sm text-purple-200">{edge}</p>
    </div>
  );
}

