"use client";

// ─────────────────────────────────────────────────────────────────
// FinTrack — Sign Up Page
// Path: app/(auth)/sign-up/page.tsx
// ─────────────────────────────────────────────────────────────────

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiArrowLeft,
  FiLock,
  FiMail,
  FiUser,
} from "react-icons/fi";

export default function SignUpPage() {
  const router = useRouter();

  const [step, setStep] = useState<"register" | "verify">("register");

  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },  
          body: JSON.stringify(formData),
        }
      );
      

      const data = await res.json();
      console.log("REGISTER DATA:", data);

      if (!res.ok) {
        throw new Error(data.message || "Registrasi gagal");
      }

      alert(data.message || "OTP berhasil dikirim!");

      setStep("verify");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan";

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) {
      alert("OTP wajib diisi");
      return;
    }

    setOtpLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/auth/verify-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            otp,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verifikasi gagal");
      }

      alert("Akun berhasil diverifikasi!");

      router.push("/sign-in");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan";

      alert(message);
    } finally {
      setOtpLoading(false);
    }
  };

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

        <div className="absolute -top-32 -right-32 w-105 h-105 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-95 h-95 rounded-full bg-cyan-300/10 blur-3xl" />

        {/* LOGO */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-lg shadow-black/30">
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

          <h1 className="text-[52px] font-black leading-[1.02] tracking-tight bg-linear-to-r from-purple-600 via-purple-700 to-black bg-clip-text text-transparent">
            Start Building
            <h1 className="text-black">
            Your Financial
            </h1>
            
            <span className="bg-linear-to-r from-black via-purple-700 to-purple-600 bg-clip-text text-transparent">Future today.</span>
          </h1>

          <p className="mt-6 text-black/90 text-[16px] leading-relaxed max-w-97.5 font-medium italic">
          "Successful investing takes time, discipline, and patience. No matter how great the talent or effort, some things just take time."
          
          </p>
          <p className="mt-2 text-black/90 text-[14px] leading-relaxed max-w-97.5 font-medium italic">
          - Warren Buffett
          </p>
        </div>

        {/* STATS */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "150+", label: "Markets" },
            { value: "24/7", label: "Tracking" },
            { value: "Secure", label: "Protected" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-black/15 bg-black/10 p-4 backdrop-blur-sm shadow-lg shadow-black/20 flex flex-col items-center gap-1  "
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
          className="relative w-full max-w-107.5"
        >
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-green-400 transition-colors mb-10"
          >
            <FiArrowLeft size={16} />
            Kembali ke Beranda
          </a>

          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-2xl bg-green-400 flex items-center justify-center">
              <span className="text-white font-black text-sm">FT</span>
            </div>
            </div>

          <AnimatePresence mode="wait">
            {step === "register" ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
              >
                <div className="mb-8">
                  <h1 className="text-[34px] leading-[1.1] tracking-tight font-black text-white">
                    Create your
                    <br />
                    <span className="text-green-400 italic">Monee</span> account
                  </h1>

                  <p className="mt-3 text-[14px] font-medium text-slate-400">
                    Sudah punya akun?{" "}
                    <Link
                      href="/sign-in"
                      className="text-green-400 font-bold hover:underline"
                    >
                      Masuk sekarang
                    </Link>
                  </p>
                </div>

                <form
                  onSubmit={handleRegister}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-black text-slate-400">
                      Full Name
                    </label>

                    <div className="relative">
                      <FiUser
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-black text-slate-400">
                      Email
                    </label>

                    <div className="relative">
                      <FiMail
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="email"
                        required
                        placeholder="name@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email: e.target.value,
                          })
                        }
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
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl bg-green-400 hover:bg-green-500 text-black font-bold text-[14px] shadow-lg shadow-green-400/30 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    ) : (
                      "Continue"
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
              >
                <div className="mb-8">
                  <div className="w-16 h-16 rounded-3xl bg-green-400/20 flex items-center justify-center mb-6">
                    <span className="text-2xl">✉️</span>
                  </div>

                  <h1 className="text-[34px] leading-[1.1] tracking-tight font-black text-white">
                    Verify your
                    <br />
                    email address
                  </h1>

                  <p className="mt-4 text-[14px] leading-relaxed font-medium text-slate-400">
                    Kode verifikasi telah dikirim ke
                    <span className="font-bold text-white">
                      {" "}
                      {formData.email}
                    </span>
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-black text-slate-400">
                      Verification Code
                    </label>

                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full h-15 rounded-2xl border border-slate-700 bg-slate-800 text-center text-[28px] tracking-[12px] font-black text-white placeholder:text-slate-500 outline-none transition-all focus:border-green-400 focus:ring-4 focus:ring-green-400/20"
                    />
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={otpLoading}
                    className="w-full h-14 rounded-2xl bg-green-400 hover:bg-green-500 text-black font-bold text-[14px] shadow-lg shadow-green-400/30 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70"
                  >
                    {otpLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    ) : (
                      "Verify Account"
                    )}
                  </button>

                  <button
                    onClick={() => setStep("register")}
                    className="w-full text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}