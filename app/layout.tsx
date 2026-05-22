import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Rangefinder — Screener de pools Orca (Solana)",
  description:
    "Encontra oportunidades em pools de liquidez da Orca com TVL ≥ US$ 100k e recomenda ranges ideais para permanecer 1 semana no range.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div id="app-root" className="flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
