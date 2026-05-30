"use client";

// ─────────────────────────────────────────────────────────────────
// Monee — Sign In Page
// Path: app/(auth)/sign-in/page.tsx
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiUser,
  FiLock,
  FiArrowLeft,
  FiTrendingUp,
} from "react-icons/fi";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah. Silakan coba lagi.");
        return;
      }

      if (result?.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        const role = session?.user?.role;

        if (role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push(callbackUrl);
        }
      }
    } catch {
      setError("Terjadi kesalahan koneksi. Pastikan server aktif.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full h-[54px] rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-[14px] font-semibold text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <main className="min-h-screen bg-[#F8FAFC] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      {/* LEFT */}
      <div className="hidden lg:flex relative bg-blue-600 overflow-hidden p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[380px] h-[380px] rounded-full bg-cyan-300/10 blur-3xl" />

        {/* LOGO */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
            <span className="text-white font-black text-sm">M</span>
          </div>

          <span className="text-white text-[22px] font-black tracking-tight">
            Mon<span className="text-blue-200">ee</span>
          </span>
        </div>

        {/* CONTENT */}
        <div className="relative z-10 max-w-[480px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 mb-7">
            <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[11px] tracking-widest uppercase font-bold text-white/90">
              Real-Time Finance Platform
            </span>
          </div>

          <h1 className="text-white text-[52px] font-black leading-[1.02] tracking-tight">
            Monitor your
            <br />
            financial world
            <br />
            <span className="text-blue-200">in one place.</span>
          </h1>

          <p className="mt-6 text-blue-100 text-[16px] leading-relaxed max-w-[380px] font-medium">
            Track crypto, stocks, gold, and your spending with a modern
            institutional-grade dashboard.
          </p>
        </div>

        {/* STATS */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "2.4M+", label: "Users" },
            { value: "150+", label: "Assets" },
            { value: "99.9%", label: "Uptime" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
            >
              <p className="text-white text-[20px] font-black">
                {item.value}
              </p>

              <p className="mt-1 text-[11px] uppercase tracking-wider font-bold text-blue-100">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative flex items-center justify-center px-6 py-12 lg:px-16">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-[430px]"
        >
          {/* BACK */}
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-blue-600 transition-colors mb-10"
          >
            <FiArrowLeft size={16} />
            Kembali ke Beranda
          </a>

          {/* MOBILE LOGO */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>

            <span className="text-slate-900 font-black text-xl tracking-tight">
              Mon<span className="text-blue-600">ee</span>
            </span>
          </div>

          {/* HEADER */}
          <div className="mb-8">
            <h2 className="text-[34px] leading-[1.1] tracking-tight font-black text-slate-900">
              Welcome back to
              <br />
              <span className="text-blue-600">Monee</span>
            </h2>

            <p className="mt-3 text-[14px] font-medium text-slate-400">
              Belum punya akun?{" "}
              <a
                href="/sign-up"
                className="text-blue-600 font-bold hover:underline"
              >
                Daftar sekarang
              </a>
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600"
            >
              {error}
            </motion.div>
          )}

          {/* FORM */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-black text-slate-400">
                Email
              </label>

              <div className="relative">
                <FiUser
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />

                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-black text-slate-400">
                Password
              </label>

              <div className="relative">
                <FiLock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />

                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <a
                href="#"
                className="text-[12px] font-semibold text-slate-400 hover:text-blue-600"
              >
                Lupa password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[56px] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  Masuk Sekarang
                  <FiTrendingUp size={15} />
                </>
              )}
            </button>
          </motion.form>

          {/* FOOTER */}
          <div className="mt-8 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              {[
                { sym: "BTC", val: "$67.4K", up: true },
                { sym: "ETH", val: "$3.5K", up: true },
                { sym: "XAU", val: "$2318", up: true },
                { sym: "IHSG", val: "7284", up: false },
              ].map((item) => (
                <div key={item.sym} className="text-center">
                  <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">
                    {item.sym}
                  </p>

                  <p className="text-[12px] font-black text-slate-800 mt-1">
                    {item.val}
                  </p>

                  <p
                    className={`text-[10px] font-black mt-1 ${
                      item.up ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {item.up ? "▲" : "▼"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] font-medium text-slate-300 mt-8">
            © 2026 Monee. All rights reserved.
          </p>
        </motion.div>
      </div>
    </main>
  );
}