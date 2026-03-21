import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yoldr — Market upside. Your savings, always safe.",
  description: "Principal-protected yield product on Flow. Market exposure. Zero risk to your savings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0F172A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
