"use client";

// ─────────────────────────────────────────────────────────────────
//  📁 FILE: components/Sidebar.tsx
//  🖥️  TYPE: FRONTEND (React Client Component)
//
//  Sidebar minimalis dark — icon only, expand on hover.
//  Tooltip muncul saat collapsed, label muncul saat expanded.
//
//  Pasang di app/dashboard/layout.tsx:
//    import Sidebar from "@/components/Sidebar"
//    export default function DashboardLayout({ children }) {
//      return (
//        <div className="flex h-screen overflow-hidden">
//          <Sidebar />
//          <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
//        </div>
//      )
//    }
//
//  Customize nav: edit NAV_ITEMS & BOTTOM_ITEMS di bawah.
//  Install: npm install framer-motion react-icons
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  FiGrid,
  FiList,
  FiTarget,
  FiPieChart,
  FiDollarSign,
  FiGlobe,
  FiBell,
  FiSettings,
  FiLogOut,
  FiCreditCard,
} from "react-icons/fi";
import { SiBit, SiBitcoin, SiSocialblade, SiStockx } from "react-icons/si";


// ── Nav items — edit sesuai kebutuhan ─────────────────────────────
const NAV_ITEMS = [
  { icon: FiGrid, label: "Dashboard", href: "/dashboard" },
  { icon: FiTarget, label: "Savings Goal", href: "/savings" },
  { icon: FiList, label: "Transaction", href: "/transaction" },
  { icon: FiPieChart, label: "Analytics", href: "/analytics" },
  { icon: SiBitcoin, label: "Crypto", href: "/market" },
  { icon: SiSocialblade, label: "US Stocks", href: "/stock" },
  { icon: FiGlobe, label: "News", href: "/news" },
  { icon: FiCreditCard, label: "Wallet", href: "/wallet" },
];

const BOTTOM_ITEMS = [
  { icon: FiBell, label: "Notifikasi", href: "/notifications" },
  { icon: FiSettings, label: "Pengaturan", href: "/settings" },
];

// ── Tooltip ───────────────────────────────────────────────────────
function Tooltip({
  label,
  children,
  visible,
}: {
  label: string;
  children: React.ReactNode;
  visible: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {visible && hovered && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-999 pointer-events-none"
          >
            <div className="relative bg-[#1e293b] text-white/90 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-2xl">
              {label}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#1e293b]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Single nav item ───────────────────────────────────────────────
function NavItem({
  icon: Icon,
  label,
  href,
  isActive,
  expanded,
}: {
  icon: any;
  label: string;
  href: string;
  isActive: boolean;
  expanded: boolean;
}) {
  return (
    <Tooltip label={label} visible={!expanded}>
      <a
        href={href}
        className={`
          relative flex items-center gap-3 w-full
          px-2.5 py-2.5 rounded-xl transition-all duration-150
          ${
            isActive
              ? "bg-white/10 text-white"
              : "text-white/30 hover:text-white/70 hover:bg-white/5"
          }
        `}
      >
        {/* active pill */}
        {isActive && (
          <motion.span
            layoutId="pill"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4.5 bg-green-400 rounded-r-full"
          />
        )}

        <Icon size={16} className="shrink-0 ml-0.5" />

        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.16 }}
              className="text-[13px] font-semibold whitespace-nowrap leading-none"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </a>
    </Tooltip>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────
export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const { profile } = useUserProfile();

  return (
    <motion.aside
      animate={{ width: expanded ? 196 : 52 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="
        relative h-screen shrink-0 flex flex-col z-30
        bg-[#0f172a] border-r border-white/5
        overflow-hidden
      "
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 h-14 px-3 shrink-0 border-b border-white/5">
        <div className="w-7 h-7 rounded-lg bg-green-400 flex items-center justify-center shrink-0 shadow-md shadow-green-500/40">
          <span className="text-black font-black text-[11px] tracking-tight">
            M
          </span>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.16 }}
              className="text-white font-black text-[15px] tracking-tight whitespace-nowrap"
            >
              <span className="text-green-400">Monee</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-1.5 py-3 overflow-hidden">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                (pathname?.startsWith(item.href + "/") ?? false))
            }
            expanded={expanded}
          />
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-1.5 pb-3 flex flex-col gap-0.5 border-t border-white/5 pt-3">
        {BOTTOM_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname === item.href}
            expanded={expanded}
          />
        ))}

        {/* User row */}
        <div className="mt-1 pt-2 border-t border-white/[0.05]">
          <Tooltip
            label={`Keluar (${profile?.name ?? "User"})`}
            visible={!expanded}
          >
            <div className="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl hover:bg-white/[0.05] transition-colors group">
              {/* avatar */}
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0 overflow-hidden">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-blue-400 font-black text-[10px]">
                    {profile?.name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-white/70 text-[12px] font-bold truncate leading-tight">
                      {profile?.name ?? "User"}
                    </p>
                    <p className="text-white/25 text-[10px] font-mono truncate">
                      {profile?.email ?? ""}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {expanded && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={async () => {
                      await signOut({ redirect: true, callbackUrl: "/"   });
                    }}
                    className="text-white/20 hover:text-red-400 transition-colors shrink-0 p-1 rounded-lg hover:bg-red-500/10"
                  >
                    <FiLogOut size={13} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </Tooltip>
        </div>
      </div>
    </motion.aside>
  );
}
