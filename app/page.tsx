import { WalletButton } from "./components/WalletButton";
import { AnalysisPanel } from "./components/AnalysisPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg
              viewBox="0 0 18 18"
              fill="none"
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline
                points="1,13 4,8 7,11 10,5 13,10 17,4"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            Pulse
          </span>
          <span className="text-gray-600 text-xs hidden sm:inline">
            · conviction agent
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 hidden sm:inline">
            Built on Base
          </span>
          <WalletButton />
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 pt-16 pb-8">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-900 bg-blue-950 text-blue-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            AI · Onchain Psychology Engine · Base L2
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            Signal vs Noise.
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-lg mx-auto">
            Every tool tells you <span className="text-white">WHAT</span> is
            happening. Pulse tells you{" "}
            <span className="text-blue-400 font-semibold">
              WHAT ACTUALLY MATTERS
            </span>
            .
          </p>
        </div>

        {/* Main analysis panel */}
        <AnalysisPanel />
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20 px-6 py-6 text-center">
        <p className="text-xs text-gray-700">
          Pulse · Not financial advice · Built on Base ·{" "}
          <a
            href="https://base.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-500 transition-colors"
          >
            base.org
          </a>
        </p>
      </footer>
    </main>
  );
}

