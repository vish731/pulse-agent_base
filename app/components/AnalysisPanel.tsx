"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/types";
import { ScoreBars } from "./ScoreBars";
import { SignalList } from "./SignalList";
import {
  VerdictBadge,
  VerdictSummary,
  UniqueEdge,
} from "./VerdictBadge";

const QUICK_TOKENS = [
  "$BRETT",
  "$DEGEN",
  "$TOSHI",
  "$NORMIE",
  "$HIGHER",
  "Base AI",
  "$BALD",
  "Farcaster narrative",
];

export function AnalysisPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<string | null>(null);

  async function analyze(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActiveChip(null);
    analyze(query);
  }

  function handleChip(token: string) {
    setActiveChip(token);
    setQuery(token);
    analyze(token);
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter token, contract address, or narrative… e.g. $PEPE, Base meme szn"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {loading ? "Scanning…" : "Analyze"}
        </button>
      </form>

      {/* Quick tokens */}
      <div className="flex flex-wrap gap-2">
        {QUICK_TOKENS.map((token) => (
          <button
            key={token}
            onClick={() => handleChip(token)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              activeChip === token
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
            }`}
          >
            {token}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">
              Scanning narratives, wallets, and signals…
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Checking smart money flow · community quality · engagement patterns
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-900 bg-red-950 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-6 animate-fade-up">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{result.token}</h2>
              <div className="flex items-center gap-2 mt-2">
                <VerdictBadge verdict={result.verdict} />
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    result.riskLevel === "extreme"
                      ? "bg-red-950 text-red-400"
                      : result.riskLevel === "high"
                      ? "bg-orange-950 text-orange-400"
                      : result.riskLevel === "medium"
                      ? "bg-yellow-950 text-yellow-400"
                      : "bg-green-950 text-green-400"
                  }`}
                >
                  {result.riskLevel.toUpperCase()} RISK
                </span>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Narrative Health Score
            </h3>
            <ScoreBars scores={result.scores} />
          </div>

          {/* Signals */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Signals
            </h3>
            <SignalList signals={result.signals} />
          </div>

          {/* Unique Edge — Pulse's secret weapon */}
          {result.uniqueEdge && <UniqueEdge edge={result.uniqueEdge} />}

          {/* Verdict */}
          <VerdictSummary result={result} />
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="rounded-2xl border border-dashed border-gray-800 p-12 text-center">
          <div className="text-4xl mb-4 opacity-40">⬡</div>
          <p className="text-gray-600 text-sm">
            Enter a token or narrative above to get your conviction analysis
          </p>
          <p className="text-gray-700 text-xs mt-2">
            Pulse doesn&apos;t tell you WHAT is happening. It tells you WHAT
            ACTUALLY MATTERS.
          </p>
        </div>
      )}
    </div>
  );
}
