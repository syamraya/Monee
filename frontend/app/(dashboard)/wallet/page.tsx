"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowUpRight, FiArrowDownLeft, FiEye, FiEyeOff,
  FiCreditCard, FiX, FiPlus, FiMinus,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3001";

interface User { id: string; name: string; email: string; balance: number }
interface Transaction {
  id: string; amount: number; type: "INCOME" | "EXPENSE";
  category: { name: string }; description: string; createdAt: string;
}
interface Category { id: string; name: string }

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n ?? 0);

const CATEGORY_ICON: Record<string, string> = {
  food: "🍜", transport: "🚗", crypto: "₿", gold: "🥇",
  salary: "💼", income: "💼", entertainment: "🎬",
  shopping: "🛍", health: "🏥", "top up": "📲", other: "📦",
};

// ── Modal Top Up / Tarik ──────────────────────────────────────────
function BalanceModal({ mode, onClose, onSuccess, token }: {
  mode: "topup" | "withdraw";
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isTopUp = mode === "topup";

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((data) => { if (Array.isArray(data)) setCategories(data); });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.currentTarget;
    const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
    const category = (form.elements.namedItem("category") as HTMLSelectElement).value;
    const description = (form.elements.namedItem("description") as HTMLInputElement).value;
    try {
      const res = await fetch(`${API}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount,
          type: isTopUp ? "INCOME" : "EXPENSE",
          category,
          description: description || (isTopUp ? "Top Up Saldo" : "Tarik Saldo"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isTopUp ? "bg-blue-100" : "bg-slate-100"}`}>
              {isTopUp
                ? <FiArrowUpRight className="text-blue-600" size={18} />
                : <FiArrowDownLeft className="text-slate-600" size={18} />}
            </div>
            <h2 className="text-slate-800 font-black text-[18px]">{isTopUp ? "Top Up Saldo" : "Tarik Saldo"}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><FiX size={20} /></button>
        </div>

        {/* Quick amount buttons */}
        <div className="mb-5">
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-2 ml-1">Nominal Cepat</p>
          <div className="grid grid-cols-3 gap-2">
            {[50000, 100000, 200000, 500000, 1000000, 2000000].map((nominal) => (
              <button
                key={nominal} type="button"
                onClick={() => {
                  const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                  if (input) input.value = nominal.toString();
                }}
                className="py-2 px-3 rounded-xl border border-slate-200 text-[11px] font-black text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                {new Intl.NumberFormat("id-ID", { notation: "compact" }).format(nominal)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] text-slate-600 font-bold ml-1">Jumlah (Rp)</label>
            <input name="amount" type="number" min="1" required placeholder="100000"
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-[14px]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-slate-600 font-bold ml-1">Kategori</label>
            <select name="category" required
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-[14px]">
              <option value="">Pilih kategori...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-slate-600 font-bold ml-1">Keterangan</label>
            <input name="description" type="text"
              placeholder={isTopUp ? "Transfer dari Bank BCA..." : "Tarik ke rekening..."}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-[14px]" />
          </div>
          <button disabled={isLoading}
            className={`w-full py-3.5 rounded-2xl font-black text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2 ${
              isTopUp ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" : "bg-slate-800 hover:bg-slate-900 shadow-lg shadow-slate-200"
            }`}>
            {isLoading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : isTopUp
              ? <><FiPlus strokeWidth={3} size={14} /> Top Up Sekarang</>
              : <><FiMinus strokeWidth={3} size={14} /> Tarik Sekarang</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function WalletPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken ?? "";

  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [modal, setModal] = useState<"topup" | "withdraw" | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [u, tx] = await Promise.allSettled([
        fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${API}/transactions`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      if (u.status === "fulfilled") setUser(u.value);
      if (tx.status === "fulfilled") setTransactions(Array.isArray(tx.value) ? tx.value : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const totalIncome  = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const recentTx     = transactions.slice(0, 8);

  return (
    <>
      <AnimatePresence>
        {modal && (
          <BalanceModal
            mode={modal}
            token={token}
            onClose={() => setModal(null)}
            onSuccess={fetchData}
          />
        )}
      </AnimatePresence>

      <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 xl:px-10"
        style={{ fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)" }}>
        <div className="max-w-[1400px] mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-7">
            <h1 className="text-slate-800 text-[24px] font-black tracking-tight">Wallet</h1>
            <p className="text-slate-400 text-[12px] font-mono mt-0.5">Kelola saldo dan riwayat kamu</p>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
            {/* ── Kolom kiri ── */}
            <div className="flex flex-col gap-4">
              {/* Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                className="relative rounded-3xl p-7 overflow-hidden"
                style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)" }}
              >
                <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-6 w-36 h-36 rounded-full bg-white/5" />
                <div className="absolute inset-0 pointer-events-none opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center">
                        <FiCreditCard className="text-white" size={15} />
                      </div>
                      <span className="text-white/80 text-[13px] font-bold">Monee Wallet</span>
                    </div>
                    <span className="text-white/60 text-[14px] font-black italic tracking-widest">VISA</span>
                  </div>

                  <div className="mb-8">
                    <p className="text-blue-200 text-[10px] font-mono uppercase tracking-widest mb-1.5">Saldo Tersedia</p>
                    <div className="flex items-center gap-3">
                      {loading
                        ? <div className="w-44 h-9 bg-white/20 rounded-xl animate-pulse" />
                        : <p className="text-white text-[32px] font-black tracking-tight leading-none">
                            {showBalance ? fmtIDR(user?.balance ?? 0) : "Rp ••••••••"}
                          </p>}
                      <button onClick={() => setShowBalance(!showBalance)} className="text-blue-200 hover:text-white transition-colors mt-1">
                        {showBalance ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-white/10">
                    <p className="text-blue-200/60 text-[9px] font-mono uppercase tracking-widest">Nama Pemegang</p>
                    <p className="text-white/80 text-[13px] font-bold tracking-widest uppercase mt-1">{user?.name ?? "──────────"}</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button onClick={() => setModal("topup")} whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-500 text-black font-black text-[14px] shadow-lg shadow-green-200 hover:bg-green-600 transition-colors">
                  <FiArrowUpRight strokeWidth={3} size={16} /> Top Up
                </motion.button>
                <motion.button onClick={() => setModal("withdraw")} whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-[14px] hover:border-slate-300 hover:bg-slate-50 transition-colors">
                  <FiArrowDownLeft strokeWidth={3} size={16} /> Tarik
                </motion.button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-green-50 border border-green-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiArrowUpRight size={12} className="text-green-600" />
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Total Masuk</p>
                  </div>
                  <p className="text-green-400 text-[17px] font-black">{fmtIDR(totalIncome)}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiArrowDownLeft size={12} className="text-slate-500" />
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Total Keluar</p>
                  </div>
                  <p className="text-slate-700 text-[17px] font-black">{fmtIDR(totalExpense)}</p>
                </motion.div>
              </div>
            </div>

            {/* ── Kolom kanan: recent transactions ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
                <div>
                  <p className="text-slate-800 font-black text-[15px]">Transaksi Terakhir</p>
                  <p className="text-slate-400 text-[11px] font-mono mt-0.5">{transactions.length} total transaksi</p>
                </div>
                <a href="/transaction" className="text-blue-500 text-[11px] font-bold hover:underline">Lihat Semua →</a>
              </div>

              {loading ? (
                <div className="p-6 space-y-4 flex-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="w-40 h-3 bg-slate-100 rounded animate-pulse" />
                        <div className="w-24 h-2 bg-slate-100 rounded animate-pulse" />
                      </div>
                      <div className="w-24 h-3 bg-slate-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : recentTx.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-4xl mb-3">💳</p>
                  <p className="text-slate-600 font-black text-[14px]">Belum ada transaksi</p>
                  <p className="text-slate-400 text-[11px] font-mono mt-1">Top up dulu yuk!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 flex-1">
                  {recentTx.map((t, i) => {
                    const isIncome = t.type === "INCOME";
                    const cat = (t.category?.name ?? "other").toLowerCase();
                    return (
                      <motion.div key={t.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[17px] shrink-0 ${isIncome ? "bg-blue-100" : "bg-slate-100"}`}>
                          {CATEGORY_ICON[cat] ?? (isIncome ? "💰" : "💸")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 text-[13px] font-bold truncate group-hover:text-blue-600 transition-colors">
                            {t.description || t.category?.name}
                          </p>
                          <p className="text-slate-400 text-[10px] font-mono">
                            {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}{t.category?.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-[14px] font-black font-mono ${isIncome ? "text-blue-600" : "text-slate-600"}`}>
                            {isIncome ? "+" : "−"}{fmtIDR(t.amount)}
                          </p>
                          <span className={`text-[9px] font-black uppercase tracking-wider ${isIncome ? "text-blue-400" : "text-slate-400"}`}>
                            {isIncome ? "Masuk" : "Keluar"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}