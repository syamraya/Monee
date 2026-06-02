"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { fetchWithToken } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    createChart,
    ColorType,
    CrosshairMode,
    CandlestickSeries,
    HistogramSeries,
    type IChartApi,
    type ISeriesApi,
    type CandlestickData,
    type Time,
} from "lightweight-charts";
import {
    FiTrendingUp,
    FiTrendingDown,
    FiRefreshCw,
    FiBarChart2,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_BASE_API_URL ?? "http://localhost:3001";

const STOCKS = [
    { id: "nvidia", symbol: "NVDA", label: "NVIDIA", name: "NVIDIA Corporation", src: "https://cdn.simpleicons.org/nvidia/76B900" },
    { id: "google", symbol: "GOOGL", label: "Google", name: "Alphabet Inc.", src: "https://cdn.simpleicons.org/google/4285F4" },
    { id: "apple", symbol: "AAPL", label: "Apple", name: "Apple Inc.", src: "https://cdn.simpleicons.org/apple/000000" },
    { id: "meta", symbol: "META", label: "Meta", name: "Meta Platforms Inc.", src: "https://cdn.simpleicons.org/meta/0467DF" },
    { id: "tesla", symbol: "TSLA", label: "Tesla", name: "Tesla, Inc.", src: "https://cdn.simpleicons.org/tesla/CC0000" },
];

// FIX: interval di chart di-map ke range yang diterima backend stock-chart
const INTERVALS = [
    { label: "1D", value: "1D" },
    { label: "1W", value: "1W" },
    { label: "1M", value: "1M" },
] as const;

type StockId = (typeof STOCKS)[number]["id"];
type Interval = (typeof INTERVALS)[number]["value"];

// ── HELPERS ───────────────────────────────────────────────────────
const fmtUSD = (n: number, digits = 2) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(n ?? 0);

const fmtIDR = (n: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

// ── TYPES ─────────────────────────────────────────────────────────
interface StockPrice {
    symbol: string;
    price_usd: number;
    price_idr: number;
    change_24h: number;
    last_updated: string;
}

interface Analytics {
    price: number;
    high: number;
    low: number;
    volume: number;
    volatility: number;
    trendScore: number;
    sentiment: "Bullish" | "Bearish" | "Neutral";
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}

function StatBox({
    label, value, sub, loading,
}: {
    label: string; value: string; sub?: string; loading: boolean;
}) {
    return (
        <div className="bg-white/4
    border border-white/10
    backdrop-blur-lg rounded-3xl p-5 shadow-sm
    hover:border-emerald-500/30
hover:bg-white/6
transition-all
duration-300">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                {label}
            </p>
            {loading ? (
                <Skeleton className="w-28 h-5" />
            ) : (
                <p className="text-white text-[18px] font-black tracking-tight">{value}</p>
            )}
            {sub && !loading && (
                <p className="text-slate-400 text-[10px] font-mono mt-1">{sub}</p>
            )}
        </div>
    );
}

// ── CANDLESTICK CHART ─────────────────────────────────────────────
// FIX: pakai /market/stock-chart/:symbol?range= bukan /market/klines
// karena klines hanya support crypto (CoinGecko), bukan saham US
function CandlestickChart({ symbol, interval }: { symbol: string; interval: Interval }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [hoveredCandle, setHoveredCandle] = useState<CandlestickData<Time> | null>(null);

    const { data: session } = useSession();
    const token = (session?.user as any)?.accessToken ?? "";

    const fetchCandles = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            // FIX: pakai endpoint stock-chart, bukan klines
            // Response: [{time, open, high, low, close}] — bukan array Binance
            const raw: { time: number; open: number; high: number; low: number; close: number }[] = token
                ? await fetchWithToken(token, `/market/stock-chart/${symbol}?range=${interval}`)
                : await fetch(`${API}/market/stock-chart/${symbol}?range=${interval}`).then(r => r.json());

            // FIX: format data stock-chart sudah object, bukan array index
            const candles: CandlestickData<Time>[] = raw.map((c) => ({
                time: c.time as Time,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
            }));

            // Volume tidak tersedia dari Alpha Vantage stock-chart, set 0
            const volumes = raw.map((c) => ({
                time: c.time as Time,
                value: 0,
                color: c.close >= c.open ? "#3b82f620" : "#ef444420",
            }));

            seriesRef.current?.setData(candles);
            volumeRef.current?.setData(volumes);
            chartRef.current?.timeScale().fitContent();
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [symbol, interval, token]);

    // Init chart sekali saja
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            localization: {
                timeFormatter: (time: number) =>
                    new Date(time * 1000).toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        day: "2-digit", month: "short",
                        hour: "2-digit", minute: "2-digit",
                    }),
            },
            layout: {
                background: { type: ColorType.Solid, color: "#ffffff" },
                textColor: "#64748b",
                fontSize: 11,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
            },
            grid: {
                vertLines: { color: "#f1f5f9" },
                horzLines: { color: "#f1f5f9" },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { color: "#cbd5e1", labelBackgroundColor: "#3b82f6" },
                horzLine: { color: "#cbd5e1", labelBackgroundColor: "#3b82f6" },
            },
            rightPriceScale: { borderColor: "#e2e8f0" },
            timeScale: {
                borderColor: "#e2e8f0",
                timeVisible: true,
                secondsVisible: false,
                tickMarkFormatter: (time: number) =>
                    new Date(time * 1000).toLocaleTimeString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        hour: "2-digit", minute: "2-digit",
                    }),
            },
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "vol",
        });
        volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#3b82f6",
            downColor: "#ef4444",
            borderUpColor: "#3b82f6",
            borderDownColor: "#ef4444",
            wickUpColor: "#3b82f6",
            wickDownColor: "#ef4444",
        });
        candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.2 } });

        chart.subscribeCrosshairMove((param) => {
            if (param.seriesData.has(candleSeries)) {
                setHoveredCandle(param.seriesData.get(candleSeries) as CandlestickData<Time>);
            } else {
                setHoveredCandle(null);
            }
        });

        chartRef.current = chart;
        seriesRef.current = candleSeries;
        volumeRef.current = volumeSeries;

        const ro = new ResizeObserver(() => {
            if (!containerRef.current) return;
            chart.applyOptions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });
        });
        ro.observe(containerRef.current);

        return () => { ro.disconnect(); chart.remove(); };
    }, []);

    useEffect(() => { fetchCandles(); }, [fetchCandles]);
    useEffect(() => {
        const id = setInterval(fetchCandles, 60_000);
        return () => clearInterval(id);
    }, [fetchCandles]);

    return (
        <div className="relative w-full h-full">
            <AnimatePresence>
                {hoveredCandle && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-3 left-3 z-10 flex items-center gap-3 bg-white/95 border border-slate-200 rounded-2xl px-3 py-2 shadow-lg"
                    >
                        {(["O", "H", "L", "C"] as const).map((k, i) => {
                            const val = [
                                hoveredCandle.open, hoveredCandle.high,
                                hoveredCandle.low, hoveredCandle.close,
                            ][i];
                            const isUp = hoveredCandle.close >= hoveredCandle.open;
                            return (
                                <div key={k} className="flex items-center gap-1">
                                    <span className="text-slate-400 text-[10px] font-black">{k}</span>
                                    <span className={`text-[11px] font-black font-mono ${k === "C" ? isUp ? "text-blue-600" : "text-red-500" : "text-slate-700"
                                        }`}>
                                        {fmtUSD(val as number, (val as number) < 1 ? 6 : 2)}
                                    </span>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <p className="text-slate-400 text-[12px] font-mono">Failed loading chart</p>
                </div>
            )}

            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}

// ── PAGE ──────────────────────────────────────────────────────────
export default function StockPage() {
    const [activeCoin, setActiveCoin] = useState<StockId>("nvidia");
    const [activeInterval, setActiveInterval] = useState<Interval>("1M");
    const [price, setPrice] = useState<StockPrice | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loadPrice, setLoadPrice] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const { data: session } = useSession();
    const token = (session?.user as any)?.accessToken ?? "";

    const isWeekend = () => {
        const day = new Date().getDay();
        return day === 0 || day === 6;
    };

    const coin = STOCKS.find((c) => c.id === activeCoin)!;

    // Race-condition guard
    const fetchIdRef = useRef(0);

    const fetchPrice = useCallback(async (coinId: StockId, interval: Interval) => {
        const id = ++fetchIdRef.current;
        const targetCoin = STOCKS.find((c) => c.id === coinId)!;

        setLoadPrice(true);
        try {
            // FIX: pakai /market/stock/:symbol bukan /market/crypto
            // Response: { symbol, open, high, low, close, volume, change, changePct }
            const [p, a] = await Promise.allSettled([
                token
                    ? fetchWithToken(token, `/market/stock/${targetCoin.symbol}`)
                    : fetch(`${API}/market/stock/${targetCoin.symbol}`).then(r => r.json()),

                // FIX: analytics tetap pakai endpoint yg sama tapi symbol saham
                token
                    ? fetchWithToken(token, `/market/analytics?symbol=${targetCoin.symbol}&interval=${interval}&limit=50`)
                    : fetch(`${API}/market/analytics?symbol=${targetCoin.symbol}&interval=${interval}&limit=50`).then(r => r.json()),
            ]);

            if (id !== fetchIdRef.current) return;

            // FIX: mapping field response stock quote ke StockPrice interface
            // stock quote: { close, changePct, high, low, ... }
            // crypto:      { price_usd, change_24h, ... }
            if (p.status === "fulfilled" && p.value?.close != null) {
                setPrice({
                    symbol: p.value.symbol,
                    price_usd: p.value.close,
                    price_idr: p.value.close * 16000, // kurs approx, bisa fetch live kalau mau
                    change_24h: p.value.changePct,
                    last_updated: new Date().toISOString(),
                });
            } else {
                console.error("[fetchPrice] Stock quote failed:", p);
            }

            if (a.status === "fulfilled" && a.value?.price != null) {
                setAnalytics(a.value);
            } else {
                console.error("[fetchPrice] Analytics failed:", a);
            }
        } catch (err) {
            console.error("[fetchPrice] Error:", err);
        } finally {
            if (id === fetchIdRef.current) {
                setLoadPrice(false);
                setLastUpdate(new Date());
            }
        }
    }, [token]);

    // Fetch saat coin / interval berubah (debounce 300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setPrice(null);
            setAnalytics(null);
            fetchPrice(activeCoin, activeInterval);
        }, 300);
        return () => clearTimeout(timer);
    }, [activeCoin, activeInterval, fetchPrice]);

    // Auto-refresh 2 menit (selaras dengan cache backend)
    useEffect(() => {
        const id = setInterval(() => fetchPrice(activeCoin, activeInterval), 120_000);
        return () => clearInterval(id);
    }, [activeCoin, activeInterval, fetchPrice]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPrice(activeCoin, activeInterval);
        setRefreshing(false);
    };

    const isUp = (price?.change_24h ?? 0) >= 0;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0b1120] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">

            <div className="absolute top-0 left-1/4 h-125 w-125 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 h-150 w-150 rounded-full bg-cyan-500/10 blur-[150px]" />

            <div className="relative z-10"></div>
            <div className="max-w-350 mx-auto">

                {/* HEADER */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center justify-between mb-7"
                >
                    <div>
                        <h1 className="text-green-400 text-[26px] font-black tracking-tight">
                            Stock Market
                        </h1>
                        <p className="text-slate-400 text-[12px] font-mono mt-0.5">
                            Live market · auto-refresh 2m · {lastUpdate.toLocaleTimeString("id-ID")}
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-500 text-[12px] font-bold px-4 py-2.5 rounded-xl hover:border-blue-300 hover:text-blue-500 transition-all"
                    >
                        <motion.span
                            animate={{ rotate: refreshing ? 360 : 0 }}
                            transition={{ duration: 0.6, repeat: refreshing ? Infinity : 0, ease: "linear" }}
                        >
                            <FiRefreshCw size={13} />
                        </motion.span>
                        Refresh
                    </button>
                </motion.div>

                {/* STOCK SELECTOR */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex gap-2 flex-wrap mb-6"
                >
                    {STOCKS.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setActiveCoin(c.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${activeCoin === c.id
                                ? "bg-green-400 text-white"
                                : "bg-white text-slate-500"
                                }`}
                        >
                            <img src={c.src} alt={c.name} className="w-6 h-6" />
                            <span>{c.label}</span>
                        </button>
                    ))}
                </motion.div>

                {/* HERO */}
                <div className="absolute right-32 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.06]">
                    <img src={coin.src} alt={coin.label} className="w-72 h-72 object-contain" />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="
relative
overflow-hidden
rounded-4xl
border border-white/10
bg-white/3
backdrop-blur-xl
shadow-[0_0_50px_rgba(16,185,129,0.08)]
p-8
mb-6
"
                >
                    {/* Watermark */}
                    <div className="absolute right-40 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.3] blur-[2px]">
                        <img src={coin.src} alt={coin.label} className="w-80 h-80 object-contain" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="mt-4 flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full animate-pulse ${isWeekend() ? "bg-red-400" : "bg-emerald-400"}`} />
                            <span className={`text-xs font-semibold ${isWeekend() ? "text-red-400" : "text-emerald-400"}`}>
                                {isWeekend() ? "Market Closed" : "Market Active"}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-[26px]">
                                    {coin.src && <img src={coin.src} alt={coin.label} className="w-8 h-8" />}
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[11px] font-mono">{coin.symbol}</p>
                                    <p className="text-slate-700 text-[13px] font-black">{coin.name}</p>
                                </div>
                            </div>

                            {loadPrice ? (
                                <Skeleton className="w-48 h-10 mt-2" />
                            ) : (
                                <motion.p
                                    key={price?.price_usd}
                                    initial={{ opacity: 0.5, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-white text-[64px] font-black tracking-tight leading-none"
                                >
                                    {fmtUSD(price?.price_usd ?? 0)}
                                </motion.p>
                            )}

                            {!loadPrice && price && (
                                <div className="flex items-center gap-3 mt-3">
                                    <span className={`flex items-center gap-1 text-[13px] font-black px-3 py-1.5 rounded-full ${isUp ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-500"}`}>
                                        {isUp ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                                        {isUp ? "+" : ""}{price.change_24h.toFixed(2)}%
                                    </span>
                                    <span className="text-slate-400 text-[11px] font-mono">
                                        {fmtIDR(price.price_idr)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* CHART */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm mb-5"
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <FiBarChart2 size={13} className="text-slate-400" />
                            <p className="text-slate-700 text-[12px] font-black">{coin.symbol} · Candlestick</p>
                        </div>
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                            {INTERVALS.map((iv) => (
                                <button
                                    key={iv.value}
                                    onClick={() => setActiveInterval(iv.value)}
                                    className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all ${activeInterval === iv.value
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-400 hover:text-slate-700"
                                        }`}
                                >
                                    {iv.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-115 w-full">
                        <CandlestickChart symbol={coin.symbol} interval={activeInterval} />
                    </div>
                </motion.div>

                {/* STATS */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                    <StatBox
                        label="Harga"
                        value={price ? fmtUSD(price.price_usd) : "—"}
                        sub={price ? fmtIDR(price.price_idr) : undefined}
                        loading={loadPrice}
                    />
                    <StatBox
                        label="High"
                        value={analytics ? fmtUSD(analytics.high) : "—"}
                        loading={loadPrice}
                    />
                    <StatBox
                        label="Low"
                        value={analytics ? fmtUSD(analytics.low) : "—"}
                        loading={loadPrice}
                    />
                    <StatBox
                        label="24h Change"
                        value={price ? `${price.change_24h >= 0 ? "+" : ""}${price.change_24h.toFixed(2)}%` : "—"}
                        sub={price?.change_24h !== undefined
                            ? price.change_24h >= 0 ? "Bullish momentum" : "Bearish momentum"
                            : undefined}
                        loading={loadPrice}
                    />
                </motion.div>

            </div>
        </div>
    );
}