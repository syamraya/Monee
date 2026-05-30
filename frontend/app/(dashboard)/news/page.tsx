"use client";

// ─────────────────────────────────────────────────────────────────
//  News & Market page — fetches news dari backend (/market/news)
//  bukan langsung ke GNews dari browser.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { fetchWithToken } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiExternalLink,
  FiClock,
  FiZap,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3001";

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h lalu`;
  return `${Math.floor(h / 24)}d lalu`;
};

// ── Types ─────────────────────────────────────────────────────────
interface GoldData {
  price: number;
  high: number;
  low: number;
  lastRefreshed: string;
}
interface CryptoData {
  symbol: string;
  price_usd: number;
  price_idr: number;
  change_24h: number;
  last_updated: string;
}
interface Analytics {
  symbol: string;
  price: number;
  high: number;
  low: number;
  volume: number;
  volatility: number;
  trendScore: number;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  time: string;
}
interface NewsItem {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: { name: string };
  image?: string;
}

// Mock news fallback kalau backend gagal
const MOCK_NEWS: NewsItem[] = [
  {
    title: "Bitcoin Breaks Key Resistance Level Amid Institutional Buying",
    description:
      "Bitcoin surged past a critical resistance level as institutional investors continue to accumulate BTC at current prices, signaling renewed confidence in the crypto market.",
    url: "#",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "CryptoNews" },
  },
  {
    title: "Gold Prices Steady as Fed Signals Cautious Rate Approach",
    description:
      "Gold held near its recent highs as Federal Reserve officials struck a cautious tone on future rate decisions, supporting the precious metal's safe-haven appeal.",
    url: "#",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "MarketWatch" },
  },
  {
    title: "Ethereum ETF Sees Record Inflows This Week",
    description:
      "Spot Ethereum ETFs recorded their highest weekly inflows since launch, driven by growing institutional demand and positive regulatory clarity.",
    url: "#",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: "Bloomberg" },
  },
  {
    title: "Indonesia's Crypto Market Grows 40% Year-on-Year",
    description:
      "Indonesia's cryptocurrency market has seen a 40% growth year-on-year, with millions of new retail investors entering the market through local exchanges.",
    url: "#",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: "Bisnis.com" },
  },
  {
    title: "Analysts Predict Gold to Reach $3,000 by Year End",
    description:
      "Multiple top financial institutions have revised their gold price targets upward, citing geopolitical uncertainty and continued central bank buying as primary drivers.",
    url: "#",
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    source: { name: "Reuters" },
  },
  {
    title: "Solana Surges 15% After Major Protocol Upgrade",
    description:
      "Solana's native token SOL rallied strongly following a successful network upgrade that significantly improved transaction throughput and reduced fees.",
    url: "#",
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    source: { name: "CoinDesk" },
  },
];

// ── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />
  );
}

// ── Ticker pill ───────────────────────────────────────────────────
function TickerPill({
  label,
  value,
  change,
  loading,
}: {
  label: string;
  value: string;
  change?: number;
  loading: boolean;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
      <div>
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
          {label}
        </p>
        {loading ? (
          <Skeleton className="w-24 h-4 mt-1" />
        ) : (
          <p className="text-slate-800 text-[14px] font-black mt-0.5">
            {value}
          </p>
        )}
      </div>
      {change !== undefined && !loading && (
        <div
          className={`flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full ml-auto ${
            up ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
          }`}
        >
          {up ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
          {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  );
}

// ── Sentiment badge ───────────────────────────────────────────────
function SentimentBadge({ sentiment }: { sentiment: string }) {
  const map: Record<string, string> = {
    Bullish: "bg-blue-50 text-blue-700 border-blue-100",
    Bearish: "bg-slate-100 text-slate-600 border-slate-200",
    Neutral: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <span
      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${map[sentiment] ?? map.Neutral}`}
    >
      {sentiment === "Bullish" ? "🟢" : sentiment === "Bearish" ? "🔴" : "🟡"}{" "}
      {sentiment}
    </span>
  );
}

// ── News Card ─────────────────────────────────────────────────────
function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const isMock = item.url === "#";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full shrink-0">
          {item.source.name}
        </span>
        <div className="flex items-center gap-1 text-slate-300 text-[10px] font-mono shrink-0">
          <FiClock size={9} />
          {timeAgo(item.publishedAt)}
        </div>
      </div>

      <p className="text-slate-800 font-black text-[13px] leading-snug mb-2 group-hover:text-blue-700 transition-colors">
        {item.title}
      </p>
      <p className="text-slate-400 text-[11px] font-mono leading-relaxed line-clamp-2">
        {item.description}
      </p>

      {!isMock && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-blue-500 text-[11px] font-black hover:text-blue-700 transition-colors"
        >
          Baca selengkapnya <FiExternalLink size={11} />
        </a>
      )}
    </motion.div>
  );
}

// ── FiBarChart alias ──────────────────────────────────────────────
function FiBarChart({ size }: { size: number }) {
  return <FiActivity size={size} />;
}

// ── Main Page ─────────────────────────────────────────────────────
export default function NewsPage() {
  const [gold, setGold] = useState<GoldData | null>(null);
  const [crypto, setCrypto] = useState<CryptoData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadMarket, setLoadMarket] = useState(true);
  const [loadNews, setLoadNews] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [coinFilter, setCoinFilter] = useState<
    "bitcoin" | "ethereum" | "solana"
  >("bitcoin");
  const [symFilter, setSymFilter] = useState<
    "BTCUSDT" | "ETHUSDT" | "SOLUSDT"
  >("BTCUSDT");

  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken ?? "";

  // ── Fetch market data ─────────────────────────────────────────
  const fetchMarket = useCallback(async () => {
    setLoadMarket(true);
    try {
      const [g, c, a] = await Promise.allSettled([
        token
          ? fetchWithToken(token, "/market/gold-price")
          : fetch(`${API}/market/gold-price`).then((r) => r.json()),
        token
          ? fetchWithToken(token, `/market/crypto?coin=${coinFilter}`)
          : fetch(`${API}/market/crypto?coin=${coinFilter}`).then((r) =>
              r.json(),
            ),
        token
          ? fetchWithToken(
              token,
              `/market/analytics?symbol=${symFilter}&interval=5m&limit=20`,
            )
          : fetch(
              `${API}/market/analytics?symbol=${symFilter}&interval=5m&limit=20`,
            ).then((r) => r.json()),
      ]);
      if (g.status === "fulfilled" && g.value?.price) setGold(g.value);
      if (c.status === "fulfilled" && c.value?.price_usd) setCrypto(c.value);
      if (a.status === "fulfilled" && a.value?.price) setAnalytics(a.value);
    } finally {
      setLoadMarket(false);
      setLastUpdate(new Date());
    }
  }, [coinFilter, symFilter, token]);

  // ── Fetch news dari backend (/market/news) ────────────────────
  //  Backend sudah handle GNews + API key, FE tinggal consume.
  //  Response shape dari MarketService.getGoldNews():
  //    { title, description, content, url, image, publishedAt, source: string }
  const fetchNews = useCallback(async () => {
    setLoadNews(true);
    try {
      const data: any[] = token
        ? await fetchWithToken(token, "/market/news")
        : await fetch(`${API}/market/news`).then((r) => r.json());

      if (Array.isArray(data) && data.length > 0) {
        setNews(
          data.map((a) => ({
            title: a.title,
            description: a.description,
            url: a.url,
            publishedAt: a.publishedAt,
            // Backend returns source as plain string (article.source?.name)
            source: { name: a.source ?? "Unknown" },
            image: a.image,
          })),
        );
      } else {
        // Backend available tapi artikel kosong
        setNews(MOCK_NEWS);
      }
    } catch {
      // Backend down atau GNEWS_API_KEY belum di-set
      setNews(MOCK_NEWS);
    } finally {
      setLoadNews(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMarket(), fetchNews()]);
    setRefreshing(false);
  };

  // Auto-refresh market tiap 30 detik
  useEffect(() => {
    const id = setInterval(() => fetchMarket(), 30_000);
    return () => clearInterval(id);
  }, [fetchMarket]);

  const isMockNews = news.length > 0 && news[0].url === "#";

  return (
    <div
      className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"
      style={{
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
      }}
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
            <h1 className="text-slate-800 text-[24px] font-black tracking-tight">
              Market & News
            </h1>
            <p className="text-slate-400 text-[12px] font-mono mt-0.5">
              Update otomatis tiap 30 detik · terakhir{" "}
              {lastUpdate.toLocaleTimeString("id-ID")}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white border border-slate-100 text-slate-600 text-[12px] font-black px-4 py-2.5 rounded-xl shadow-sm hover:border-blue-200 hover:text-blue-600 transition-all disabled:opacity-50"
          >
            <motion.span
              animate={{ rotate: refreshing ? 360 : 0 }}
              transition={{
                duration: 0.6,
                repeat: refreshing ? Infinity : 0,
                ease: "linear",
              }}
            >
              <FiRefreshCw size={13} />
            </motion.span>
            Refresh
          </button>
        </motion.div>

        {/* ── Market Ticker Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <TickerPill
            label="Emas (XAU/USD)"
            value={gold ? fmtUSD(gold.price) : "—"}
            loading={loadMarket}
          />
          <TickerPill
            label="Emas High/Low"
            value={
              gold ? `${fmtUSD(gold.high)} / ${fmtUSD(gold.low)}` : "—"
            }
            loading={loadMarket}
          />
          <TickerPill
            label={`${crypto?.symbol ?? coinFilter.toUpperCase()} / USD`}
            value={crypto ? fmtUSD(crypto.price_usd) : "—"}
            change={crypto?.change_24h}
            loading={loadMarket}
          />
          <TickerPill
            label={`${crypto?.symbol ?? coinFilter.toUpperCase()} / IDR`}
            value={crypto ? fmtIDR(crypto.price_idr) : "—"}
            loading={loadMarket}
          />
        </div>

        {/* ── Coin Selector + Analytics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Analytics Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-slate-800 font-black text-[15px]">
                  Sinyal Teknikal
                </p>
                <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                  Binance · interval 5m · 20 candle
                </p>
              </div>
              {analytics && !loadMarket && (
                <SentimentBadge sentiment={analytics.sentiment} />
              )}
            </div>

            {/* Coin filter */}
            <div className="flex gap-2 flex-wrap mb-5">
              {(
                [
                  { coin: "bitcoin", sym: "BTCUSDT", label: "₿ BTC" },
                  { coin: "ethereum", sym: "ETHUSDT", label: "Ξ ETH" },
                  { coin: "solana", sym: "SOLUSDT", label: "◎ SOL" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.coin}
                  onClick={() => {
                    setCoinFilter(opt.coin);
                    setSymFilter(opt.sym);
                  }}
                  className={`px-4 py-2 rounded-xl text-[12px] font-black transition-all ${
                    coinFilter === opt.coin
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {loadMarket ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : analytics ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Harga",
                    value: fmtUSD(analytics.price),
                    icon: <FiActivity size={13} />,
                  },
                  {
                    label: "Volatilitas",
                    value: `${analytics.volatility}%`,
                    icon: <FiZap size={13} />,
                  },
                  {
                    label: "Trend Score",
                    value: `${analytics.trendScore > 0 ? "+" : ""}${analytics.trendScore}%`,
                    icon:
                      analytics.trendScore >= 0 ? (
                        <FiTrendingUp size={13} />
                      ) : (
                        <FiTrendingDown size={13} />
                      ),
                  },
                  {
                    label: "Volume",
                    value: Number(
                      analytics.volume.toFixed(2),
                    ).toLocaleString(),
                    icon: <FiBarChart size={13} />,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                      {item.icon}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-slate-800 font-black text-[15px]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-[12px] font-mono text-center py-8">
                Gagal mengambil data analytics
              </p>
            )}

            {analytics && !loadMarket && (
              <p className="text-slate-300 text-[10px] font-mono mt-4">
                High {fmtUSD(analytics.high)} · Low {fmtUSD(analytics.low)} ·
                diupdate {timeAgo(analytics.time)}
              </p>
            )}
          </motion.div>

          {/* Gold detail card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="bg-[#0f172a] rounded-3xl p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🥇</span>
                <div>
                  <p className="text-white font-black text-[14px]">
                    Harga Emas
                  </p>
                  <p className="text-white/30 text-[10px] font-mono">
                    XAU / USD · Live
                  </p>
                </div>
              </div>
              {loadMarket ? (
                <>
                  <Skeleton className="w-36 h-8 mb-2 bg-white/10" />
                  <Skeleton className="w-24 h-4 bg-white/10" />
                </>
              ) : gold ? (
                <>
                  <p className="text-white font-black text-[32px] leading-none">
                    {fmtUSD(gold.price)}
                  </p>
                  <p className="text-white/40 text-[11px] font-mono mt-1">
                    per troy ounce
                  </p>
                </>
              ) : (
                <p className="text-white/40 text-[12px] font-mono">
                  Data tidak tersedia
                </p>
              )}
            </div>

            {gold && !loadMarket && (
              <div className="mt-6 pt-4 border-t border-white/[0.08] grid grid-cols-2 gap-3">
                <div>
                  <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">
                    High
                  </p>
                  
                  <p className="text-white/80 text-[13px] font-black">
                    {fmtUSD(gold.high)}
                  </p>
                </div>
                <div>
                  <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">
                    Low
                  </p>
                  <p className="text-white/80 text-[13px] font-black">
                    {fmtUSD(gold.low)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-white/20 text-[9px] font-mono">
                    {new Date(gold.lastRefreshed).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── News Section ── */}
        <div className="mb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-4"
          >
            <div>
              <p className="text-slate-800 font-black text-[15px]">
                Berita Pasar
              </p>
              <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                {isMockNews && (
                  <span className="text-amber-500">⚠ Mode demo · </span>
                )}
                {news.length} artikel terkini
              </p>
            </div>
          </motion.div>

          {loadNews ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map((item, i) => (
                <NewsCard key={i} item={item} index={i} />
              ))}
            </div>
          )}

          {/* Banner hanya muncul kalau fallback ke mock */}
          {isMockNews && !loadNews && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl"
            >
              <p className="text-amber-700 text-[11px] font-black">
                💡 Untuk berita real, daftar gratis di{" "}
                <a
                  href="https://gnews.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  gnews.io
                </a>{" "}
                lalu set{" "}
                <code className="bg-amber-100 px-1 rounded">
                  GNEWS_API_KEY
                </code>{" "}
                di <code className="bg-amber-100 px-1 rounded">.env</code>{" "}
                server (bukan di frontend).
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}