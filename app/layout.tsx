import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Pulse — Conviction Agent",
  description:
    "AI-powered crypto signal vs noise engine. Not WHAT is happening — WHAT ACTUALLY MATTERS.",
  openGraph: {
    title: "Pulse — Conviction Agent",
    description: "Cut through crypto noise. Get real conviction signals.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} bg-gray-950 text-white antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

