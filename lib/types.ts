export interface ConvictionScore {
  hype: number;
  conviction: number;
  organic: number;
  insider: number;
  sustainability: number;
}

export interface Signal {
  type: "bullish" | "bearish" | "neutral";
  category: string;
  message: string;
}

export interface AnalysisResult {
  token: string;
  verdict:
    | "manufactured"
    | "caution"
    | "early"
    | "organic"
    | "high_conviction";
  verdictLabel: string;
  scores: ConvictionScore;
  signals: Signal[];
  summary: string;
  riskLevel: "low" | "medium" | "high" | "extreme";
  uniqueEdge?: string; // Pulse's unique "gut instinct" signal
}

export interface AnalyzeRequest {
  query: string;
  walletAddress?: string;
}

// ---- SCAM DETECTOR ----
export interface ThreatItem {
  status: "safe" | "warning" | "danger";
  label: string;
  description: string;
}

export interface ScamResult {
  query: string;
  threatScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  threats: ThreatItem[];
  verdict: string;
  isScam: boolean;
}

// ---- MANIPULATION RADAR ----
export interface ManipOperation {
  severity: "critical" | "high" | "medium";
  title: string;
  description: string;
}

export interface ManipResult {
  token: string;
  botActivityIndex: number;
  shillCoordination: number;
  washTradePercent: number;
  narrativeAge: string;
  overallManipulationScore: number;
  manipulationLevel: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  detectedOperations: ManipOperation[];
  verdict: string;
}


