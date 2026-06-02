"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiX,
  FiEdit2,
  FiCheck,
} from "react-icons/fi";

// ── Config ────────────────────────────────────────────────────────
const API =
  process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3000";

// ── Types ─────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface ApiError {
  message: string;
  statusCode?: number;
}

type CategoryResponse = Category | ApiError;

// ── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-blue-50 ${className}`} />;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<"INCOME" | "EXPENSE">("INCOME");

  const [loadingCat, setLoadingCat] = useState(false);
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const token = (session?.user as any)?.accessToken ?? "";

  const authFetch = async (
    url: string,
    options?: RequestInit,
  ): Promise<any> => {
    const res = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    return res.json();
  };

  // ── Guard ADMIN ────────────────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as any)?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  // ── Fetch categories ───────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoadingCat(true);
      setError("");

      try {
        const data = await authFetch(
          `/categories?type=${activeTab}`,
        );

        if (Array.isArray(data)) {
          setCategories((prev) => {
            const otherType = prev.filter(
              (c) => c.type !== activeTab,
            );

            return [...otherType, ...data];
          });
        } else {
          setError(data?.message ?? "Gagal memuat kategori");
        }
      } catch {
        setError("Gagal memuat kategori dari server");
      } finally {
        setLoadingCat(false);
      }
    };

    load();
  }, [activeTab, token]);

  const filtered = categories.filter(
    (c) => c.type === activeTab,
  );

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);

    setTimeout(() => {
      setSuccessMsg("");
    }, 2500);
  };

  // ── Add category ───────────────────────────────────────────────
  const handleAdd = async () => {
    const name = newName.trim();

    if (!name) {
      setError("Nama kategori tidak boleh kosong");
      return;
    }

    const exists = categories.some(
      (c) =>
        c.name.toLowerCase() === name.toLowerCase() &&
        c.type === activeTab,
    );

    if (exists) {
      setError("Kategori sudah ada");
      return;
    }

    setAdding(true);
    setError("");

    try {
      const created: CategoryResponse = await authFetch(
        "/categories",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            type: activeTab,
          }),
        },
      );

      if ("id" in created) {
        setCategories((prev) => [...prev, created]);
        setNewName("");
        showSuccess("Kategori berhasil ditambahkan!");
      } else {
        setError(created.message);
      }
    } catch {
      setError("Gagal menambah kategori");
    } finally {
      setAdding(false);
    }
  };

  // ── Start edit ─────────────────────────────────────────────────
  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setError("");
  };

  // ── Update category ────────────────────────────────────────────
  const handleUpdate = async (id: string) => {
    const name = editName.trim();

    if (!name) {
      setError("Nama tidak boleh kosong");
      return;
    }

    setUpdating(true);
    setError("");

    try {
      const updated: CategoryResponse = await authFetch(
        `/categories/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name }),
        },
      );

      if ("id" in updated) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === id ? updated : c,
          ),
        );

        setEditingId(null);

        showSuccess("Kategori berhasil diperbarui!");
      } else {
        setError(updated.message);
      }
    } catch {
      setError("Gagal memperbarui kategori");
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete category ────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError("");

    try {
      const res: ApiError = await authFetch(
        `/categories/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.statusCode) {
        setCategories((prev) =>
          prev.filter((c) => c.id !== id),
        );

        showSuccess("Kategori berhasil dihapus!");
      } else {
        setError(res.message);
      }
    } catch {
      setError("Gagal menghapus kategori");
    } finally {
      setDeleting(null);
    }
  };

  // ── Loading session ────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />

          <p className="text-slate-400 text-[12px] font-mono">
            Memuat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 p-6 lg:p-10"
      style={{
        fontFamily:
          "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      <div className="max-w-[560px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-600 text-white">
            Admin Panel
          </span>

          <h1 className="text-slate-800 text-[26px] font-black tracking-tight mt-3">
            Manajemen{" "}
            <span className="text-blue-600">
              Kategori
            </span>
          </h1>

          <p className="text-slate-400 text-[13px] font-medium mt-1">
            Login sebagai{" "}
            <span className="text-blue-500 font-bold">
              {(session?.user as any)?.name ??
                "Admin"}
            </span>
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.38,
            delay: 0.06,
          }}
          className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6"
        >
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
            {(["INCOME", "EXPENSE"] as const).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => {
                    setActiveTab(t);
                    setError("");
                    setEditingId(null);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-black transition-all ${
                    activeTab === t
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t === "INCOME"
                    ? "💰 Pemasukan"
                    : "💸 Pengeluaran"}
                </button>
              ),
            )}
          </div>

          {/* Success */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[12px] font-bold flex items-center gap-2"
              >
                <FiCheck size={13} />
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-500 text-[12px] font-bold flex items-center gap-2"
              >
                <FiX size={13} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          <div className="space-y-2 mb-5 min-h-[80px] max-h-[340px] overflow-y-auto pr-1">
            {loadingCat && (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map(
                  (_, i) => (
                    <Skeleton
                      key={i}
                      className="h-11 w-full"
                    />
                  ),
                )}
              </div>
            )}

            <AnimatePresence>
              {!loadingCat &&
                filtered.map((cat) => (
                  <motion.div
                    key={cat.id}
                    initial={{
                      opacity: 0,
                      x: -8,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: 12,
                      height: 0,
                      marginBottom: 0,
                    }}
                    transition={{
                      duration: 0.18,
                    }}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-100 hover:bg-blue-50/40 transition-colors"
                  >
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) =>
                            setEditName(
                              e.target.value,
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter"
                            ) {
                              handleUpdate(
                                cat.id,
                              );
                            }

                            if (
                              e.key ===
                              "Escape"
                            ) {
                              setEditingId(
                                null,
                              );
                            }
                          }}
                          className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-[13px] text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-200"
                        />

                        <button
                          onClick={() =>
                            handleUpdate(cat.id)
                          }
                          disabled={updating}
                          className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          {updating ? (
                            <FiRefreshCw
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <FiCheck
                              size={13}
                              strokeWidth={3}
                            />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            setEditingId(null)
                          }
                          className="text-slate-300 hover:text-slate-500 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <FiX size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[14px]">
                            {activeTab ===
                            "INCOME"
                              ? "💰"
                              : "💸"}
                          </span>

                          <span className="text-slate-700 text-[13px] font-bold">
                            {cat.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              startEdit(cat)
                            }
                            className="text-slate-300 hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <FiEdit2
                              size={13}
                            />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                cat.id,
                              )
                            }
                            disabled={
                              deleting ===
                              cat.id
                            }
                            className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            {deleting ===
                            cat.id ? (
                              <FiRefreshCw
                                size={13}
                                className="animate-spin"
                              />
                            ) : (
                              <FiTrash2
                                size={13}
                              />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>

            {!loadingCat &&
              filtered.length === 0 && (
                <div className="text-center py-10 text-slate-300 text-[13px] font-medium">
                  Belum ada kategori{" "}
                  {activeTab === "INCOME"
                    ? "pemasukan"
                    : "pengeluaran"}
                </div>
              )}
          </div>

          {/* Add */}
          <div className="border-t border-slate-100 pt-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
              Tambah Kategori Baru
            </p>

            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => {
                  setNewName(
                    e.target.value,
                  );

                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdd();
                  }
                }}
                placeholder={`Nama kategori ${
                  activeTab === "INCOME"
                    ? "pemasukan"
                    : "pengeluaran"
                }...`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-300 font-medium outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleAdd}
                disabled={adding}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black text-[13px] hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-md shadow-blue-200 disabled:opacity-60"
              >
                {adding ? (
                  <FiRefreshCw
                    size={13}
                    className="animate-spin"
                  />
                ) : (
                  <>
                    <FiPlus
                      size={13}
                      strokeWidth={3}
                    />
                    Tambah
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-slate-300 text-[11px] font-medium mt-8">
          © 2026 Monee Admin Panel
        </p>
      </div>
    </div>
  );
}