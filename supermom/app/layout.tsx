import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CustomPointer } from "@/components/motion/CustomPointer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Clash Display, Indian Type Foundry, ITF Free Font License (license_type
 * "itf_ffl" per the Fontshare API). Free for commercial use, redistribution
 * not permitted: it is self-hosted here rather than vendored for reuse.
 * Source: https://www.fontshare.com/fonts/clash-display
 */
const clashDisplay = localFont({
  src: "../public/fonts/ClashDisplay-Variable.woff2",
  variable: "--font-clash-display",
  display: "swap",
  weight: "200 700",
  preload: true,
});

export const metadata: Metadata = {
  title: "supermom, an NFT collection celebrating African motherhood",
  description:
    "Discover supermom. A collection celebrating the strength and spirit of motherhood.",
  applicationName: "supermom",
};

export const viewport: Viewport = {
  // The page is dark in both schemes, so the status bar matches the surface
  // at the very top of the page rather than a brand colour.
  themeColor: "#141019",
  colorScheme: "dark",
  initialScale: 1,
  width: "device-width",
  // mobile-native: allow pinch zoom, never block it
  maximumScale: 5,
  // paint under the notch, then pad content back out with env()
  viewportFit: "cover",
  // Android Chrome: let the software keyboard shrink the layout viewport
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${clashDisplay.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <MotionProvider>
          {children}
          <CustomPointer />
        </MotionProvider>
      </body>
    </html>
  );
}
