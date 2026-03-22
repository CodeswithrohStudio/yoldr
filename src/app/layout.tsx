import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = "https://yoldr-codeswithrohs-projects.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Yoldr — Yield Protected DeFi on Flow",
    template: "%s | Yoldr",
  },
  description:
    "You Only Lose (the) yield, Really. Deposit FLOW, lock your principal forever safe, and send your daily yield adventuring on leveraged shield positions. Built on Flow blockchain.",

  keywords: [
    "DeFi", "Flow blockchain", "principal protected", "yield farming",
    "zero-coupon", "crypto savings", "NFT gamification",
    "leveraged positions", "FLOW token",
  ],

  authors: [{ name: "Yoldr", url: BASE_URL }],
  creator: "Yoldr",
  publisher: "Yoldr",

  // ── Favicon / icons ──────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16",  type: "image/png" },
      { url: "/favicon.png",    sizes: "32x32",  type: "image/png" },
      { url: "/icon.png",       sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },

  // ── Open Graph (WhatsApp, Discord, Facebook, LinkedIn) ───────────────────
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Yoldr",
    title: "Yoldr — Yield Protected DeFi",
    description:
      "Your yield goes adventuring. Your principal stays home. Principal-protected leveraged positions on Flow blockchain.",
    images: [
      {
        url: "/og-image.png",
        width: 630,
        height: 630,
        alt: "Yoldr — Yield Protected DeFi",
      },
    ],
    locale: "en_US",
  },

  // ── Twitter / X card ─────────────────────────────────────────────────────
  twitter: {
    card: "summary",
    site: "@yoldrfi",
    creator: "@yoldrfi",
    title: "Yoldr — Yield Protected DeFi",
    description: "Your yield goes adventuring. Your principal stays home. Built on Flow.",
    images: ["/og-image.png"],
  },

  // ── PWA manifest ─────────────────────────────────────────────────────────
  manifest: "/manifest.json",

  // ── Robots ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  // ── Canonical ────────────────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Yoldr" />
      </head>
      <body>{children}</body>
    </html>
  );
}
