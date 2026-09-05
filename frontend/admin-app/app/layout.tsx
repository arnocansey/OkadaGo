import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "@/components/dashboard/admin.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastAndLoaderProvider } from "@/components/providers/toast-and-loader-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" }
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Anti-flash theme initialization script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('okadago.admin-theme');
                  var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
                  document.documentElement.dataset.theme = theme;
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `
          }}
        />
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
      <body className={inter.variable} suppressHydrationWarning>
        <ThemeProvider>
          <ToastAndLoaderProvider>
            <QueryProvider>{children}</QueryProvider>
          </ToastAndLoaderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
