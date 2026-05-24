# Pulse — Conviction Agent v3

> Not WHAT is happening. WHAT ACTUALLY MATTERS.

AI-powered crypto intelligence agent built on Base L2. Four modules covering conviction analysis, scam detection, manipulation radar, and portfolio watchlist.

## Modules

### ⬡ Conviction Scanner
Analyzes any token/narrative across 5 dimensions:
- **Hype** · **Conviction** · **Organic** · **Insider** · **Sustainability**
- Smart money flow · Community quality · KOL farming detection
- Unique "Pulse Signal" — hidden pattern most analysts miss

### 🛡 Scam & Phishing Detector *(New)*
Scans contracts, URLs, wallets, and token names for 47 threat patterns:
- Honeypot detection
- LP lock status
- Hidden mint functions
- Deployer wallet history
- Phishing URL matching
- Wallet drainer signatures

### 📡 Manipulation Radar *(New)*
Detects coordinated manipulation in real-time:
- Bot army activity index
- Coordinated shill ring detection (KOL timestamp clustering)
- Wash trading percentage
- Narrative injection patterns
- Exit liquidity manufacturing signals

### ◎ Watchlist
Track scanned tokens with live conviction scores.

---

## Why This Exists

> *"Crypto needs less AI influencers and more agents that can filter out farmed narratives before retail gets exit liquidity'd."*

Inspired by real community feedback from builders on Base. Solves the signal-vs-noise problem that every crypto user faces: too much noise, fake hype, engagement farming, fake KOLs, scam narratives.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| AI Brain | Claude Sonnet 4 (Anthropic) |
| Chain | Base L2 (wagmi v2 + viem) |
| Styling | Tailwind CSS |
| Fonts | Syne + DM Mono |

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/analyze` | POST | Conviction analysis |
| `/api/scam` | POST | Scam/phishing detection |
| `/api/manipulation` | POST | Manipulation radar |

## Setup

```bash
git clone https://github.com/yourusername/pulse-conviction-agent
cd pulse-conviction-agent
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import at vercel.com/new
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy ✓

## Project Structure

```
pulse-agent/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       # Conviction engine
│   │   ├── scam/route.ts          # Scam detector
│   │   └── manipulation/route.ts  # Manipulation radar
│   ├── components/
│   │   ├── AnalysisPanel.tsx
│   │   ├── ScoreBars.tsx
│   │   ├── SignalList.tsx
│   │   ├── VerdictBadge.tsx
│   │   ├── WalletButton.tsx
│   │   └── WatchlistPanel.tsx
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── analyze.ts
│   ├── share.ts
│   ├── types.ts
│   └── wagmi.ts
└── .env.example
```

## Roadmap

- [ ] Real onchain wallet tracking (Dune/Nansen)
- [ ] Telegram bot integration
- [ ] Farcaster Frame
- [ ] Historical conviction timeline
- [ ] Base Name Service (BNS) integration
- [ ] Live scam contract database

---

*Not financial advice. Built on Base.*
