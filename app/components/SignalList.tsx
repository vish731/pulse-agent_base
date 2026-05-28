"use client";

import { Signal } from "@/lib/types";

interface SignalListProps {
  signals: Signal[];
}

const SIGNAL_ICONS: Record<string, string> = {
  bullish: "✓",
  bearish: "✗",
  neutral: "◉",
};

const SIGNAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bullish: { bg: "bg-green-950", text: "text-green-400", border: "border-green-800" },
  bearish: { bg: "bg-red-950", text: "text-red-400", border: "border-red-900" },
  neutral: { bg: "bg-blue-950", text: "text-blue-400", border: "border-blue-900" },
};

const CATEGORY_ICONS: Record<string, string> = {
  "Smart Money": "💎",
  Community: "👥",
  "Dev History": "🔧",
  Unlocks: "🔓",
  Narrative: "📡",
  "KOL Activity": "📢",
  "Onchain Pattern": "⛓️",
};

export function SignalList({ signals }: SignalListProps) {
  return (
    <div className="space-y-2">
      {signals.map((signal, i) => {
        const colors = SIGNAL_COLORS[signal.type];
        const icon = SIGNAL_ICONS[signal.type];
        const catIcon = CATEGORY_ICONS[signal.category] ?? "●";

        return (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border}`}
          >
            <span
              className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors.text}`}
            >
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-500 mr-1">
                {catIcon} {signal.category}
              </span>
              <p className="text-sm text-gray-300 mt-0.5">{signal.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

