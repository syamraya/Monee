"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchWithToken } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  FiArrowUpRight,
  FiArrowDownLeft,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiRefreshCw,
  FiExternalLink,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiX,
  FiSettings,
  FiClock,
} from "react-icons/fi";
import { SiBitcoin, SiEthereum } from "react-icons/si";

const API = process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3001";
const GNEWS = process.env.NEXT_PUBLIC_GNEWS_TOKEN ?? "";

// ── Types ─────────────────────────────────────────────────────────
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

// FIX: tambah semua field yang dikembalikan MarketService.getGoldPrice()
interface GoldPrice {
  price: number | null;
  high: number | null;
  low: number | null;
  prev_close_price: number | null;
  marketStatus: "open" | "closed";
  message: string | null;
  lastRefreshed: string | null;
}

// FIX: tambah price_idr dan last_updated dari MarketService.getCryptoPrice()
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

// ── Mock news fallback ────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────
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
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
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

// FIX: fetchWithToken ke backend market endpoint, bukan bare fetch
// Ini supaya JWT dikirim dan tidak kena 401 dari JwtAuthGuard
async function fetchMarketWithToken(
  token: string,
  path: string,
): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ── Fetch news: GNews → mock fallback ────────────────────────────
async function fetchNews(): Promise<NewsItem[]> {
  try {
    if (GNEWS) {
      const res = await fetch(
        `https://gnews.io/api/v4/search?q=crypto+gold+bitcoin&lang=en&max=6&token=${GNEWS}`,
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

// ── Shared Components ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-blue-50 ${className}`} />;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-blue-100 rounded-2xl px-3 py-2 text-[11px] shadow-xl">
      <p className="text-slate-400 mb-1 font-mono font-bold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-black">
          {p.name === "income" ? "Masuk" : "Keluar"}: {fmtIDR(p.value)}
        </p>
      ))}
    </div>
  );
}

function Card({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ── Modal Transaksi Baru ──────────────────────────────────────────
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

        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }

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
      setError("Jumlah tidak valid");
      return;
    }

    if (!categoryId) {
      setError("Pilih kategori");
      return;
    }

    setIsLoading(true);

    try {
      await fetchWithToken(token, "/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

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
      setError(err?.message || "Gagal membuat transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-blue-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[20px] font-black text-slate-800">
              Tambah Transaksi
            </h2>

            <p className="text-[12px] text-slate-400 font-medium mt-1">
              Catat income atau expense baru
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`py-3 rounded-2xl font-black text-[13px] transition-all ${
              type === "EXPENSE"
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            💸 Expense
          </button>

          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`py-3 rounded-2xl font-black text-[13px] transition-all ${
              type === "INCOME"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            💰 Income
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-[12px] font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100000"
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">
              {loadingCategory
                ? "Loading..."
                : `Pilih kategori ${type.toLowerCase()}`}
            </option>

            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi"
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black"
          >
            {isLoading ? "Loading..." : "Simpan Transaksi"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Widgets ───────────────────────────────────────────────────────
function CashflowChart({ transactions }: { transactions: Transaction[] }) {
  const monthly = (() => {
    const map: Record<
      string,
      { month: string; income: number; expense: number }
    > = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("id-ID", { month: "short" });
      map[key] = { month: key, income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const key = new Date(t.createdAt).toLocaleString("id-ID", {
        month: "short",
      });
      if (!map[key]) return;
      if (t.type === "INCOME") map[key].income += t.amount;
      if (t.type === "EXPENSE") map[key].expense += t.amount;
    });
    return Object.values(map);
  })();

  return (
    <Card delay={0} className="p-6 col-span-12 xl:col-span-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-slate-800 font-black text-[15px]">Arus Kas</p>
          <p className="text-slate-400 text-[11px] font-mono mt-0.5">
            6 bulan terakhir
          </p>
        </div>
        <div className="flex gap-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-blue-500">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Income
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Expense
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={monthly} barSize={18} barGap={4}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(59,130,246,0.04)", radius: 8 }}
          />
          <Bar dataKey="income" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="#F87171" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function UserCard({ user, stats }: { user: User | null; stats: Stats | null }) {
  const [show, setShow] = useState(false);

  return (
    <Card
      delay={0.06}
      className="p-6 col-span-12 xl:col-span-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-blue-100 border border-blue-100 shadow-sm flex items-center justify-center shrink-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : user ? (
              <span className="text-blue-600 font-black text-[16px]">
                {getInitials(user.name)}
              </span>
            ) : (
              <div className="w-full h-full animate-pulse bg-blue-50" />
            )}
          </div>
          <div>
            {user ? (
              <>
                <p className="text-slate-800 font-black text-[14px] leading-tight">
                  {user.name}
                </p>
                <p className="text-slate-400 text-[10px] font-mono">
                  {user.email}
                </p>
              </>
            ) : (
              <>
                <Skeleton className="w-28 h-3.5 mb-1.5" />
                <Skeleton className="w-36 h-2.5" />
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            {user?.role ?? "USER"}
          </span>
          <a
            href="/settings"
            className="w-8 h-8 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all"
            title="Pengaturan"
          >
            <FiSettings size={13} />
          </a>
        </div>
      </div>

      <div
        className="relative w-full rounded-2xl p-5 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)",
          minHeight: "136px",
        }}
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-[9px] font-mono uppercase tracking-widest mb-0.5">
                Saldo Utama
              </p>
              <div className="flex items-center gap-2">
                {user ? (
                  <p className="text-white text-[22px] font-black tracking-tight">
                    {show ? fmtIDR(user.balance) : "Rp ••••••••"}
                  </p>
                ) : (
                  <Skeleton className="w-36 h-6 bg-white/20" />
                )}
                <button
                  onClick={() => setShow(!show)}
                  className="text-blue-200 hover:text-white transition-colors mt-0.5"
                >
                  {show ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                </button>
              </div>
            </div>
            <FiCreditCard className="text-white/40" size={22} />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <p className="text-blue-200/60 text-[9px] font-mono uppercase tracking-widest">
                Nama
              </p>
              <p className="text-white/80 text-[12px] font-bold tracking-widest uppercase">
                {user?.name ?? "──────"}
              </p>
            </div>
            <p className="text-white/60 text-[13px] font-black italic tracking-widest">
              VISA
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3.5 bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-1.5 mb-1">
            <FiArrowUpRight size={11} className="text-blue-600" />
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
              Pemasukan
            </p>
          </div>
          {stats ? (
            <p className="text-blue-600 text-[15px] font-black">
              {fmtIDR(stats.totalRevenue)}
            </p>
          ) : (
            <Skeleton className="w-24 h-4" />
          )}
        </div>
        <div className="rounded-2xl p-3.5 bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 mb-1">
            <FiArrowDownLeft size={11} className="text-slate-500" />
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
              Expense
            </p>
          </div>
          {stats ? (
            <p className="text-slate-700 text-[15px] font-black">
              {fmtIDR(stats.totalExpenses)}
            </p>
          ) : (
            <Skeleton className="w-24 h-4" />
          )}
        </div>
      </div>
    </Card>
  );
}

function SpendingAnalysis({ transactions }: { transactions: Transaction[] }) {
  const expenses = transactions.filter((t) => t.type === "EXPENSE");
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, t) => {
    const key = (t.category?.name ?? "other").toLowerCase();
    acc[key] = (acc[key] ?? 0) + t.amount;
    return acc;
  }, {});
  const sorted = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];

  return (
    <Card delay={0.1} className="p-6 col-span-12 xl:col-span-4">
      <p className="text-slate-800 font-black text-[15px] mb-1">
        Expenditure Analysis
      </p>
      <p className="text-slate-400 text-[11px] font-mono mb-5">Per category</p>
      {sorted.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map(([cat, val], i) => {
            const pct = total ? (val / total) * 100 : 0;
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-bold text-slate-600 flex items-center gap-1.5 capitalize">
                    {CATEGORY_ICON[cat] ?? "📦"} {cat}
                  </span>
                  <span className="text-[11px] font-black text-slate-500 font-mono">
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.7,
                      delay: 0.2 + i * 0.08,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full"
                    style={{ background: COLORS[i] ?? "#3b82f6" }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {fmtIDR(val)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function NewsWidget({ news }: { news: NewsItem[] }) {
  return (
    <Card delay={0.14} className="p-6 col-span-12 xl:col-span-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-slate-800 font-black text-[15px]">Market News</p>
          <p className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
            {!GNEWS && <span className="text-amber-500">⚠ Demo ·</span>}
            Latest
          </p>
        </div>
      </div>
      {news.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-10 h-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {news.slice(0, 4).map((n) => (
            <a
              key={n.id}
              href={n.url !== "#" ? n.url : undefined}
              target={n.url !== "#" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className={`flex gap-3 group rounded-2xl p-2 -mx-2 hover:bg-blue-50 transition-colors ${n.url === "#" ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-[14px]">
                📰
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 text-[12px] font-bold leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {n.headline}
                </p>
                <div className="flex gap-2 mt-0.5 items-center">
                  <span className="text-slate-400 text-[10px] font-mono">
                    {n.source}
                  </span>
                  <span className="text-slate-300 text-[10px]">·</span>
                  <FiClock size={8} className="text-slate-300" />
                  <span className="text-slate-400 text-[10px] font-mono">
                    {timeAgo(n.datetime)}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
      {!GNEWS && (
        <p className="text-amber-600 text-[10px] font-mono mt-3 pt-3 border-t border-slate-100">
          💡 Set{" "}
          <code className="bg-amber-50 px-1 rounded">
            NEXT_PUBLIC_GNEWS_TOKEN
          </code>{" "}
          untuk berita real
        </p>
      )}
    </Card>
  );
}

// FIX: PriceWidget sekarang handle gold market closed + null price
function PriceWidget({
  gold,
  btc,
  eth,
}: {
  gold: GoldPrice | null;
  btc: CryptoData | null;
  eth: CryptoData | null;
}) {
  // FIX: ambil harga gold yang valid — price kalau open, prev_close_price kalau closed
  const goldPrice = gold?.price ?? gold?.prev_close_price ?? null;
  const goldHigh = gold?.high ?? null;
  const goldClosed = gold?.marketStatus === "closed";

  const items = [
    {
      label: "Emas / oz",
      value: goldPrice != null ? fmtUSD(goldPrice) : null,
      change: null,
      // FIX: tampilkan status market closed kalau memang tutup
      sub: goldClosed
        ? "🔴 Market closed"
        : goldHigh != null
          ? `H: ${fmtUSD(goldHigh)}`
          : null,
      icon: "🥇",
    },
    {
      label: "Bitcoin",
      // FIX: guard price_usd > 0 supaya tidak render $0.00
      value: btc && btc.price_usd > 0 ? fmtUSD(btc.price_usd) : null,
      change: btc?.change_24h ?? null,
      sub: null,
      icon: <SiBitcoin className="text-[#f7931a]" size={14} />,
    },
    {
      label: "Ethereum",
      // FIX: guard price_usd > 0
      value: eth && eth.price_usd > 0 ? fmtUSD(eth.price_usd) : null,
      change: eth?.change_24h ?? null,
      sub: null,
      icon: <SiEthereum className="text-[#627eea]" size={14} />,
    },
  ];

  return (
    <Card delay={0.18} className="p-6 col-span-12 xl:col-span-3">
      <p className="text-slate-800 font-black text-[15px] mb-1">Harga Aset</p>
      <p className="text-slate-400 text-[11px] font-mono mb-5">Live market</p>
      <div className="space-y-3">
        {items.map((item) => {
          const up = (item.change ?? 0) >= 0;
          return (
            <div
              key={item.label}
              className="rounded-2xl p-3.5 bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[12px]">
                  {item.icon}
                </div>
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                  {item.label}
                </span>
              </div>
              {item.value ? (
                <>
                  <p className="text-slate-800 text-[15px] font-black font-mono">
                    {item.value}
                  </p>
                  {item.change != null && (
                    <p
                      className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${up ? "text-blue-500" : "text-slate-400"}`}
                    >
                      {up ? (
                        <FiTrendingUp size={10} />
                      ) : (
                        <FiTrendingDown size={10} />
                      )}
                      {Math.abs(item.change).toFixed(2)}%
                    </p>
                  )}
                  {item.sub && (
                    <p className="text-slate-400 text-[9px] font-mono mt-0.5">
                      {item.sub}
                    </p>
                  )}
                </>
              ) : (
                <Skeleton className="w-24 h-5 mt-1" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card delay={0.22} className="p-6 col-span-12">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-slate-800 font-black text-[15px]">
            Recent Transactions
          </p>
          <p className="text-slate-400 text-[11px] font-mono">
            Activity history
          </p>
        </div>
        <a
          href="/customer/transactions"
          className="text-blue-500 text-[11px] font-bold hover:underline flex items-center gap-1"
        >
          View All <FiExternalLink size={10} />
        </a>
      </div>
      {transactions.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-40 h-3" />
                <Skeleton className="w-24 h-2.5" />
              </div>
              <Skeleton className="w-24 h-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {transactions.slice(0, 8).map((t) => {
            const isIncome = t.type === "INCOME";
            const cat = (t.category?.name ?? "other").toLowerCase();
            return (
              <motion.div
                key={t.id}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-blue-50 transition-colors group cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-[17px] shrink-0 ${isIncome ? "bg-blue-100" : "bg-slate-100"}`}
                >
                  {CATEGORY_ICON[cat] ?? (isIncome ? "💰" : "💸")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-[13px] font-bold truncate group-hover:text-blue-600 transition-colors">
                    {t.description || t.category?.name}
                  </p>
                  <p className="text-slate-400 text-[10px] font-mono capitalize">
                    {t.category?.name} ·{" "}
                    {new Date(t.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p
                  className={`text-[13px] font-black font-mono shrink-0 ${isIncome ? "text-blue-600" : "text-slate-600"}`}
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

// ── Main Page ─────────────────────────────────────────────────────
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

  // FIX: kirim token ke market endpoints — controller pakai JwtAuthGuard
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
        // FIX: gunakan fetchMarketWithToken, bukan bare fetch
        fetchMarketWithToken(token, "/market/gold-price"),
        fetchMarketWithToken(token, "/market/crypto?coin=bitcoin"),
        fetchMarketWithToken(token, "/market/crypto?coin=ethereum"),
        fetchNews(),
      ]);
      if (u.status === "fulfilled") setUser(u.value);
      if (s.status === "fulfilled") setStats(s.value);
      if (tx.status === "fulfilled")
        setTransactions(Array.isArray(tx.value) ? tx.value : []);
      if (g.status === "fulfilled") setGold(g.value);
      if (b.status === "fulfilled") setBtc(b.value);
      if (e.status === "fulfilled") setEth(e.value);
      if (n.status === "fulfilled") setNews(n.value);
      setLastUpdate(new Date().toLocaleTimeString("id-ID"));
    } finally {
      setRefreshing(false);
    }
  };

  // FIX: tunggu token tersedia sebelum fetch market
  useEffect(() => {
    if (!token) return;
    refreshTransactions();
    fetchMarket(token);
  }, [token]);

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
        className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 xl:px-10"
        style={{
          fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-between mb-7"
          >
            <div>
              <h1 className="text-slate-800 text-[24px] font-black tracking-tight">
                Halo,{" "}
                <span className="text-blue-600">
                  {user?.name?.split(" ")[0] ?? "..."}
                </span>{" "}
                👋
              </h1>
              <p className="text-slate-400 text-[12px] font-mono mt-0.5">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {lastUpdate && ` · diperbarui ${lastUpdate}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                onClick={fetchAll}
                whileTap={{ scale: 0.92 }}
                className="flex items-center gap-2 border border-slate-200 text-slate-400 text-[12px] font-bold px-4 py-2.5 rounded-xl hover:border-blue-300 hover:text-blue-500 transition-all bg-white"
              >
                <FiRefreshCw
                  size={12}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </motion.button>

              <motion.button
                onClick={() => setShowModal(true)}
                whileTap={{ scale: 0.94 }}
                className="flex items-center gap-2 bg-blue-600 text-white text-[13px] font-black px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                <FiPlus strokeWidth={3} size={14} />
                Transaksi Baru
              </motion.button>
            </div>
          </motion.div>

          {/* Grid */}
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