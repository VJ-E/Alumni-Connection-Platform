import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes";
import { SocketProvider } from "@/providers/SocketProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alumni Connect",
  description: "Alumni Connection Platform",
  icons: {
    icon: "public/favicon.ico",
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
        variables: { colorPrimary: '#0066FF' }
      }}
    >
      <html lang="en">
        <body className={`${inter.className} min-h-screen flex flex-col`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SocketProvider>
              <NavbarWrapper />
              <div className="md:bg-[#F4F2EE] flex-1 w-full pt-10">
                <main className="max-w-6xl mx-auto">
                  {children}
                  <Toaster position="top-right" />
                </main>
              </div>
              <Analytics />
            </SocketProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
