import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "@/components/dashboard/admin.css";
import { QueryProvider } from "@/components/providers/query-provider";
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
  title: "OkadaGo Admin",
  description: "Operations console for OkadaGo rides, deliveries, riders, and support.",
  applicationName: "OkadaGo Admin",
  metadataBase: new URL(process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.okadago.com"),
  icons: {
    icon: [{ url: "/branding/okadago-icon-dark.png", type: "image/png" }]
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
          <QueryProvider>{children}</QueryProvider>
        </ToastAndLoaderProvider>
      </body>
    </html>
  );
}
