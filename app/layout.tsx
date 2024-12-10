import classNames from "classnames";
import { Toaster } from "@/components/ui/sonner";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/react"

import { DeepgramContextProvider } from "./context/DeepgramContextProvider";
import { MicrophoneContextProvider } from "./context/MicrophoneContextProvider";

import "./globals.css";

import type { Metadata, Viewport } from "next";
import { KasadaClient } from "@/utils/kasada/kasada-client";

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  width: "device-width",
  // maximumScale: 1, hitting accessability
};

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-facts.vercel.app"),
  title: "AI Facts",
  description: `Realtime fact checking with Deepgram, Perplexity, OpenAI, and the AI SDK`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-dvh">
      <body
        className={`h-full ${classNames(
          GeistMono.className,
          GeistSans.className,
        )}`}
      >
        <MicrophoneContextProvider>
          <DeepgramContextProvider>{children}</DeepgramContextProvider>
        </MicrophoneContextProvider>
        <KasadaClient />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
