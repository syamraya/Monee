"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  symbol: string;
  fetchPrice: () => Promise<any>;
};

export default function MarketCard({ symbol, fetchPrice }: Props) {
  const [price, setPrice] = useState<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  async function loadPrice() {
    try {
      const data = await fetchPrice();

      // Handle kedua response shape:
      // Gold  → { price: 2320.5, ... }
      // Crypto → { price_usd: 67420, ... }
      const newPrice: number = data.price ?? data.price_usd ?? 0;

      setPrevPrice((prev) => (prev === 0 ? newPrice : prev));
      setPrice(newPrice);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrice();
  }, []);

  const isUp = price >= prevPrice;

  const formatPrice = (val: number) => {
    if (val >= 1000) {
      return val.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
    return val.toFixed(2);
  };

  return (
    <motion.div
      animate={{
        scale: price !== prevPrice ? [1, 1.03, 1] : 1,
      }}
      transition={{ duration: 0.4 }}
      className="p-5 rounded-2xl bg-slate-50 border border-slate-100"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400 font-medium">{symbol}</p>

        {!loading && (
          <span
            className={`text-xs font-bold ${
              isUp ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {isUp ? "▲" : "▼"}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 h-8 w-24 rounded-lg bg-slate-200 animate-pulse"
          />
        ) : (
          <motion.p
            key={price}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={`mt-3 text-2xl font-black tracking-tight ${
              isUp ? "text-emerald-500" : "text-slate-900"
            }`}
          >
            ${formatPrice(price)}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}