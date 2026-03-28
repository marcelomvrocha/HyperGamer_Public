import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Space_Grotesk, Manrope } from "next/font/google";
import { BackgroundMosaic } from "@/components/BackgroundMosaic";
import { BrandLogo } from "@/components/BrandLogo";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { PrimaryNav } from "@/components/PrimaryNav";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthGate } from "@/components/AuthGate";
import { UserIdentity } from "@/components/UserIdentity";
import { BugReportChip } from "@/components/BugReportChip";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HyperGamer by M. M. Rokku",
  description: "Progression-focused workout tracker for capped dumbbells",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        <BackgroundMosaic />
        <ToastProvider>
          <nav className="site-nav">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center gap-3 py-3 sm:h-16 sm:flex-nowrap sm:gap-2 sm:py-0">
                <div className="flex min-w-0 shrink-0 items-center gap-3">
                  <div className="flex min-w-0 items-center">
                    <Link href="/" className="flex shrink-0 items-center gap-3">
                      <BrandLogo />
                      <span className="flex min-w-0 flex-col">
                        <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                          HyperGamer
                        </span>
                        <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
                          by M. M. Rokku
                        </span>
                      </span>
                    </Link>
                    <div className="hidden shrink-0 sm:flex items-center gap-3 pl-4 lg:pl-6">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex badge-beta">Beta</span>
                        <BugReportChip />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex nav-pill">
                  <PrimaryNav />
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2 self-start sm:self-center">
                  <UserIdentity />
                  <DarkModeToggle />
                </div>
              </div>

              <div className="md:hidden pb-2">
                <div className="nav-pill nav-scroll">
                  <PrimaryNav />
                </div>
              </div>
            </div>
          </nav>
          <main className="main-shell">
            <AuthGate>{children}</AuthGate>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
