"use client";

import { ConvictionScore } from "@/lib/types";

interface ScoreBarsProps {
  scores: ConvictionScore;
}

const SCORE_META = [
  { key: "hype" as const, label: "Hype", invert: true },
  { key: "conviction" as const, label: "Conviction", invert: false },
  { key: "organic" as const, label: "Organic", invert: false },
  { key: "insider" as const, label: "Insider", invert: false },
  { key: "sustainability" as const, label: "Sustainability", invert: false },
];

function getScoreColor(value: number, invert: boolean): string {
  const effective = invert ? 100 - value : value;
  if (effective >= 70) return "#22c55e"; // green
  if (effective >= 45) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

export function ScoreBars({ scores }: ScoreBarsProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {SCORE_META.map(({ key, label, invert }) => {
        const value = scores[key];
        const color = getScoreColor(value, invert);
        return (
          <div key={key} className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {label}
            </div>
            <div
              className="text-2xl font-semibold tabular-nums"
              style={{ color }}
            >
              {value}
            </div>
            <div className="w-full h-1 rounded-full bg-gray-800">
              <div
                className="h-1 rounded-full transition-all duration-700"
                style={{ width: `${value}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

