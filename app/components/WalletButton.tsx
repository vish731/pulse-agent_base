"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-sm text-gray-300 hover:border-gray-500 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  const injected = connectors.find((c) => c.id === "injected");
  return (
    <button
      onClick={() => injected && connect({ connector: injected })}
      className="px-4 py-2 rounded-xl border border-gray-700 text-sm text-gray-400 hover:border-pulse-blue hover:text-white transition-colors"
    >
      Connect Wallet
    </button>
  );
}

