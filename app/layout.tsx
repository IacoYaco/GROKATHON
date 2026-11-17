import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import { CeidStoreProvider } from "@/hooks/useCeidStore";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEID Co-Pilot",
  description:
    "Yale CEID floor pulse, Snap-to-Diagnose, Agentic DFM, and Cert Sniper — powered by xAI Grok with Yale CAS roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-[#212121]">
        <AuthProvider>
          <CeidStoreProvider>{children}</CeidStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
