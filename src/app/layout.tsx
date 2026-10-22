import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Pixelify_Sans, Press_Start_2P, VT323 } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

import AppProvider from "@/components/providers";
import EnvBadge from "@/components/EnvBadge";
import { config } from "@/config";
import { siteUrl } from "@/config/site";

// Poofsy type system (globals.css): Inter for reading (tables, forms, money in lists),
// Pixelify Sans for UI (nav, buttons, section headings), Press Start 2P for page titles,
// VT323 for balances and stats.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  display: "swap",
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // The keyboard shrinks the layout viewport rather than only the visual one, so
  // dvh-based heights react to it and a form dialog stays scrollable while typing.
  // Ignored by iOS Safari — useVisualViewportHeight covers that side.
  interactiveWidget: "resizes-content",
  // Paints the status bar in standalone mode and the browser chrome on mobile.
  // Matched to --background in each scheme so the bar reads as part of the app
  // rather than a band above it. `dim` has no media query of its own and falls
  // back to the dark value, which is close enough not to seam.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6efd9" },
    { media: "(prefers-color-scheme: dark)", color: "#161a2a" },
  ],
};

export const metadata: Metadata = {
  // Without this, the OG image below resolves relative to the page and breaks
  // for every crawler.
  metadataBase: new URL(siteUrl),
  title: config.app.name,
  description: config.app.description,
  formatDetection: { telephone: false },
  // Poofsy brand icons live in public/ (from the poofsy-brand bundle). Don't add
  // app/icon.* or app/favicon.ico: Next's file conventions would override these.
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: config.app.name,
    // The app draws its own header, so a translucent bar would put content
    // under the clock. `default` keeps the bar opaque and themed by themeColor.
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: config.app.name,
    title: config.app.name,
    description: config.app.description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: config.app.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: config.app.name,
    description: config.app.description,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables sit on <html>, because the base font-family is applied there (globals.css);
    // on <body> they'd be undefined at <html> and everything would fall back to a serif.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${pixelify.variable} ${pressStart.variable} ${vt323.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <NextTopLoader color="var(--primary)" height={2} showSpinner={false} shadow={false} />
        <AppProvider>{children}</AppProvider>
        <EnvBadge />
      </body>
    </html>
  );
}
