"use client";

//  FinTrack — Saving Goals Page
//  Path: app/customer/savings/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTarget, FiPlus, FiX, FiCalendar,
  FiTrendingUp, FiCheckCircle, FiClock, FiZap,
} from "react-icons/fi";

// ── Types ─────────────────────────────────────────────────────────
interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category?: string;
  deadline?: string;
  isRecurrent?: boolean;
  recurrentAmount?: number;
}

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const pct = (current: number, target: number) =>
  Math.min(100, Math.round((current / target) * 100));

const daysLeft = (deadline?: string) => {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ── DEBUG: coba semua kemungkinan nama field token ────────────────
function getTokenFromSession(session: any): string {
  const user = session?.user;

  // 🔍 Log lengkap — cek console browser untuk tahu nama field yang benar
  console.log("🔍 [DEBUG] session.user:", JSON.stringify(user, null, 2));
  console.log("🔍 [DEBUG] session (root):", JSON.stringify(session, null, 2));

  const token =
    user?.accessToken ??
    user?.token ??
    user?.jwt ??
    user?.access_token ??
    user?.bearerToken ??
    (session as any)?.accessToken ??   // kadang ada di root session, bukan di user
    (session as any)?.token ??
    "";

  console.log("🔍 [DEBUG] token resolved:", token ? `${String(token).slice(0, 20)}...` : "❌ KOSONG — cek field di atas");
  return String(token);
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-blue-50 ${className}`} />;
}

function Card({
  children, className = "", delay = 0,
}: { children: React.ReactNode; className?: string; delay?: number }) {
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

// ── Goal emoji map ────────────────────────────────────────────────
const GOAL_EMOJI: Record<string, string> = {
  elektronik: "💻", liburan: "✈️", darurat: "🛡️", kendaraan: "🚗",
  rumah: "🏠", pendidikan: "📚", kesehatan: "🏥", investasi: "📈",
  wedding: "💍", gadget: "📱", fashion: "👗", olahraga: "🏋️",
};

function getGoalEmoji(category?: string, name?: string) {
  if (category) {
    const key = category.toLowerCase();
    for (const [k, v] of Object.entries(GOAL_EMOJI)) {
      if (key.includes(k)) return v;
    }
  }
  if (name) {
    const n = name.toLowerCase();
    if (n.includes("laptop") || n.includes("pc"))    return "💻";
    if (n.includes("motor") || n.includes("mobil"))  return "🚗";
    if (n.includes("bali") || n.includes("liburan")) return "✈️";
    if (n.includes("nikah") || n.includes("kawin"))  return "💍";
    if (n.includes("rumah"))                          return "🏠";
  }
  return "🎯";
}

const inputCls =
  "w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300 font-medium text-[14px]";

// ── Create Goal Modal ─────────────────────────────────────────────
function CreateGoalModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: () => void }) {
  const { data: session } = useSession();
  const token = getTokenFromSession(session);

  const [form, setForm]       = useState({ name: "", targetAmount: "", category: "", deadline: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!form.name || !form.targetAmount) return;

    console.log("🚀 [CREATE] token saat submit:", token ? `${token.slice(0, 20)}...` : "❌ KOSONG");
    console.log("🚀 [CREATE] URL:", `${process.env.NEXT_PUBLIC_BASE_API_URL}/saving-goals`);

    if (!token) {
      alert("Token kosong! Buka DevTools → Console dan lihat log 🔍 [DEBUG] session.user untuk tahu nama field token yang benar.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/saving-goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
              name: form.name,
              targetAmount: Number(form.targetAmount),
              category: form.category || undefined,
              deadline: form.deadline
                ? new Date(form.deadline).toISOString()
                : undefined,
        }),
      });

      const resBody = await res.clone().json().catch(() => null);
      console.log("📡 [CREATE] status:", res.status, "body:", resBody);

      if (!res.ok) {
        alert(`Error ${res.status}: ${JSON.stringify(resBody)}`);
        return;
      }

      onCreated();
      onClose();
    } catch (err) {
      console.error("❌ [CREATE] error:", err);
      alert("Gagal membuat goal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl shadow-blue-100/50 z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-800 font-black text-[18px]">Buat Saving Goal</h2>
            <p className="text-slate-400 text-[12px] font-mono mt-0.5">Tentukan target tabunganmu</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center">
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Goal *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Beli Laptop, Liburan Bali"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Amount (Rp) *</label>
            <input
              type="number"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              placeholder="5000000"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategori</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Elektronik, Liburan, Darurat..."
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.name || !form.targetAmount}
          className="mt-6 w-full py-3.5 rounded-2xl font-black text-[14px] text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><FiPlus size={15} /> Buat Goal</>}
        </button>
      </motion.div>
    </div>
  );
}

// ── Deposit Modal ─────────────────────────────────────────────────
function DepositModal({
  goal, onClose, onDeposited,
}: { goal: SavingGoal; onClose: () => void; onDeposited: () => void }) {
  const { data: session } = useSession();
  const token = getTokenFromSession(session);

  const [amount, setAmount]   = useState("");
  const [loading, setLoading] = useState(false);
  const remaining             = goal.targetAmount - goal.currentAmount;

  const QUICK = [50000, 100000, 200000, 500000].filter((n) => n <= remaining);

  async function handleDeposit() {
    if (!amount) return;

    console.log("🚀 [DEPOSIT] token saat submit:", token ? `${token.slice(0, 20)}...` : "❌ KOSONG");

    if (!token) {
      alert("Token kosong! Buka DevTools → Console dan lihat log 🔍 [DEBUG] session.user");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/saving-goals/${goal.id}/deposit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const resBody = await res.clone().json().catch(() => null);
      console.log("📡 [DEPOSIT] status:", res.status, "body:", resBody);

      if (!res.ok) {
        alert(`Error ${res.status}: ${JSON.stringify(resBody)}`);
        return;
      }

      onDeposited();
      onClose();
    } catch (err) {
      console.error("❌ [DEPOSIT] error:", err);
      alert("Gagal deposit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-blue-100/50 z-10"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-slate-800 font-black text-[18px]">Tambah Dana</h2>
            <p className="text-slate-400 text-[12px] font-mono mt-0.5 truncate max-w-[200px]">{goal.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center">
            <FiX size={18} />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
          <div className="flex justify-between text-[11px] font-mono mb-2">
            <span className="text-blue-600 font-bold">{fmt(goal.currentAmount)}</span>
            <span className="text-slate-400">{fmt(goal.targetAmount)}</span>
          </div>
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${pct(goal.currentAmount, goal.targetAmount)}%` }}
            />
          </div>
          <p className="text-blue-500 text-[11px] font-bold mt-2">Sisa: {fmt(remaining)}</p>
        </div>

        {QUICK.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nominal Cepat</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK.map((n) => (
                <button key={n} onClick={() => setAmount(String(n))}
                  className="py-2 rounded-xl border border-slate-200 text-[11px] font-black text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  {new Intl.NumberFormat("id-ID", { notation: "compact" }).format(n)}
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Jumlah deposit (Rp)"
          className={inputCls + " mb-4"}
        />

        <button
          onClick={handleDeposit}
          disabled={loading || !amount}
          className="w-full py-3.5 rounded-2xl font-black text-[14px] text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><FiZap size={14} /> Deposit Sekarang</>}
        </button>
      </motion.div>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────
function GoalCard({
  goal, onDeposit, index,
}: { goal: SavingGoal; onDeposit: (g: SavingGoal) => void; index: number }) {
  const progress = pct(goal.currentAmount, goal.targetAmount);
  const days     = daysLeft(goal.deadline);
  const done     = progress >= 100;
  const emoji    = getGoalEmoji(goal.category, goal.name);

  const barColor = done
    ? "bg-emerald-500"
    : progress >= 75 ? "bg-blue-500"
    : progress >= 40 ? "bg-blue-600"
    : "bg-blue-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`group bg-white border rounded-3xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300 ${
        done ? "border-emerald-200 hover:border-emerald-300" : "border-slate-100 hover:border-blue-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[20px] shrink-0 ${
            done ? "bg-emerald-50 border border-emerald-100" : "bg-blue-50 border border-blue-100"
          }`}>
            {emoji}
          </div>
          <div className="min-w-0">
            <p className="text-slate-800 font-black text-[14px] truncate leading-tight">{goal.name}</p>
            {goal.category && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                {goal.category}
              </span>
            )}
          </div>
        </div>

        {done ? (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            <FiCheckCircle size={10} /> Tercapai
          </span>
        ) : (
          <button
            onClick={() => onDeposit(goal)}
            className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-sm shadow-blue-200 transition-all active:scale-95"
          >
            <FiPlus size={11} strokeWidth={3} /> Deposit
          </button>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-0.5">Terkumpul</p>
          <p className={`text-[18px] font-black tracking-tight ${done ? "text-emerald-600" : "text-slate-800"}`}>
            {fmt(goal.currentAmount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-0.5">Target</p>
          <p className="text-slate-500 text-[14px] font-black">{fmt(goal.targetAmount)}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className={`text-[12px] font-black ${done ? "text-emerald-600" : "text-blue-600"}`}>
            {progress}%
          </span>
          <div className="flex items-center gap-3">
            {days !== null && !done && (
              <span className={`flex items-center gap-1 text-[10px] font-bold ${
                days <= 7 ? "text-red-500" : days <= 30 ? "text-amber-500" : "text-slate-400"
              }`}>
                <FiClock size={9} />
                {days === 0 ? "Hari ini!" : `${days}h lagi`}
              </span>
            )}
            {goal.deadline && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <FiCalendar size={9} />
                {new Date(goal.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, delay: 0.2 + index * 0.06, ease: "easeOut" }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function SavingsPage() {
  const { data: session } = useSession();
  const token             = getTokenFromSession(session);

  const [goals,       setGoals]       = useState<SavingGoal[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingGoal | null>(null);

  const fetchGoals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/saving-goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("📦 [FETCH GOALS] status:", res.status, "data:", data);
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ [FETCH GOALS] error:", err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchGoals();
  }, [token]);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount,  0);
  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completed   = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
  const overallPct  = totalTarget > 0 ? pct(totalSaved, totalTarget) : 0;

  return (
    <div
      className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 xl:px-10"
      style={{ fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)" }}
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
            <h1 className="text-slate-800 text-[24px] font-black tracking-tight">Saving Goals</h1>
            <p className="text-slate-400 text-[12px] font-mono mt-0.5">Rencanakan dan capai target tabunganmu</p>
          </div>
          <motion.button
            onClick={() => setShowCreate(true)}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-2 bg-blue-600 text-white text-[13px] font-black px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
          >
            <FiPlus strokeWidth={3} size={14} />
            Buat Goal
          </motion.button>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Target",
              value: fmt(totalTarget),
              icon: <FiTarget size={16} />,
              iconBg: "bg-blue-50 text-blue-600 border-blue-100",
              valueColor: "text-slate-800",
              delay: 0,
            },
            {
              label: "Total Terkumpul",
              value: fmt(totalSaved),
              icon: <FiTrendingUp size={16} />,
              iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
              valueColor: "text-emerald-600",
              delay: 0.06,
            },
            {
              label: "Goal Tercapai",
              value: `${completed} / ${goals.length}`,
              icon: <FiCheckCircle size={16} />,
              iconBg: "bg-amber-50 text-amber-600 border-amber-100",
              valueColor: "text-slate-800",
              delay: 0.12,
            },
            {
              label: "Overall Progress",
              value: `${overallPct}%`,
              icon: <FiZap size={16} />,
              iconBg: "bg-violet-50 text-violet-600 border-violet-100",
              valueColor: "text-violet-600",
              delay: 0.18,
            },
          ].map((s) => (
            <Card key={s.label} delay={s.delay} className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                  <p className={`text-[20px] font-black tracking-tight mt-0.5 ${s.valueColor}`}>{s.value}</p>
                </div>
              </div>
              {s.label === "Overall Progress" && totalTarget > 0 && (
                <div className="mt-3 h-1.5 bg-violet-50 rounded-full overflow-hidden border border-violet-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallPct}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="h-full bg-violet-500 rounded-full"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Goals grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4">
                <div className="flex gap-3">
                  <Skeleton className="w-11 h-11 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                </div>
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-2" />
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <Card delay={0.2} className="py-20">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[28px] mb-4">
                🎯
              </div>
              <p className="text-slate-700 font-black text-[16px]">Belum ada saving goal</p>
              <p className="text-slate-400 text-[13px] font-mono mt-1 mb-6">Mulai buat goal pertamamu!</p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-blue-600 text-white text-[13px] font-black px-6 py-3 rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                <FiPlus strokeWidth={3} size={14} /> Buat Goal Pertama
              </button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {goals.map((goal, i) => (
              <GoalCard key={goal.id} goal={goal} onDeposit={setDepositGoal} index={i} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateGoalModal onClose={() => setShowCreate(false)} onCreated={fetchGoals} />
        )}
        {depositGoal && (
          <DepositModal goal={depositGoal} onClose={() => setDepositGoal(null)} onDeposited={fetchGoals} />
        )}
      </AnimatePresence>
    </div>
  );
}