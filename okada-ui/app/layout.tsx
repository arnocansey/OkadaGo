import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "@/components/passenger/passenger.css";
import "@/components/rider/rider.css";
import "@/components/dashboard/admin.css";
import "@/components/landing/landing.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { AppShell } from "@/components/layout/app-shell";
import { ToastAndLoaderProvider } from "@/components/providers/toast-and-loader-provider";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "OkadaGo | African Motorcycle Mobility Platform",
  description:
    "PWA foundation, operational dashboards, and product architecture for a production-grade okada ride-hailing platform.",
  applicationName: "OkadaGo",
  metadataBase: new URL("https://okadago.local"),
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
        <ToastAndLoaderProvider>
          <QueryProvider>
            <PwaProvider />
            <AppShell>{children}</AppShell>
          </QueryProvider>
        </ToastAndLoaderProvider>
      </body>
    </html>
  );
}
