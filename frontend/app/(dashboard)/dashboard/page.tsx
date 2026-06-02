"use client";

import { fetchWithToken } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiBell,
  FiClock,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiTrendingDown,
  FiTrendingUp,
  FiX,
  FiZap
} from "react-icons/fi";
import { SiBitcoin, SiEthereum } from "react-icons/si";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API = process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3001";
const GNEWS = process.env.NEXT_PUBLIC_GNEWS_TOKEN ?? "";

// ── Types ──────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  role: string;
  avatarUrl?: string | null;
}
interface Stats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}
interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: { name: string };
  description: string;
  createdAt: string;
}
interface Category {
  id: string;
  name: string;
  type: string;
}
interface GoldPrice {
  price: number | null;
  high: number | null;
  low: number | null;
  prev_close_price: number | null;
  marketStatus: "open" | "closed";
  message: string | null;
  lastRefreshed: string | null;
}
interface CryptoData {
  symbol: string;
  price_usd: number;
  price_idr: number;
  change_24h: number;
  last_updated: string;
}
interface NewsItem {
  id: number;
  headline: string;
  source: string;
  url: string;
  datetime: number;
}

// ── Mock news fallback ─────────────────────────────────────────────
const MOCK_NEWS: NewsItem[] = [
  {
    id: 1,
    headline: "Bitcoin Breaks Key Resistance Level Amid Institutional Buying",
    source: "CryptoNews",
    url: "#",
    datetime: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    id: 2,
    headline: "Gold Prices Steady as Fed Signals Cautious Rate Approach",
    source: "MarketWatch",
    url: "#",
    datetime: Math.floor(Date.now() / 1000) - 7200,
  },
  {
    id: 3,
    headline: "Ethereum ETF Sees Record Inflows This Week",
    source: "Bloomberg",
    url: "#",
    datetime: Math.floor(Date.now() / 1000) - 10800,
  },
  {
    id: 4,
    headline: "Analysts Predict Gold to Reach $3,000 by Year End",
    source: "Reuters",
    url: "#",
    datetime: Math.floor(Date.now() / 1000) - 18000,
  },
];

// ── Helpers ────────────────────────────────────────────────────────
const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const timeAgo = (ts: number | string) => {
  const diff =
    Date.now() / 1000 -
    (typeof ts === "string" ? new Date(ts).getTime() / 1000 : ts);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const CATEGORY_ICON: Record<string, string> = {
  food: "🍜",
  transport: "🚗",
  crypto: "₿",
  gold: "🥇",
  salary: "💼",
  income: "💼",
  entertainment: "🎬",
  shopping: "🛍",
  health: "🏥",
  "top up": "📲",
  other: "📦",
};

const NEWS_CATEGORY: Record<string, { label: string; color: string }> = {
  CryptoNews: { label: "CRYPTO", color: "#f7931a" },
  MarketWatch: { label: "MARKETS", color: "#4ade80" },
  Bloomberg: { label: "FINANCE", color: "#60a5fa" },
  Reuters: { label: "GLOBAL", color: "#a78bfa" },
  GNews: { label: "NEWS", color: "#94a3b8" },
};

async function fetchMarketWithToken(token: string, path: string): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchNews(): Promise<NewsItem[]> {
  try {
    if (GNEWS) {
      const res = await fetch(
        `https://gnews.io/api/v4/search?q=crypto+gold+bitcoin&lang=en&max=6&token=${GNEWS}`
      );
      const data = await res.json();
      if (data?.articles?.length) {
        return data.articles.map((a: any, i: number) => ({
          id: i + 1,
          headline: a.title,
          source: a.source?.name ?? "GNews",
          url: a.url,
          datetime: Math.floor(new Date(a.publishedAt).getTime() / 1000),
        }));
      }
    }
  } catch {
    // fall through to mock
  }
  return MOCK_NEWS;
}

// ── Design Tokens ──────────────────────────────────────────────────
const bg = "#0d1117";
const surface = "#161b22";
const border = "rgba(255,255,255,0.08)";
const accent = "#4ade80"; // green-400

// ── Shared Components ──────────────────────────────────────────────
function Skeleton({ className = "", ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "rgba(255,255,255,0.06)", ...props.style }}
      {...props}
    />
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-2xl px-4 py-3 text-[11px] shadow-2xl"
      style={{
        background: "#1c2333",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
      }}
    >
      <p className="text-slate-400 mb-2 font-mono font-bold tracking-widest uppercase text-[9px]">
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: p.color }}
          />
          <span className="text-slate-400 text-[10px]">
            {p.name === "income" ? "Income" : "Expense"}
          </span>
          <span style={{ color: p.color }} className="font-black font-mono ml-1">
            {fmtIDR(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Card({
  children,
  className = "",
  delay = 0,
  glowOnHover = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  glowOnHover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        glowOnHover
          ? { boxShadow: "0 0 0 1px rgba(74,222,128,0.25), 0 8px 32px rgba(74,222,128,0.06)" }
          : {}
      }
      className={`overflow-hidden transition-all duration-300 ${className}`}
      style={{
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: "20px",
      }}
    >
      {children}
    </motion.div>
  );
}

// Thin separator line
function Divider() {
  return <div style={{ height: 1, background: border }} />;
}

// Status dot
function StatusDot({ live = true }: { live?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {live && (
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: accent }}
        />
      )}
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ background: live ? accent : "#64748b" }}
      />
    </span>
  );
}

// ── Transaction Modal ──────────────────────────────────────────────
function TransactionModal({
  onClose,
  onSuccess,
  token,
}: {
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    const fetchCategories = async () => {
      setLoadingCategory(true);
      try {
        const data = await fetchWithToken(token, `/categories?type=${type}`);
        setCategories(Array.isArray(data) ? data : []);
        setCategoryId("");
      } catch {
        setCategories([]);
      } finally {
        setLoadingCategory(false);
      }
    };
    fetchCategories();
  }, [token, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError("Invalid amount");
      return;
    }
    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    setIsLoading(true);
    try {
      await fetchWithToken(token, "/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          type,
          category: categoryId,
          description,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#f1f5f9",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
        style={{
          background: "#161b22",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-black text-[18px] tracking-tight">
              New Transaction
            </h2>
            <p className="text-slate-500 text-[12px] font-mono mt-0.5">
              Record an income or expense
            </p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <FiX size={15} />
          </motion.button>
        </div>

        {/* Type toggle */}
        <div
          className="grid grid-cols-2 gap-1.5 mb-6 p-1 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <motion.button
              key={t}
              type="button"
              onClick={() => setType(t)}
              whileTap={{ scale: 0.97 }}
              className="py-2.5 rounded-xl font-black text-[12px] transition-all flex items-center justify-center gap-1.5"
              style={
                type === t
                  ? {
                    background: t === "INCOME" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.12)",
                    color: t === "INCOME" ? "#4ade80" : "#f87171",
                    border: `1px solid ${t === "INCOME" ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.2)"}`,
                  }
                  : {
                    background: "transparent",
                    color: "#64748b",
                    border: "1px solid transparent",
                  }
              }
            >
              {t === "EXPENSE" ? "💸" : "💰"} {t === "EXPENSE" ? "Expense" : "Income"}
            </motion.button>
          ))}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-3 rounded-xl text-red-400 text-[12px] font-bold"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (IDR)"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(74,222,128,0.4)";
              e.target.style.boxShadow = "0 0 0 3px rgba(74,222,128,0.06)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
              e.target.style.boxShadow = "none";
            }}
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(74,222,128,0.4)";
              e.target.style.boxShadow = "0 0 0 3px rgba(74,222,128,0.06)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
              e.target.style.boxShadow = "none";
            }}
          >
            <option value="" style={{ background: "#161b22" }}>
              {loadingCategory ? "Loading..." : `Select ${type.toLowerCase()} category`}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} style={{ background: "#161b22" }}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(74,222,128,0.4)";
              e.target.style.boxShadow = "0 0 0 3px rgba(74,222,128,0.06)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
              e.target.style.boxShadow = "none";
            }}
          />
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl font-black text-[13px] text-black transition-all"
            style={{
              background: isLoading ? "rgba(74,222,128,0.5)" : "linear-gradient(135deg, #4ade80, #22c55e)",
              boxShadow: isLoading ? "none" : "0 4px 24px rgba(74,222,128,0.25)",
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <FiRefreshCw size={13} className="animate-spin" /> Saving…
              </span>
            ) : (
              "Save Transaction"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ── CashflowChart ──────────────────────────────────────────────────
function CashflowChart({ transactions }: { transactions: Transaction[] }) {
  const monthly = (() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("id-ID", { month: "short" });
      map[key] = { month: key, income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const key = new Date(t.createdAt).toLocaleString("id-ID", { month: "short" });
      if (!map[key]) return;
      if (t.type === "INCOME") map[key].income += t.amount;
      if (t.type === "EXPENSE") map[key].expense += t.amount;
    });
    return Object.values(map);
  })();

  const totalIncome = monthly.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <Card delay={0} className="p-6 col-span-12 xl:col-span-7">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-white font-black text-[15px] tracking-tight">
            Cash Flow
          </p>
          <p className="text-slate-500 text-[11px] font-mono mt-0.5">
            6-month overview
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1.5" style={{ color: "#4ade80" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
            Income
          </span>
          <span className="flex items-center gap-1.5" style={{ color: "#f87171" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#f87171" }} />
            Expense
          </span>
        </div>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Income", value: fmtIDR(totalIncome), color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.15)", icon: <FiArrowUpRight size={12} /> },
          { label: "Total Expense", value: fmtIDR(totalExpense), color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.15)", icon: <FiArrowDownLeft size={12} /> },
          {
            label: "Net Profit",
            value: fmtIDR(Math.abs(netProfit)),
            color: netProfit >= 0 ? "#4ade80" : "#f87171",
            bg: netProfit >= 0 ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
            border: netProfit >= 0 ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
            icon: netProfit >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />,
            prefix: netProfit < 0 ? "−" : "",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-3"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
          >
            <div className="flex items-center gap-1.5 mb-1.5" style={{ color: s.color }}>
              {s.icon}
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#64748b" }}>
                {s.label}
              </span>
            </div>
            <p className="font-black font-mono text-[13px]" style={{ color: s.color }}>
              {s.prefix}{s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={monthly} barSize={16} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(74,222,128,0.03)", radius: 8 }} />
          <Bar dataKey="income" fill="#4ade80" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="#f87171" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── UserCard ───────────────────────────────────────────────────────
function UserCard({ user, stats }: { user: User | null; stats: Stats | null }) {
  const [show, setShow] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setShine({ x, y, opacity: 0.15 });
  };
  const handleMouseLeave = () => setShine((s) => ({ ...s, opacity: 0 }));

  // Fake masked card number
  const maskedCard = "4921  ••••  ••••  7834";

  return (
    <Card delay={0.06} className="p-6 col-span-12 xl:col-span-5 flex flex-col gap-4" glowOnHover>
      {/* Profile row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.08))",
              border: "1px solid rgba(74,222,128,0.2)",
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : user ? (
              <span className="text-[#4ade80] font-black text-[14px]">{getInitials(user.name)}</span>
            ) : (
              <Skeleton className="w-full h-full" />
            )}
          </div>
          <div>
            {user ? (
              <>
                <p className="text-white font-black text-[13px] leading-tight">{user.name}</p>
                <p className="text-slate-500 text-[10px] font-mono">{user.email}</p>
              </>
            ) : (
              <>
                <Skeleton className="w-28 h-3 mb-1.5" />
                <Skeleton className="w-36 h-2.5" />
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
            style={{
              background: "rgba(74,222,128,0.1)",
              color: "#4ade80",
              border: "1px solid rgba(74,222,128,0.2)",
            }}
          >
            {user?.role ?? "USER"}
          </span>
          <a
            href="/settings"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            title="Settings"
          >
            <FiSettings size={13} />
          </a>
        </div>
      </div>

      {/* Premium card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full rounded-2xl p-5 overflow-hidden select-none"
        style={{
          background: "linear-gradient(135deg, #0f2027 0%, #1a3a4a 40%, #0f3460 100%)",
          minHeight: "148px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Shine overlay */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.18) 0%, transparent 60%)`,
            opacity: shine.opacity,
          }}
        />
        {/* Decorative orbs */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-8 -left-6 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-widest mb-1"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Main Balance
              </p>
              <div className="flex items-center gap-2.5">
                {user ? (
                  <p className="text-white text-[20px] font-black tracking-tight font-mono">
                    {show ? fmtIDR(user.balance) : "Rp ••••••••"}
                  </p>
                ) : (
                  <Skeleton className="w-36 h-6" style={{ background: "rgba(255,255,255,0.1)" }} />
                )}
                <motion.button
                  onClick={() => setShow(!show)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.9)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.4)")}
                >
                  {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </motion.button>
              </div>
            </div>
            {/* Card chip */}
            <div
              className="w-9 h-7 rounded-md border"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #d97706)",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            />
          </div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <p
                className="text-[8px] font-mono uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Card Number
              </p>
              <p
                className="text-[11px] font-mono tracking-widest"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {maskedCard}
              </p>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mt-1"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {user?.name ?? "──────"}
              </p>
            </div>
            {/* VISA logo */}
            <p
              className="text-[18px] font-black italic tracking-tight"
              style={{
                color: "rgba(255,255,255,0.85)",
                fontFamily: "Georgia, serif",
                letterSpacing: "-0.5px",
              }}
            >
              VISA
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)" }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <FiArrowUpRight size={11} style={{ color: "#4ade80" }} />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Income
            </p>
          </div>
          {stats ? (
            <p className="font-black text-[14px] font-mono" style={{ color: "#4ade80" }}>
              {fmtIDR(stats.totalRevenue)}
            </p>
          ) : (
            <Skeleton className="w-24 h-4" />
          )}
        </div>
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)" }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <FiArrowDownLeft size={11} style={{ color: "#f87171" }} />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Expense
            </p>
          </div>
          {stats ? (
            <p className="font-black text-[14px] font-mono" style={{ color: "#f87171" }}>
              {fmtIDR(stats.totalExpenses)}
            </p>
          ) : (
            <Skeleton className="w-24 h-4" />
          )}
        </div>
      </div>

      {/* Net profit */}
      {stats && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: stats.netProfit >= 0 ? "rgba(74,222,128,0.04)" : "rgba(248,113,113,0.04)",
            border: `1px solid ${stats.netProfit >= 0 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FiZap size={11} style={{ color: stats.netProfit >= 0 ? "#4ade80" : "#f87171" }} />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Net Profit
              </p>
            </div>
            <p
              className="font-black text-[14px] font-mono"
              style={{ color: stats.netProfit >= 0 ? "#4ade80" : "#f87171" }}
            >
              {stats.netProfit < 0 ? "−" : "+"}{fmtIDR(Math.abs(stats.netProfit))}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── SpendingAnalysis ───────────────────────────────────────────────
function SpendingAnalysis({ transactions }: { transactions: Transaction[] }) {
  const expenses = transactions.filter((t) => t.type === "EXPENSE");
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, t) => {
    const key = (t.category?.name ?? "other").toLowerCase();
    acc[key] = (acc[key] ?? 0) + t.amount;
    return acc;
  }, {});
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const RANK_COLORS = [
    { bar: "#4ade80", bg: "rgba(74,222,128,0.06)", text: "#4ade80" },
    { bar: "#60a5fa", bg: "rgba(96,165,250,0.06)", text: "#60a5fa" },
    { bar: "#a78bfa", bg: "rgba(167,139,250,0.06)", text: "#a78bfa" },
    { bar: "#fbbf24", bg: "rgba(251,191,36,0.06)", text: "#fbbf24" },
    { bar: "#f87171", bg: "rgba(248,113,113,0.06)", text: "#f87171" },
  ];

  return (
    <Card delay={0.1} className="p-6 col-span-12 xl:col-span-4">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-white font-black text-[15px] tracking-tight">Spending</p>
          <p className="text-slate-500 text-[11px] font-mono mt-0.5">By category</p>
        </div>
        {total > 0 && (
          <span
            className="text-[10px] font-black font-mono px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {fmtIDR(total)}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(([cat, val], i) => {
            const pct = total ? (val / total) * 100 : 0;
            const c = RANK_COLORS[i] ?? RANK_COLORS[4];
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.4, ease: "easeOut" }}
                className="rounded-2xl p-3.5"
                style={{ background: c.bg, border: `1px solid ${c.bar}18` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-6 h-6 rounded-xl flex items-center justify-center text-[13px]"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {CATEGORY_ICON[cat] ?? "📦"}
                    </span>
                    <span className="text-[12px] font-bold text-slate-300 capitalize">{cat}</span>
                  </div>
                  <span className="text-[11px] font-black font-mono" style={{ color: c.text }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div
                  className="h-1.5 w-full rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.25 + i * 0.08, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: c.bar }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1.5">{fmtIDR(val)}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── NewsWidget ─────────────────────────────────────────────────────
function NewsWidget({ news }: { news: NewsItem[] }) {
  return (
    <Card delay={0.14} className="p-6 col-span-12 xl:col-span-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <StatusDot live={!!GNEWS} />
          <div>
            <p className="text-white font-black text-[15px] tracking-tight">Market Intel</p>
            <p className="text-slate-500 text-[11px] font-mono mt-0.5">
              {!GNEWS ? "Demo data" : "Live feed"}
            </p>
          </div>
        </div>
        <a
          href="#"
          className="text-[11px] font-bold flex items-center gap-1 transition-colors"
          style={{ color: "#4ade80" }}
        >
          View All <FiExternalLink size={10} />
        </a>
      </div>

      {!GNEWS && (
        <div
          className="mb-4 px-3 py-2 rounded-xl flex items-center gap-2 text-[10px] font-mono"
          style={{
            background: "rgba(251,191,36,0.06)",
            border: "1px solid rgba(251,191,36,0.15)",
            color: "#fbbf24",
          }}
        >
          <span>⚠</span>
          <span>
            Set <code className="font-bold">NEXT_PUBLIC_GNEWS_TOKEN</code> for live news
          </span>
        </div>
      )}

      {news.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-9 h-9 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {news.slice(0, 4).map((n, i) => {
            const catInfo = NEWS_CATEGORY[n.source] ?? { label: "NEWS", color: "#94a3b8" };
            return (
              <motion.a
                key={n.id}
                href={n.url !== "#" ? n.url : undefined}
                target={n.url !== "#" ? "_blank" : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
                whileHover={{ x: 2 }}
                className="flex gap-3 group rounded-2xl p-3 -mx-1 transition-all cursor-pointer"
                style={{}}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(74,222,128,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Source icon placeholder */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 uppercase tracking-tight"
                  style={{
                    background: `${catInfo.color}15`,
                    border: `1px solid ${catInfo.color}25`,
                    color: catInfo.color,
                    fontFamily: "monospace",
                  }}
                >
                  {catInfo.label.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[12px] font-bold leading-tight line-clamp-2 transition-colors mb-1"
                    style={{ color: "#cbd5e1" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#4ade80")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#cbd5e1")}
                  >
                    {n.headline}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                      style={{ background: `${catInfo.color}12`, color: catInfo.color }}
                    >
                      {catInfo.label}
                    </span>
                    <span className="text-slate-600 text-[9px]">·</span>
                    <span className="text-slate-500 text-[9px] font-mono">{n.source}</span>
                    <span className="text-slate-600 text-[9px]">·</span>
                    <FiClock size={8} className="text-slate-600" />
                    <span className="text-slate-500 text-[9px] font-mono">{timeAgo(n.datetime)}</span>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── PriceWidget ────────────────────────────────────────────────────
function PriceWidget({
  gold,
  btc,
  eth,
}: {
  gold: GoldPrice | null;
  btc: CryptoData | null;
  eth: CryptoData | null;
}) {
  const goldPrice = gold?.price ?? gold?.prev_close_price ?? null;
  const goldHigh = gold?.high ?? null;
  const goldClosed = gold?.marketStatus === "closed";

  const items = [
    {
      label: "Gold / oz",
      ticker: "XAU",
      value: goldPrice != null ? fmtUSD(goldPrice) : null,
      change: null,
      sub: goldClosed ? "Market closed" : goldHigh != null ? `H: ${fmtUSD(goldHigh)}` : null,
      subColor: goldClosed ? "#f87171" : "#64748b",
      icon: "🥇",
      iconBg: "rgba(251,191,36,0.12)",
      iconBorder: "rgba(251,191,36,0.2)",
    },
    {
      label: "Bitcoin",
      ticker: "BTC",
      value: btc && btc.price_usd > 0 ? fmtUSD(btc.price_usd) : null,
      change: btc?.change_24h ?? null,
      sub: btc ? `IDR ${(btc.price_idr / 1_000_000).toFixed(1)}M` : null,
      subColor: "#64748b",
      icon: <SiBitcoin className="text-[#f7931a]" size={15} />,
      iconBg: "rgba(247,147,26,0.12)",
      iconBorder: "rgba(247,147,26,0.2)",
    },
    {
      label: "Ethereum",
      ticker: "ETH",
      value: eth && eth.price_usd > 0 ? fmtUSD(eth.price_usd) : null,
      change: eth?.change_24h ?? null,
      sub: eth ? `IDR ${(eth.price_idr / 1_000_000).toFixed(2)}M` : null,
      subColor: "#64748b",
      icon: <SiEthereum className="text-[#627eea]" size={15} />,
      iconBg: "rgba(98,126,234,0.12)",
      iconBorder: "rgba(98,126,234,0.2)",
    },
  ];

  return (
    <Card delay={0.18} className="p-6 col-span-12 xl:col-span-3">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-white font-black text-[15px] tracking-tight">Asset Prices</p>
          <p className="text-slate-500 text-[11px] font-mono mt-0.5">Live market</p>
        </div>
        <StatusDot live />
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => {
          const up = (item.change ?? 0) >= 0;
          const hasChange = item.change != null;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.35 }}
              whileHover={{ x: -1, backgroundColor: "rgba(74,222,128,0.04)" }}
              className="rounded-2xl p-4 transition-all cursor-default"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,222,128,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px]"
                    style={{ background: item.iconBg, border: `1px solid ${item.iconBorder}` }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-slate-300 text-[12px] font-bold">{item.label}</p>
                    <p className="text-slate-600 text-[9px] font-mono uppercase tracking-widest">
                      {item.ticker}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {item.value ? (
                    <>
                      <p className="text-white text-[13px] font-black font-mono">{item.value}</p>
                      {hasChange && (
                        <p
                          className="text-[10px] font-bold flex items-center justify-end gap-1 mt-0.5"
                          style={{ color: up ? "#4ade80" : "#f87171" }}
                        >
                          {up ? <FiTrendingUp size={9} /> : <FiTrendingDown size={9} />}
                          {up ? "+" : ""}{item.change!.toFixed(2)}%
                        </p>
                      )}
                      {!hasChange && item.sub && (
                        <p className="text-[9px] font-mono mt-0.5" style={{ color: item.subColor }}>
                          {item.sub}
                        </p>
                      )}
                    </>
                  ) : (
                    <Skeleton className="w-20 h-4 mt-1" />
                  )}
                </div>
              </div>
              {hasChange && item.sub && (
                <p className="text-[9px] font-mono mt-2 pl-10" style={{ color: item.subColor }}>
                  {item.sub}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

// ── TransactionList ────────────────────────────────────────────────
function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  const filtered = transactions
    .filter((t) => filter === "ALL" || t.type === filter)
    .slice(0, 10);

  return (
    <Card delay={0.22} className="p-6 col-span-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white font-black text-[15px] tracking-tight">
              Transactions
            </p>
            <p className="text-slate-500 text-[11px] font-mono">
              {transactions.length} total records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick filters */}
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {(["ALL", "INCOME", "EXPENSE"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1 rounded-lg text-[10px] font-black transition-all"
                style={
                  filter === f
                    ? {
                      background: f === "INCOME" ? "rgba(74,222,128,0.15)" : f === "EXPENSE" ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.08)",
                      color: f === "INCOME" ? "#4ade80" : f === "EXPENSE" ? "#f87171" : "#e2e8f0",
                    }
                    : { background: "transparent", color: "#475569" }
                }
              >
                {f}
              </button>
            ))}
          </div>
          <a
            href="/customer/transactions"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-colors"
            style={{ color: "#4ade80", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}
          >
            See All <FiExternalLink size={10} />
          </a>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-40 h-3" />
                <Skeleton className="w-24 h-2.5" />
              </div>
              <Skeleton className="w-24 h-4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-slate-600 text-[13px] font-mono">No {filter.toLowerCase()} transactions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {filtered.map((t, i) => {
            const isIncome = t.type === "INCOME";
            const cat = (t.category?.name ?? "other").toLowerCase();
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                whileHover={{ x: 2 }}
                className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl group cursor-pointer transition-all"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(74,222,128,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,222,128,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                }}
                style={{ border: "1px solid transparent" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] shrink-0"
                  style={{
                    background: isIncome ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
                    border: isIncome ? "1px solid rgba(74,222,128,0.15)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {CATEGORY_ICON[cat] ?? (isIncome ? "💰" : "💸")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-[13px] font-bold truncate transition-colors group-hover:text-white">
                    {t.description || t.category?.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md capitalize"
                      style={{
                        background: isIncome ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                        color: isIncome ? "#4ade80" : "#64748b",
                      }}
                    >
                      {t.category?.name}
                    </span>
                    <span className="text-slate-600 text-[9px]">·</span>
                    <span className="text-slate-500 text-[10px] font-mono">
                      {new Date(t.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <p
                  className="text-[13px] font-black font-mono shrink-0"
                  style={{ color: isIncome ? "#4ade80" : "#f87171" }}
                >
                  {isIncome ? "+" : "−"}
                  {fmtIDR(Math.abs(t.amount))}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gold, setGold] = useState<GoldPrice | null>(null);
  const [btc, setBtc] = useState<CryptoData | null>(null);
  const [eth, setEth] = useState<CryptoData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken ?? "";

  const refreshTransactions = async () => {
    if (!token) return;
    const [u, s, tx] = await Promise.all([
      fetchWithToken(token, "/users/me"),
      fetchWithToken(token, "/transactions/stats"),
      fetchWithToken(token, "/transactions"),
    ]);
    setUser(u);
    setStats(s);
    setTransactions(Array.isArray(tx) ? tx : []);
  };

  const fetchMarket = async (t: string) => {
    const [g, b, e, n] = await Promise.allSettled([
      fetchMarketWithToken(t, "/market/gold-price"),
      fetchMarketWithToken(t, "/market/crypto?coin=bitcoin"),
      fetchMarketWithToken(t, "/market/crypto?coin=ethereum"),
      fetchNews(),
    ]);
    if (g.status === "fulfilled") setGold(g.value);
    if (b.status === "fulfilled") setBtc(b.value);
    if (e.status === "fulfilled") setEth(e.value);
    if (n.status === "fulfilled") setNews(n.value);
  };

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      const [u, s, tx, g, b, e, n] = await Promise.allSettled([
        token ? fetchWithToken(token, "/users/me") : Promise.resolve(null),
        token ? fetchWithToken(token, "/transactions/stats") : Promise.resolve(null),
        token ? fetchWithToken(token, "/transactions") : Promise.resolve([]),
        fetchMarketWithToken(token, "/market/gold-price"),
        fetchMarketWithToken(token, "/market/crypto?coin=bitcoin"),
        fetchMarketWithToken(token, "/market/crypto?coin=ethereum"),
        fetchNews(),
      ]);
      if (u.status === "fulfilled") setUser(u.value);
      if (s.status === "fulfilled") setStats(s.value);
      if (tx.status === "fulfilled") setTransactions(Array.isArray(tx.value) ? tx.value : []);
      if (g.status === "fulfilled") setGold(g.value);
      if (b.status === "fulfilled") setBtc(b.value);
      if (e.status === "fulfilled") setEth(e.value);
      if (n.status === "fulfilled") setNews(n.value);
      setLastUpdate(new Date().toLocaleTimeString("id-ID"));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    refreshTransactions();
    fetchMarket(token);
  }, [token]);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <TransactionModal
            token={token}
            onClose={() => setShowModal(false)}
            onSuccess={refreshTransactions}
          />
        )}
      </AnimatePresence>

      <div
        className="min-h-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10"
        style={{
          background: bg,
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
          minHeight: "100vh",
        }}
      >
        <div className="max-w-350 mx-auto">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between mb-8"
          >
            {/* Left: greeting */}
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                />
                <span className="text-slate-500 text-[11px] font-mono uppercase tracking-widest">
                  Dashboard
                </span>
              </div>
              <h1 className="text-white text-[22px] font-black tracking-tight">
                Hello,{" "}
                <span style={{ color: accent }}>
                  {user?.name?.split(" ")[0] ?? "—"}
                </span>
              </h1>
              <p className="text-slate-600 text-[11px] font-mono mt-0.5">
                {today}
                {lastUpdate && (
                  <span style={{ color: "#4ade8060" }}> · synced {lastUpdate}</span>
                )}
              </p>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <motion.a
                href="/notifications"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <FiBell size={15} />
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: accent }}
                />
              </motion.a>

              {/* Settings shortcut */}
              <motion.a
                href="/settings"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <FiSettings size={15} />
              </motion.a>

              {/* Refresh */}
              <motion.button
                onClick={fetchAll}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
                style={{
                  color: refreshing ? accent : "#94a3b8",
                  background: refreshing ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${refreshing ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <FiRefreshCw
                  size={12}
                  className={refreshing ? "animate-spin" : ""}
                  style={{ color: refreshing ? accent : "#64748b" }}
                />
                Refresh
              </motion.button>

              {/* New transaction CTA */}
              <motion.button
                onClick={() => setShowModal(true)}
                whileHover={{ scale: 1.03, boxShadow: "0 6px 24px rgba(74,222,128,0.3)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black text-black transition-all"
                style={{
                  background: "linear-gradient(135deg, #4ade80, #22c55e)",
                  boxShadow: "0 4px 16px rgba(74,222,128,0.2)",
                }}
              >
                <FiPlus strokeWidth={3} size={14} />
                New Transaction
              </motion.button>
            </div>
          </motion.div>

          {/* ── Grid ── */}
          <div className="grid grid-cols-12 gap-4 xl:gap-5">
            <CashflowChart transactions={transactions} />
            <UserCard user={user} stats={stats} />
            <SpendingAnalysis transactions={transactions} />
            <NewsWidget news={news} />
            <PriceWidget gold={gold} btc={btc} eth={eth} />
            <TransactionList transactions={transactions} />
          </div>
        </div>
      </div>
    </>
  );
}
