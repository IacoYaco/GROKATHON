import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import { CeidStoreProvider } from "@/hooks/useCeidStore";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${plusJakarta.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-[#0F172A]">
        <AuthProvider>
          <CeidStoreProvider>{children}</CeidStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
