"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import MarketCard from "@/components/landing/market-card";
import { getGoldPrice, getBTCPrice } from "@/services/market.service";

import { getAnalytics } from "@/services/analytics.service";

export default function LandingPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  const router = useRouter();

  // Dynamic Market
  const [marketValue, setMarketValue] = useState(137000000000);
  const [isPositive, setIsPositive] = useState(true);

  // Better Chart Data
  const [chartData, setChartData] = useState([
    220, 210, 205, 190, 180, 175, 170, 160, 150, 145,
  ]);

  // Generate SVG Path
  const chartPath = chartData
    .map((point, index) => {
      const x = index * 66;

      return `${index === 0 ? "M" : "L"} ${x} ${point}`;
    })
    .join(" ");

  const formattedMarketValue = new Intl.NumberFormat("en-US").format(
    marketValue,
  );

  // Clock
  useEffect(() => {
    const format = () =>
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );

    format();

    const interval = setInterval(format, 60000);

    return () => clearInterval(interval);
  }, []);

  // Dynamic Fake Market
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMove = Math.floor(Math.random() * 500000000);

      const up = Math.random() > 0.5;

      setIsPositive(up);

      setMarketValue((prev) => (up ? prev + randomMove : prev - randomMove));

      // Better realistic chart movement
      setChartData((prev) => {
        const last = prev[prev.length - 1];

        const move = Math.floor(Math.random() * 20);

        const next = up
          ? Math.max(40, last - move)
          : Math.min(260, last + move);

        return [...prev.slice(1), next];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true);

        const data = await getAnalytics();

        if (!mounted || !data) return;

        setAnalytics({
          sentiment: data.sentiment,
          trendScore: data.trendScore,
          volatility: data.volatility,
        });
      } catch (err) {
        console.error("Analytics error:", err);

        if (!mounted) return;

        setAnalytics({
          sentiment: "Neutral",
          trendScore: 50,
          volatility: 50,
        });
      } finally {
        if (mounted) setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();

    const interval = setInterval(fetchAnalytics, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Ambient Background */}
      <div className="absolute top-[-200px] left-[-120px] w-[500px] h-[500px] rounded-full bg-indigo-100 blur-3xl opacity-40" />

      <div className="absolute top-[100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-violet-100 blur-3xl opacity-40" />

      {/* Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)",
          backgroundSize: "12px 12px",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-20 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white text-sm font-black">M</span>
          </div>

          <span className="text-lg font-black tracking-tight">Monee</span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-slate-900 transition-colors">
            Features
          </a>

          <a href="#" className="hover:text-slate-900 transition-colors">
            Analytics
          </a>

          <a href="#" className="hover:text-slate-900 transition-colors">
            Markets
          </a>
        </div>

        {/* CTA */}
        <button
          suppressHydrationWarning
          onClick={() => router.push("/sign-in")}
          className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:scale-[1.02] transition-all"
        >
          Get Started
        </button>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

              <span className="text-sm font-medium text-slate-600">
                Modern Investment Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.07em] leading-[0.92] text-slate-900">
              Track wealth
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-500 bg-clip-text text-transparent">
                with clarity.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-8 text-lg leading-8 text-slate-500 max-w-xl font-medium">
              Monitor your portfolio, analyze market trends, and manage digital
              assets from one modern dashboard.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <button
                suppressHydrationWarning
                onClick={() => router.push("/sign-in")}
                className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-semibold shadow-[0_10px_40px_rgba(79,70,229,0.25)] hover:scale-[1.02] hover:bg-indigo-500 transition-all"
              >
                Get Started
              </button>

              <button
                suppressHydrationWarning
                onClick={() =>
                  window.open(
                    "https://drive.google.com/drive/folders/1rj8e6dBRLl3ew-pxcGhbyFfPB-JZqTWA?usp=drive_link",
                    "_blank",
                  )
                }
                className="text-slate-600 font-semibold hover:text-slate-900 transition-colors"
              >
                View Demo
              </button>
            </div>

            {/* Metrics */}
            <div className="mt-16 flex flex-wrap gap-10">
              {[
                ["2.4M+", "Users"],
                ["$18B+", "Volume"],
                ["99.9%", "Uptime"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-3xl font-black tracking-tight">{value}</p>

                  <p className="text-sm text-slate-400 font-medium mt-1">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            {/* Floating Blur */}
            <div className="absolute inset-0 bg-indigo-200 blur-3xl opacity-20 scale-90 rounded-full" />

            {/* Dashboard */}
            <div className="relative rounded-[32px] border border-slate-200 bg-white/80 backdrop-blur-xl p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              {/* Topbar */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-slate-400 font-medium">
                    Global Inflow
                  </p>

                  <h2
                    className={`text-4xl font-black tracking-tight mt-2 transition-colors duration-500 ${
                      isPositive ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    ${formattedMarketValue}
                  </h2>
                </div>

                <div
                  className={`px-4 py-2 rounded-2xl text-sm font-bold border transition-all duration-500 ${
                    isPositive
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-red-50 text-red-500 border-red-100"
                  }`}
                >
                  {isPositive ? "+2.4%" : "-1.8%"}
                </div>
              </div>

              {/* Chart */}
              <div className="relative h-64 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-slate-100 overflow-hidden">
                {/* Grid */}
                <div className="absolute inset-0 opacity-40">
                  <div className="h-full w-full bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>

                {/* Glow */}
                <div
                  className={`absolute inset-0 opacity-10 blur-3xl transition-all duration-1000 ${
                    isPositive ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />

                {/* SVG */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 600 300"
                  fill="none"
                >
                  <path
                    d={chartPath}
                    stroke="url(#paint0_linear)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-1000"
                  />

                  <defs>
                    <linearGradient
                      id="paint0_linear"
                      x1="0"
                      y1="0"
                      x2="600"
                      y2="0"
                    >
                      {isPositive ? (
                        <>
                          <stop stopColor="#10B981" />
                          <stop offset="1" stopColor="#34D399" />
                        </>
                      ) : (
                        <>
                          <stop stopColor="#EF4444" />
                          <stop offset="1" stopColor="#F87171" />
                        </>
                      )}
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Asset Cards */}
              <div className="mt-6 flex justify-center">
                <div className="grid grid-cols-2 gap-4 max-w-md w-full">
                  <MarketCard symbol="BTC" fetchPrice={getBTCPrice} />

                  <MarketCard symbol="GOLD" fetchPrice={getGoldPrice} />
                </div>
              </div>

              {/* Transactions */}
              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-slate-900">
                    Whales Activities
                  </h3>

                  <span className="text-sm text-slate-400 font-medium">
                    Today
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    ["BlackRock", "+300 BTC"],
                    ["U.S. Government", "+19.458 BTC"],
                    ["Unknown Wallet", "+6.99 CBBTC"],
                  ].map(([title, amount]) => (
                    <div
                      key={title}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-700">
                          {title}
                        </p>

                        {/* suppressHydrationWarning: currentTime is "" on server, time string on client */}
                        <p
                          suppressHydrationWarning
                          className="text-xs text-slate-400 mt-1"
                        >
                          {currentTime}
                        </p>
                      </div>

                      <span className="font-bold text-sm text-slate-900">
                        {amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECOND SECTION */}
      <section className="relative z-10 border-t border-slate-100 bg-slate-50/60 py-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* Trusted */}
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Trusted by modern investors (Bismillah)
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-12 opacity-60">
              {[
                "BlackRock",
                "Binance",
                "Coinbase",
                "TradingView",
                "Bloomberg",
              ].map((brand) => (
                <span
                  key={brand}
                  className="text-2xl font-black tracking-tight"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-32">
            <div className="max-w-2xl">
              <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm">
                Features
              </p>

              <h2 className="mt-4 text-5xl font-black tracking-tight leading-tight">
                Everything you need to track financial markets.
              </h2>

              <p className="mt-6 text-lg text-slate-500 leading-8">
                Built for traders, investors, and modern financial enthusiasts
                who need clarity, speed, and precision.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              {[
                {
                  title: "Real-Time Market",
                  desc: "Monitor crypto, gold, forex, and stocks with live market updates.",
                },
                {
                  title: "AI Analytics",
                  desc: "Get AI-powered insights and smart money tracking instantly.",
                },
                {
                  title: "Portfolio Tracking",
                  desc: "Track your investments and performance in one dashboard.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-indigo-600" />
                  </div>

                  <h3 className="mt-8 text-2xl font-black">{feature.title}</h3>

                  <p className="mt-4 text-slate-500 leading-7">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Section */}
          <div className="mt-32 grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm">
                Smart Analytics
              </p>

              <h2 className="mt-4 text-5xl font-black tracking-tight leading-tight">
                Institutional-grade insights for retail investors.
              </h2>

              <p className="mt-6 text-lg text-slate-500 leading-8">
                Analyze market momentum, whale activities, and portfolio
                performance with elegant visual dashboards.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  "Real-time whale tracking",
                  "Market sentiment indicators",
                  "Advanced portfolio analytics",
                  "Multi-asset monitoring",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>

                    <p className="font-medium text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fake Dashboard */}
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <div className="rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-slate-200 p-6">
                <p className="text-sm text-slate-500">
                  Advanced Analytics Preview
                </p>

                <h3 className="text-2xl font-black mt-2">
                  Market Sentiment:{" "}
                  {loadingAnalytics ? "Loading..." : analytics?.sentiment}
                </h3>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-100">
                    <p className="text-xs text-slate-400">Trend Score</p>
                    <p className="text-xl font-black">
                      {loadingAnalytics ? "..." : analytics?.trendScore}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-100">
                    <p className="text-xs text-slate-400">Volatility</p>
                    <p className="text-xl font-black">
                      {loadingAnalytics ? "..." : analytics?.volatility}
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-xs text-slate-400">
                  Powered by Alpha Vantage + AI sentiment layer
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-32 rounded-[40px] bg-slate-900 px-10 py-20 text-center overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-violet-500/20" />

            <div className="relative z-10">
              <p className="text-indigo-300 font-semibold uppercase tracking-widest text-sm">
                Start Today
              </p>

              <h2 className="mt-6 text-5xl font-black text-white leading-tight">
                Take control of your financial future.
              </h2>

              <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-8">
                Join thousands of modern investors using Monee to manage
                portfolios, monitor markets, and grow wealth.
              </p>

              <button
                suppressHydrationWarning
                className="mt-10 px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold hover:scale-[1.02] transition-all"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-slate-200 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <span className="text-white text-sm font-black">M</span>
                </div>

                <span className="text-lg font-black tracking-tight">
                  Monee
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-500 max-w-xs">
                Modern financial dashboard for tracking portfolio, analyzing
                markets, and monitoring digital assets in real-time.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-4">Product</h4>

              <div className="space-y-3 text-sm text-slate-500">
                <a
                  href="#"
                  className="block hover:text-slate-900 transition-colors"
                >
                  Analytics
                </a>

                <a
                  href=""
                  className="block hover:text-slate-900 transition-colors"
                >
                  Markets
                </a>

                <a
                  href="#"
                  className="block hover:text-slate-900 transition-colors"
                >
                  Portfolio
                </a>

                <a
                  href="#"
                  className="block hover:text-slate-900 transition-colors"
                >
                  Reports
                </a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-4">Company</h4>

              <div className="space-y-3 text-sm text-slate-500">
                <a
                  href="#"
                  className="block hover:text-slate-900 transition-colors"
                >
                  About
                </a>

                <a
                  href="#"
                  className="block hover:text-slate-900 transition-colors"
                >
                  Careers
                </a>

                <a
                  href="#"
                  className="block hover:text-slate-900 transition-colors"
                >
                  Privacy
                </a>

                <a
                  href="#"
                  className="block hover:text-slate-900 transition-colors"
                >
                  Terms
                </a>
              </div>
            </div>

            {/* CTA */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-4">
                Stay Updated
              </h4>

              <p className="text-sm text-slate-500 leading-6 mb-4">
                Get market insights and financial updates directly to your
                inbox.
              </p>

              <div className="flex items-center gap-2">
                <input
                  suppressHydrationWarning
                  type="email"
                  placeholder="Enter email"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  suppressHydrationWarning
                  className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:scale-[1.02] transition-all"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              © 2026 Monee. All rights reserved.
            </p>

            <div className="flex items-center gap-5 text-sm text-slate-400">
              <a href="#" className="hover:text-slate-900 transition-colors">
                Twitter
              </a>

              <a href="#" className="hover:text-slate-900 transition-colors">
                Instagram
              </a>

              <a href="#" className="hover:text-slate-900 transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
