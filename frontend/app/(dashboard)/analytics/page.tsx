"use client";


import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { fetchWithToken } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  FiTrendingDown, FiTrendingUp, FiCalendar, FiPieChart, FiBarChart2,
} from "react-icons/fi";

// use NextAuth session token via fetchWithToken

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}rb`;
  return `${n}`;
};

// Palet warna per kategori
const CAT_COLORS: Record<string, string> = {
  food:          "#3b82f6",
  transport:     "#6366f1",
  entertainment: "#8b5cf6",
  shopping:      "#ec4899",
  health:        "#14b8a6",
  "top up":      "#f59e0b",
  salary:        "#10b981",
  income:        "#10b981",
  crypto:        "#f97316",
  gold:          "#eab308",
  other:         "#94a3b8",
};

const CAT_ICON: Record<string, string> = {
  food: "🍜", transport: "🚗", entertainment: "🎬", shopping: "🛍",
  health: "🏥", "top up": "📲", salary: "💼", income: "💼",
  crypto: "₿", gold: "🥇", other: "📦",
};

const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: { name: string };
  description: string;
  createdAt: string;
}

// ── Custom Tooltip ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
      {label && <p className="text-white/50 text-[10px] font-mono mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-white font-black text-[13px]" style={{ color: p.color ?? "#fff" }}>
          {fmtIDR(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, accent, delay = 0,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; accent: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-[15px]"
          style={{ background: accent }}
        >
          {icon}
        </div>
      </div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="text-slate-800 text-[22px] font-black leading-none">{value}</p>
      {sub && <p className="text-slate-400 text-[11px] font-mono mt-1">{sub}</p>}
    </motion.div>
  );
}

// ── Section Card ──────────────────────────────────────────────────
function SectionCard({
  title, subtitle, children, delay = 0, className = "",
}: {
  title: string; subtitle?: string;
  children: React.ReactNode; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 ${className}`}
    >
      <div className="mb-5">
        <p className="text-slate-800 font-black text-[15px]">{title}</p>
        {subtitle && <p className="text-slate-400 text-[11px] font-mono mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [year,         setYear]         = useState(new Date().getFullYear());
  const [activeMonth,  setActiveMonth]  = useState<number | null>(null);
  const [chartView,    setChartView]    = useState<"area" | "bar">("area");

  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken ?? "";

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchWithToken(token, "/transactions")
      .then((data) => { if (Array.isArray(data)) setTransactions(data); })
      .finally(() => setLoading(false));
  }, [token]);

  // Filter transaksi berdasar tahun yang dipilih
  const yearTx = useMemo(() =>
    transactions.filter((t) => new Date(t.createdAt).getFullYear() === year),
    [transactions, year]
  );

  const expenses = useMemo(() => yearTx.filter((t) => t.type === "EXPENSE"), [yearTx]);
  const incomes  = useMemo(() => yearTx.filter((t) => t.type === "INCOME"),  [yearTx]);

  const totalExpense = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome  = useMemo(() => incomes.reduce((s, t) => s + t.amount, 0),  [incomes]);
  const netBalance   = totalIncome - totalExpense;

  // Data per bulan untuk area/bar chart
  const monthlyData = useMemo(() => {
    return MONTHS_ID.map((name, idx) => {
      const mo = idx + 1;
      const mTx = yearTx.filter((t) => new Date(t.createdAt).getMonth() + 1 === mo);
      return {
        name,
        mo,
        expense: mTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
        income:  mTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [yearTx]);

  // Breakdown per kategori (pengeluaran)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    const src = activeMonth !== null
      ? expenses.filter((t) => new Date(t.createdAt).getMonth() + 1 === activeMonth)
      : expenses;
    src.forEach((t) => {
      const cat = (t.category?.name ?? "other").toLowerCase();
      map[cat] = (map[cat] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, activeMonth]);

  const catTotal = categoryData.reduce((s, c) => s + c.value, 0);

  // Top pengeluaran bulan ini
  const thisMonth   = new Date().getMonth() + 1;
  const lastMonth   = thisMonth === 1 ? 12 : thisMonth - 1;
  const thisMonthExp = expenses
    .filter((t) => new Date(t.createdAt).getMonth() + 1 === thisMonth)
    .reduce((s, t) => s + t.amount, 0);
  const lastMonthExp = expenses
    .filter((t) => new Date(t.createdAt).getMonth() + 1 === lastMonth)
    .reduce((s, t) => s + t.amount, 0);
  const expenseChange = lastMonthExp > 0
    ? ((thisMonthExp - lastMonthExp) / lastMonthExp) * 100
    : 0;

  const availableYears = useMemo(() => {
    const ys = new Set(transactions.map((t) => new Date(t.createdAt).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [transactions]);

  return (
    <div
      className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"
      style={{ fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)" }}
    >
      <div className="max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between mb-7"
        >
          <div>
            <h1 className="text-slate-800 text-[24px] font-black tracking-tight">Analytics</h1>
            <p className="text-slate-400 text-[12px] font-mono mt-0.5">Breakdown pengeluaran & pemasukan kamu</p>
          </div>
          {/* Year Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
            <FiCalendar size={13} className="text-slate-400 ml-2" />
            {availableYears.length > 0 ? availableYears.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-4 py-2 rounded-xl text-[12px] font-black transition-all ${
                  year === y ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {y}
              </button>
            )) : (
              <span className="px-4 py-2 text-[12px] font-black text-slate-500">{year}</span>
            )}
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Pengeluaran" value={fmtIDR(totalExpense)}
              sub={`${expenses.length} transaksi`}
              icon={<FiTrendingDown size={16} />}
              accent="linear-gradient(135deg,#475569,#0f172a)"
              delay={0}
            />
            <StatCard
              label="Total Pemasukan" value={fmtIDR(totalIncome)}
              sub={`${incomes.length} transaksi`}
              icon={<FiTrendingUp size={16} />}
              accent="linear-gradient(135deg,#3b82f6,#1d4ed8)"
              delay={0.05}
            />
            <StatCard
              label="Net Balance" value={fmtIDR(Math.abs(netBalance))}
              sub={netBalance >= 0 ? "Surplus 🎉" : "Defisit ⚠️"}
              icon={netBalance >= 0 ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
              accent={netBalance >= 0 ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#b91c1c)"}
              delay={0.1}
            />
            <StatCard
              label="Bulan Ini vs Lalu"
              value={`${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(1)}%`}
              sub={`${fmtIDR(thisMonthExp)} bulan ini`}
              icon={expenseChange >= 0 ? <FiTrendingDown size={16} /> : <FiTrendingUp size={16} />}
              accent={expenseChange <= 0
                ? "linear-gradient(135deg,#10b981,#059669)"
                : "linear-gradient(135deg,#f59e0b,#d97706)"}
              delay={0.15}
            />
          </div>
        )}

        {/* ── Chart Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

          {/* Area / Bar chart */}
          <SectionCard
            title="Cashflow Bulanan"
            subtitle={`Pemasukan vs pengeluaran ${year}`}
            delay={0.18}
            className="lg:col-span-2"
          >
            {/* Toggle chart type */}
            <div className="flex gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl w-fit mb-5">
              <button
                onClick={() => setChartView("area")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                  chartView === "area" ? "bg-white shadow-sm text-slate-800" : "text-slate-400"
                }`}
              >
                <FiTrendingUp size={12} /> Area
              </button>
              <button
                onClick={() => setChartView("bar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                  chartView === "bar" ? "bg-white shadow-sm text-slate-800" : "text-slate-400"
                }`}
              >
                <FiBarChart2 size={12} /> Bar
              </button>
            </div>

            {loading ? (
              <Skeleton className="h-52" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                {chartView === "area" ? (
                  <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#475569" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#475569" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="income"  stroke="#3b82f6" strokeWidth={2} fill="url(#gIncome)"  dot={false} name="Pemasukan"  />
                    <Area type="monotone" dataKey="expense" stroke="#475569" strokeWidth={2} fill="url(#gExpense)" dot={false} name="Pengeluaran" />
                  </AreaChart>
                ) : (
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="income"  fill="#3b82f6" radius={[6, 6, 0, 0]} name="Pemasukan"   maxBarSize={20} />
                    <Bar dataKey="expense" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Pengeluaran" maxBarSize={20} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}

            {/* Legend */}
            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                <span className="text-slate-400 text-[10px] font-mono">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
                <span className="text-slate-400 text-[10px] font-mono">Pengeluaran</span>
              </div>
            </div>

            {/* Month pills — klik untuk filter kategori */}
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-50">
              <button
                onClick={() => setActiveMonth(null)}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                  activeMonth === null ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Semua
              </button>
              {monthlyData.filter((m) => m.expense > 0 || m.income > 0).map((m) => (
                <button
                  key={m.mo}
                  onClick={() => setActiveMonth(activeMonth === m.mo ? null : m.mo)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                    activeMonth === m.mo ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Donut chart */}
          <SectionCard
            title="Kategori Pengeluaran"
            subtitle={activeMonth !== null ? `Filter: ${MONTHS_ID[activeMonth - 1]}` : `Seluruh ${year}`}
            delay={0.2}
          >
            {loading ? (
              <Skeleton className="h-52" />
            ) : categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-slate-400 text-[12px] font-mono">Belum ada pengeluaran</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={CAT_COLORS[entry.name] ?? `hsl(${i * 47},65%,55%)`}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Category list */}
                <div className="space-y-2.5 mt-2">
                  {categoryData.slice(0, 5).map((cat) => {
                    const pct = catTotal > 0 ? (cat.value / catTotal) * 100 : 0;
                    const col = CAT_COLORS[cat.name] ?? "#94a3b8";
                    return (
                      <div key={cat.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px]">{CAT_ICON[cat.name] ?? "📦"}</span>
                            <span className="text-slate-600 text-[11px] font-bold capitalize">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[10px] font-mono">{pct.toFixed(0)}%</span>
                            <span className="text-slate-700 text-[11px] font-black font-mono">{fmtShort(cat.value)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: col }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {categoryData.length > 5 && (
                    <p className="text-slate-400 text-[10px] font-mono text-center pt-1">
                      +{categoryData.length - 5} kategori lainnya
                    </p>
                  )}
                </div>
              </>
            )}
          </SectionCard>
        </div>

        {/* ── Monthly Expense Bar per Kategori ── */}
        <SectionCard
          title="Pengeluaran per Kategori Tiap Bulan"
          subtitle="Distribusi kategori sepanjang tahun"
          delay={0.24}
          className="mb-4"
        >
          {loading ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={monthlyData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                barSize={14}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="expense" name="Pengeluaran" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={activeMonth === entry.mo ? "#3b82f6" : "#e2e8f0"}
                      cursor="pointer"
                      onClick={() => setActiveMonth(activeMonth === entry.mo ? null : entry.mo)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-slate-400 text-[10px] font-mono mt-3">
            💡 Klik batang bulan untuk filter kategori di atas
          </p>
        </SectionCard>

        {/* ── Top Transactions ── */}
        <SectionCard
          title="Pengeluaran Terbesar"
          subtitle={activeMonth !== null ? MONTHS_ID[activeMonth - 1] + " " + year : "Sepanjang " + year}
          delay={0.28}
        >
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="flex-1 h-4" />
                  <Skeleton className="w-24 h-4" />
                </div>
              ))}
            </div>
          ) : (() => {
            const src = activeMonth !== null
              ? expenses.filter((t) => new Date(t.createdAt).getMonth() + 1 === activeMonth)
              : expenses;
            const top = [...src].sort((a, b) => b.amount - a.amount).slice(0, 8);
            if (top.length === 0) return (
              <p className="text-slate-400 text-[12px] font-mono text-center py-8">Belum ada pengeluaran</p>
            );
            return (
              <div className="space-y-2">
                {top.map((t, i) => {
                  const cat = (t.category?.name ?? "other").toLowerCase();
                  const col = CAT_COLORS[cat] ?? "#94a3b8";
                  const maxAmt = top[0].amount;
                  const pct = (t.amount / maxAmt) * 100;
                  return (
                    <div key={t.id} className="flex items-center gap-3 py-2 group">
                      <span className="text-slate-300 text-[11px] font-black w-5 shrink-0 text-right">
                        {i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[15px] shrink-0 bg-slate-50">
                        {CAT_ICON[cat] ?? "💸"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-slate-700 text-[12px] font-bold truncate group-hover:text-blue-600 transition-colors">
                            {t.description || t.category?.name}
                          </p>
                          <p className="text-slate-800 text-[12px] font-black font-mono ml-3 shrink-0">
                            {fmtIDR(t.amount)}
                          </p>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: i * 0.04 }}
                            className="h-full rounded-full"
                            style={{ background: col }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </SectionCard>

      </div>
    </div>
  );
}