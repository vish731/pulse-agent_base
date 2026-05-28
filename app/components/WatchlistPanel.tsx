"use client";

import { AnalysisResult } from "@/lib/types";

interface WatchlistItem {
  token: string;
  conviction: number;
  verdict: AnalysisResult["verdict"];
  verdictLabel: string;
  timestamp: Date;
}

interface WatchlistPanelProps {
  items: WatchlistItem[];
  onSelect: (token: string) => void;
  onRemove: (token: string) => void;
}

const VERDICT_COLOR: Record<AnalysisResult["verdict"], string> = {
  manufactured: "#ff4757",
  caution: "#ffb347",
  early: "#00d4ff",
  organic: "#00e5a0",
  high_conviction: "#00e5a0",
};

export function WatchlistPanel({ items, onSelect, onRemove }: WatchlistPanelProps) {
  if (items.length === 0) return null;

  return (
    <div className="border border-gray-800 rounded-xl bg-gray-900 p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">⬡ Watchlist</span>
        <span className="text-xs text-blue-400 font-mono">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.token}
            className="flex items-center gap-3 p-2.5 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-700 hover:bg-gray-800/50 transition-all group"
            onClick={() => onSelect(item.token)}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: VERDICT_COLOR[item.verdict], boxShadow: `0 0 6px ${VERDICT_COLOR[item.verdict]}` }}
            />
            <span className="flex-1 text-sm text-white font-mono">{item.token}</span>
            <span className="text-sm font-semibold" style={{ color: VERDICT_COLOR[item.verdict] }}>
              {item.conviction}
            </span>
            <span className="text-xs text-gray-600 px-2 py-0.5 border border-gray-800 rounded-full">
              {item.verdictLabel}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(item.token); }}
              className="text-gray-700 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { WatchlistItem };

