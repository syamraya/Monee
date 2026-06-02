"use client";

// ─────────────────────────────────────────────────────────────────
// FinTrack — Sign In Page
// Path: app/(auth)/sign-in/page.tsx
// ─────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  FiArrowLeft,
  FiLock,
  FiTrendingUp,
  FiUser,
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
      console.log("SIGN IN RESULT:", result);


      if (result?.error) {
        setError("Email atau password salah. Silakan coba lagi.");
        return;
      }

      if (result?.ok) {
        window.location.href = "/dashboard";

      }
    } catch {
      setError("Terjadi kesalahan koneksi. Pastikan server aktif.");
    } finally {
      setIsLoading(false);
    }
    
  }

  const inputClass =
    "w-full h-[54px] rounded-2xl border border-slate-700 bg-slate-800 pl-12 pr-4 text-[14px] font-semibold text-white placeholder:text-slate-500 outline-none transition-all focus:border-green-400 focus:ring-4 focus:ring-green-400/20";

  return (
    <main className="min-h-screen bg-[#0d1117] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      {/* LEFT */}
      <div className="hidden lg:flex relative bg-green-400 overflow-hidden p-12 flex-col justify-between">
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
          <div className="w-10 h-10 rounded-2xl bg-black border border-black flex items-center justify-center shadow-lg shadow-black/30">
            <span className="text-white font-black text-sm">M</span>
          </div>

          <span className="text-black text-[22px] font-black tracking-tight">
            Monee
          </span>
        </div>

        {/* CONTENT */}
        <div className="relative z-10 max-w-125">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-black/10 px-4 py-2 mb-7 shadow-lg shadow-black/20">
            <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="text-[11px] tracking-widest uppercase font-bold text-black/90 animate-pulse  ">
              AI-Powered Finance Platform
            </span>
          </div>

          <h1 className="text-[52px] font-black leading-[1.02] tracking-tight text-black bg-clip-text">
            One Step Closer to 
            </h1>
          <h1 className="text-[52px] font-black leading-[1.02] tracking-tight bg-linear-to-r from-purple-500 via-purple-600 to-black bg-clip-text text-transparent italic">
            Finacial Freedom.
            </h1>
            

          <p className="mt-6 text-black text-[16px] leading-relaxed max-w-95 font-medium">
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
              className="rounded-2xl border border-black/15 bg-black/10 p-4 backdrop-blur-sm shadow-lg shadow-black/20 text-center"
            >
              <p className="text-black text-[20px] font-black">
                {item.value}
              </p>

              <p className="mt-1 text-[11px] uppercase tracking-wider font-bold text-black">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative flex items-center justify-center px-6 py-12 lg:px-16">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #22c55e 1px, transparent 1px)",
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
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-green-400 transition-colors mb-10"
          >
            <FiArrowLeft size={16} />
            Kembali ke Beranda
          </a>

          {/* MOBILE LOGO */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-2xl bg-green-400 flex items-center justify-center">
              <span className="text-white font-black text-sm">FT</span>
            </div>

            <span className="text-white font-black text-xl tracking-tight">
              Fin<span className="text-green-400">Track</span>
            </span>
          </div>

          {/* HEADER */}
          <div className="mb-8">
            <h2 className="text-[34px] leading-[1.1] tracking-tight font-black text-white">
              Welcome back to
              <br />
              <span className="text-green-400 italic">Monee</span>
            </h2>

            <p className="mt-3 text-[14px] font-medium text-slate-400">
              Belum punya akun?{" "}
              <a
                href="/sign-up"
                className="text-green-400 font-bold hover:underline"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
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
                className="text-[12px] font-semibold text-slate-400 hover:text-green-400"
              >
                Lupa password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[56px] rounded-2xl bg-green-400 hover:bg-green-500 text-black font-bold text-[14px] shadow-lg shadow-green-400/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              ) : (
                <>
                  Masuk Sekarang
                  <FiTrendingUp size={15} />
                </>
              )}
            </button>
          </motion.form>

          {/* FOOTER */}
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              {[
                { sym: "BTC", val: "$67.4K", up: true },
                { sym: "ETH", val: "$3.5K", up: true },
                { sym: "XAU", val: "$2318", up: true },
                { sym: "IHSG", val: "7284", up: false },
              ].map((item) => (
                <div key={item.sym} className="text-center">
                  <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">
                    {item.sym}
                  </p>

                  <p className="text-[12px] font-black text-white mt-1">
                    {item.val}
                  </p>

                  <p
                    className={`text-[10px] font-black mt-1 ${item.up ? "text-emerald-500" : "text-red-500"
                      }`}
                  >
                    {item.up ? "▲" : "▼"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] font-medium text-slate-500 mt-8">
            © 2026 FinTrack. All rights reserved.
          </p>
        </motion.div>
      </div>
    </main>
  );
}