import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import { SocketProvider } from "@/contexts/SocketContext";
import PWAInstaller from "@/components/PWAInstaller";
import OfflineIndicator from "@/components/OfflineIndicator";
import SessionWrapper from "@/components/SessionWrapper";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alumni Connect",
  description: "Connect with alumni, share opportunities, and stay updated with your network.",
  keywords: ["alumni", "networking", "connections", "opportunities", "social platform"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/kit_logo.png", sizes: "any" },
    ],
    apple: [
      { url: "/kit_logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alumni Connect",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <SessionWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <SocketProvider>
              <NavbarWrapper />
              <div className="flex-1 w-full pt-10 pb-20 md:pb-0 bg-background">
                <main className="max-w-6xl mx-auto px-4">
                  {children}
                  <Toaster
                    position="top-right"
                    theme="system"
                    toastOptions={{
                      className: "toast group",
                      classNames: {
                        toast: "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border group-[.toast]:shadow-lg",
                        description: "group-[.toast]:text-muted-foreground",
                        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                        cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                      },
                    }}
                  />
                </main>
              </div>
              <Analytics />
            </SocketProvider>
          </ThemeProvider>
        </SessionWrapper>

        {/* PWA Components - outside session wrapper intentionally */}
        <PWAInstaller />
        <OfflineIndicator />
      </body>
    </html>
  );
}
