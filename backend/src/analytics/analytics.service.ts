import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AnalyticsService {
  private cache: any = null;
  private lastUpdate = 0;

  async getAnalytics() {
    const now = Date.now();

    // cache 60 detik (hindari rate limit Alpha Vantage)
    if (this.cache && now - this.lastUpdate < 60000) {
      return this.cache;
    }

    const apiKey = process.env.ALPHA_API_KEY;

    // contoh: BTC/USD real data
    const res = await axios.get(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=${apiKey}`
    );

    const raw =
      res.data?.['Realtime Currency Exchange Rate'];

    const price = Number(raw?.['5. Exchange Rate']);

    // fallback safety
    if (!price) {
      return {
        sentiment: 'Neutral',
        trendScore: 50,
        volatility: 50,
        updatedAt: now,
      };
    }

    // =========================
    // 🧠 ANALYTICS ENGINE (SMALL VERSION)
    // =========================

    // trend baseline (simple momentum proxy)
    const baseline = 60000; // kamu bisa ganti dynamic nanti

    let sentiment = 'Neutral';

    if (price > baseline * 1.01) sentiment = 'Bullish';
    else if (price < baseline * 0.99) sentiment = 'Bearish';

    // trend score (distance from baseline)
    const trendScore = Math.min(
      100,
      Math.max(0, Math.abs((price - baseline) / baseline) * 5000)
    );

    // volatility proxy (simple deviation)
    const volatility = Math.min(
      100,
      Math.max(0, Math.abs((price % 100) * 2))
    );

    const data = {
      sentiment,
      trendScore: Math.round(trendScore),
      volatility: Math.round(volatility),
      price,
      updatedAt: now,
    };

    this.cache = data;
    this.lastUpdate = now;

    return data;
  }
}