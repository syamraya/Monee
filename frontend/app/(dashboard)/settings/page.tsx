"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCamera, FiUser, FiMail, FiLock,
  FiSave, FiCheckCircle, FiAlertCircle,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3001";

// ── Types ─────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  name: string;
  email: string;
  balance?: number;
  avatarUrl?: string | null;
  role?: string;
}

// ── Helpers ───────────────────────────────────────────────────────
function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-blue-50 ${className}`} />;
}

function Card({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
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

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-[13px] font-bold border ${
        type === "success"
          ? "bg-white border-blue-100 text-blue-700 shadow-blue-100/60"
          : "bg-white border-red-100 text-red-600 shadow-red-100/60"
      }`}
    >
      {type === "success"
        ? <FiCheckCircle size={15} className="text-blue-500" />
        : <FiAlertCircle size={15} className="text-red-400" />}
      {msg}
    </motion.div>
  );
}

// ── Avatar Section ────────────────────────────────────────────────
function AvatarSection({ profile, onUploaded, token }: {
  profile: UserProfile | null;
  onUploaded: (url: string) => void;
  token: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => { setPreview(profile?.avatarUrl ?? null); }, [profile?.avatarUrl]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { alert("Hanya file gambar yang diperbolehkan."); return; }
    if (file.size > 3 * 1024 * 1024) { alert("Ukuran file maksimal 3 MB."); return; }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/users/avatar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal upload avatar");
      onUploaded(data.data?.avatarUrl ?? preview ?? "");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
      setPreview(profile?.avatarUrl ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl overflow-hidden bg-blue-100 border-2 border-blue-100 shadow-md shadow-blue-100/40 flex items-center justify-center">
          {preview
            ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
            : profile
            ? <span className="text-blue-600 font-black text-[28px]">{getInitials(profile.name)}</span>
            : <Skeleton className="w-full h-full rounded-none" />}
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-3xl">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-200 transition-colors active:scale-95 disabled:opacity-50"
        >
          <FiCamera size={13} />
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      <div className="text-center">
        {profile ? (
          <>
            <p className="text-slate-800 font-black text-[15px] leading-tight">{profile.name}</p>
            <p className="text-slate-400 text-[11px] font-mono mt-0.5">{profile.email}</p>
          </>
        ) : (
          <>
            <Skeleton className="w-28 h-3.5 mb-1.5 mx-auto" />
            <Skeleton className="w-36 h-2.5 mx-auto" />
          </>
        )}
        <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
          {profile?.role ?? "USER"}
        </span>
      </div>
      <p className="text-slate-400 text-[10px] font-mono text-center">JPG, PNG, WebP · maks. 3 MB</p>
    </div>
  );
}

// ── Profile Form ──────────────────────────────────────────────────
function ProfileForm({ profile, onSaved, token }: {
  profile: UserProfile | null;
  onSaved: (updated: Partial<UserProfile>) => void;
  token: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) { setName(profile.name); setEmail(profile.email); }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/update-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal update profil");
      onSaved({ name, email });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300 font-semibold text-[14px]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
        <div className="relative group">
          <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" className={inputCls} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
        <div className="relative group">
          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@kamu.com" className={inputCls} required />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-2xl font-black text-[14px] text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70">
        {loading
          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : saved
          ? <><FiCheckCircle size={15} /> Saved!</>
          : <><FiSave size={15} /> Save Changes</>}
      </button>
    </form>
  );
}

// ── Password Form ─────────────────────────────────────────────────
function PasswordForm({ token }: { token: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { showToast("Password baru tidak cocok!", "error"); return; }
    if (next.length < 6) { showToast("Password minimal 6 karakter.", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/update-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
              oldPassword: current,
              password: next,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal ganti password");
      showToast("Password berhasil diganti!", "success");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300 font-semibold text-[14px]";

  return (
    <>
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: "Password Saat Ini", val: current, set: setCurrent, ph: "••••••••" },
          { label: "Password Baru",     val: next,    set: setNext,    ph: "Min. 6 karakter" },
          { label: "Konfirmasi Baru",   val: confirm, set: setConfirm, ph: "Ulangi password baru" },
        ].map(({ label, val, set, ph }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
            <div className="relative group">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input type="password" value={val} onChange={(e) => set(e.target.value)} placeholder={ph} className={inputCls} required />
            </div>
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-2xl font-black text-[14px] text-white bg-slate-800 hover:bg-slate-900 shadow-lg shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70">
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><FiLock size={14} /> Ganti Password</>}
        </button>
      </form>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken ?? "";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<"profile" | "password">("profile");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data?.id) setProfile(data); });
  }, [token]);

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-7"
      style={{ fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)" }}>
      <div className="max-w-[860px] mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-6">
          <h1 className="text-slate-800 text-[22px] font-black tracking-tight">Setting</h1>
          <p className="text-slate-400 text-[12px] font-mono mt-0.5">Manage your profile and account security</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Avatar */}
          <Card delay={0} className="p-6 col-span-1 lg:self-start">
            <AvatarSection
              profile={profile}
              onUploaded={(url) => setProfile((p) => p ? { ...p, avatarUrl: url } : p)}
              token={token}
            />
          </Card>

          {/* Tabs + Forms */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
              className="flex gap-2 p-1 bg-white border border-slate-100 rounded-2xl shadow-sm w-fit">
              {(["profile", "password"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-xl text-[13px] font-black transition-all ${
                    tab === t ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-400 hover:text-slate-600"
                  }`}>
                  {t === "profile" ? "Profile" : "Password"}
                </button>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              {tab === "profile" ? (
                <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <Card delay={0.08} className="p-6">
                    <p className="text-slate-800 font-black text-[15px] mb-1">Profile Information</p>
                    <p className="text-slate-400 text-[11px] font-mono mb-5">Update your name and email</p>
                    <ProfileForm profile={profile} onSaved={(updated) => setProfile((p) => p ? { ...p, ...updated } : p)} token={token} />
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="password" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <Card delay={0.08} className="p-6">
                    <p className="text-slate-800 font-black text-[15px] mb-1">Ganti Password</p>
                    <p className="text-slate-400 text-[11px] font-mono mb-5">Pastikan password baru kuat dan mudah diingat</p>
                    <PasswordForm token={token} />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Card delay={0.14} className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                  <FiCheckCircle size={16} />
                </div>
                <div>
                  <p className="text-slate-700 text-[13px] font-bold">Akun Terverifikasi</p>
                  <p className="text-slate-400 text-[11px] font-mono">ID: {profile?.id ?? "──────"}</p>
                </div>
                <span className="ml-auto text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  {profile?.role ?? "USER"}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}