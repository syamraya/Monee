"use client";

// ─────────────────────────────────────────────────────────────────
//  📁 FILE: components/Providers.tsx
//  🖥️  TYPE: FRONTEND (Client Component)
//
//  Wrapper semua provider (SessionProvider, dll).
//  Dipakai di app/layout.tsx (root layout).
// ─────────────────────────────────────────────────────────────────

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}