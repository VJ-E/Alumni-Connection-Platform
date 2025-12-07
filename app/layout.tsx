import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import OnboardingGuard from "@/components/OnboardingGuard";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes";
import { SocketProvider } from "@/contexts/SocketContext";
import PWAInstaller from "@/components/PWAInstaller";
import OfflineIndicator from "@/components/OfflineIndicator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alumni Connect",
  description: "Connect with alumni, share opportunities, and stay updated with your network. A Progressive Web App for seamless alumni networking.",
  keywords: ["alumni", "networking", "connections", "opportunities", "social platform"],
  authors: [{ name: "Alumni Connection Platform" }],
  creator: "Alumni Connection Platform",
  publisher: "Alumni Connection Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://alumni-connection-platform.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Alumni Connect",
    description: "Connect with alumni, share opportunities, and stay updated with your network",
    url: 'https://alumni-connection-platform.vercel.app',
    siteName: 'Alumni Connection Platform',
    images: [
      {
        url: '/banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Alumni Connection Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alumni Connect',
    description: 'Connect with alumni, share opportunities, and stay updated with your network',
    images: ['/banner.jpg'],
  },
  icons: {
    icon: [
      { url: '/kit_logo.png', sizes: 'any' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/kit_logo.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/kit_logo.png',
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Alumni Connect',
    startupImage: [
      {
        url: '/kit_logo.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/kit_logo.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/kit_logo.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Alumni Connect',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: { 
          colorPrimary: 'hsl(var(--primary))',
          colorText: 'hsl(var(--foreground))',
          colorTextSecondary: 'hsl(var(--muted-foreground))',
          colorBackground: 'hsl(var(--background))',
          colorInputBackground: 'hsl(var(--background))',
          colorInputText: 'hsl(var(--foreground))',
        }
      }}
    >
      <html lang="en">
        <body className={`${inter.className} min-h-screen flex flex-col`}>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="light" 
            enableSystem={false}
            disableTransitionOnChange
          >
            <SocketProvider>
              <NavbarWrapper />
              <OnboardingGuard>
                <div className="flex-1 w-full pt-10 bg-background">
                  <main className="max-w-6xl mx-auto px-4">
                    {children}
                    <Toaster 
                      position="top-right" 
                      theme="system"
                      toastOptions={{
                        className: 'toast group',
                        classNames: {
                          toast: 'group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border group-[.toast]:shadow-lg',
                          description: 'group-[.toast]:text-muted-foreground',
                          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                        },
                      }}
                    />
                  </main>
                </div>
              </OnboardingGuard>
              <Analytics />
            </SocketProvider>
          </ThemeProvider>
          
          {/* PWA Components */}
          <PWAInstaller />
          <OfflineIndicator />
        </body>
      </html>
    </ClerkProvider>
  );
}
