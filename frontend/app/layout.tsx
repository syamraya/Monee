// ─────────────────────────────────────────────────────────────────
//  📁 FILE: app/layout.tsx
//  🖥️  TYPE: FRONTEND (Root Layout — Server Component)
//
//  Taruh Providers di sini supaya SessionProvider tersedia
//  di seluruh aplikasi, termasuk Sidebar dan halaman lainnya.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "FinTrack",
  description: "Platform keuangan pribadi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        {/* SessionProvider harus di sini (root) agar tersedia di semua halaman */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}