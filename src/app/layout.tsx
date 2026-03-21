import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://marchmadness.zach-lloyd.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "March Madness 2026 Schedule & Scores | Every Game, Channel & Stream",
  description:
    "Stop digging through search results. Auto-updating NCAA March Madness 2026 schedule with tip times, TV channels, streaming platforms (Paramount+, Max), live scores, and full bracket. Updated every 30 seconds.",
  keywords: [
    "March Madness 2026",
    "NCAA tournament schedule",
    "March Madness schedule today",
    "NCAA basketball scores",
    "March Madness TV schedule",
    "NCAA tournament bracket 2026",
    "March Madness streaming",
    "what channel is March Madness on",
    "March Madness Paramount Plus",
    "March Madness Max",
    "NCAA tournament games today",
    "college basketball scores live",
  ],
  authors: [{ name: "Zach Lloyd", url: "https://x.com/zachlloydai" }],
  creator: "Zach Lloyd",
  openGraph: {
    title: "March Madness 2026 | Every Game. Every Channel. Every Stream.",
    description:
      "Auto-updating NCAA tournament schedule with scores, TV channels, streaming platforms, and full bracket. No digging required.",
    url: siteUrl,
    siteName: "March Madness Tracker",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "March Madness 2026 - NCAA Tournament Schedule & Scores",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "March Madness 2026 | Every Game. Every Channel. Every Stream.",
    description:
      "Auto-updating NCAA tournament schedule. Scores, TV channels, streaming platforms, full bracket. Updated every 30 seconds.",
    creator: "@zachlloydai",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "March Madness Tracker 2026",
    url: siteUrl,
    description:
      "Auto-updating NCAA March Madness 2026 tournament schedule with live scores, TV channels, streaming platforms, and interactive bracket.",
    applicationCategory: "SportsApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Zach Lloyd",
      url: "https://x.com/zachlloydai",
    },
    about: {
      "@type": "SportsEvent",
      name: "2026 NCAA Division I Men's Basketball Tournament",
      sport: "Basketball",
      startDate: "2026-03-19",
      endDate: "2026-04-06",
    },
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
