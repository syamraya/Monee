"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationProps {
  /** Total jumlah item (setelah filter) */
  total: number;
  /** Halaman aktif (1-based) */
  page: number;
  /** Jumlah item per halaman */
  pageSize: number;
  /** Callback saat halaman berubah */
  onChange: (page: number) => void;
  /** Tampilkan info "Hal. X dari Y · Z item" (default: true) */
  showInfo?: boolean;
  /** Label satuan item, misal "transaksi", "data", dll (default: "item") */
  itemLabel?: string;
}

export default function Pagination({
  total,
  page,
  pageSize,
  onChange,
  showInfo = true,
  itemLabel = "item",
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  // Build page number array with ellipsis
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase =
    "w-8 h-8 rounded-xl flex items-center justify-center transition-all";
  const btnNav =
    `${btnBase} text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`;
  const btnPage = (active: boolean) =>
    `${btnBase} text-[12px] font-black ${
      active
        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
    }`;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
      {showInfo ? (
        <p className="text-slate-400 text-[11px] font-mono">
          Hal. {page} dari {totalPages} · {total} {itemLabel}
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={btnNav}
          aria-label="Halaman sebelumnya"
        >
          <FiChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="w-8 h-8 flex items-center justify-center text-slate-300 text-[12px]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={btnPage(page === p)}
              aria-label={`Halaman ${p}`}
              aria-current={page === p ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className={btnNav}
          aria-label="Halaman berikutnya"
        >
          <FiChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}