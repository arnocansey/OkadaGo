import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" }
  ]
};

export const metadata: Metadata = {
  title: "OkadaGo Admin",
  description: "Operations console for OkadaGo rides, deliveries, riders, and support.",
  applicationName: "OkadaGo Admin",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.okadago.com"),
  icons: {
    icon: [{ url: "/branding/okadago-icon-dark.png", type: "image/png" }],
    apple: [{ url: "/branding/okadago-icon-dark.png", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OkadaGo Admin"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `
          }}
        />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
        <ToastAndLoaderProvider>
          <QueryProvider>{children}</QueryProvider>
        </ToastAndLoaderProvider>
      </body>
    </html>
  );
}

