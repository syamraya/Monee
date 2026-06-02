import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';



const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const cache = new Map<string, { data: any; expiredAt: number }>();

// Taruh setelah INTERVAL_TO_DAYS yang sudah ada
const INDEX_TICKERS = [
  { symbol: 'SPY', label: 'S&P 500' },
  { symbol: 'QQQ', label: 'NASDAQ 100' },
  { symbol: 'DIA', label: 'Dow Jones' },
];

function getCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiredAt) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key: string, data: any, ttlMs: number) {
  cache.set(key, { data, expiredAt: Date.now() + ttlMs });
}

const SUPPORTED_COINS = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple'];

const COIN_SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  binancecoin: 'BNB',
  ripple: 'XRP',
};

// Map frontend interval ke CoinGecko days param
const INTERVAL_TO_DAYS: Record<string, number> = {
  '1': 1, '3': 1, '5': 1, '15': 1, '30': 2,
  '60': 7, '120': 14, '240': 30, '720': 60, 'D': 365,
  // juga support format "15m", "1h", dll
  '1m': 1, '3m': 1, '5m': 1, '15m': 1, '30m': 2,
  '1h': 7, '2h': 14, '4h': 30, '1d': 365,
};

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly goldUrl = 'https://www.goldapi.io/api/XAU/USD';

  private async fetchAllCryptoPrices() {
    const cacheKey = 'crypto_all';
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        httpsAgent,
        params: {
          ids: SUPPORTED_COINS.join(','),
          vs_currencies: 'usd,idr',
          include_24hr_change: 'true',
          include_last_updated_at: 'true',
        },
      },
    );

    setCache(cacheKey, response.data, 120_000);
    return response.data;
  }

  async getCryptoPrice(coinId: string = 'bitcoin') {
    const id = coinId.toLowerCase();
    try {
      const allData = await this.fetchAllCryptoPrices();
      const data = allData[id];
      if (!data) throw new Error(`Koin tidak ditemukan: ${id}`);
      return {
        symbol: COIN_SYMBOL_MAP[id] ?? id.toUpperCase(),
        price_usd: data.usd,
        price_idr: data.idr,
        change_24h: data.usd_24h_change,
        last_updated: new Date(data.last_updated_at * 1000).toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Gagal ambil harga Crypto (${coinId}): ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil data crypto.');
    }
  }

  // ── Alpha Vantage: harga satu saham ──────────────────────────
async getStockQuote(symbol: string) {
  const cacheKey = `stock_quote_${symbol}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) throw new InternalServerErrorException('ALPHA_VANTAGE_KEY belum di-set');

  try {
    const { data } = await axios.get('https://www.alphavantage.co/query', {
      httpsAgent,
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: apiKey,
      },
    });

    const q = data['Global Quote'];
    if (!q || !q['05. price']) throw new Error(`Tidak ada data untuk ${symbol}`);

    const open  = parseFloat(q['02. open']);
    const close = parseFloat(q['05. price']);

    const result = {
      symbol,
      open,
      high:      parseFloat(q['03. high']),
      low:       parseFloat(q['04. low']),
      close,
      volume:    parseInt(q['06. volume']),
      change:    parseFloat(q['09. change']),
      changePct: parseFloat(q['10. change percent']),
    };

    setCache(cacheKey, result, 300_000);
    return result;
  } catch (error: any) {
    this.logger.error(`Alpha Vantage quote error (${symbol}): ${error.message}`);
    throw new InternalServerErrorException(`Gagal mengambil data saham ${symbol}`);
  }
}

// ── Alpha Vantage: indices (SPY, QQQ, DIA) ───────────────────
async getStockIndices() {
  const cacheKey = 'stock_indices';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const results = await Promise.all(
    INDEX_TICKERS.map(async ({ symbol, label }) => {
      const quote = await this.getStockQuote(symbol);
      return { ...quote, label };
    }),
  );

  setCache(cacheKey, results, 300_000);
  return results;
}

// ── Alpha Vantage: chart historis ────────────────────────────
async getStockChart(symbol: string, range: '1D' | '1W' | '1M' = '1M') {
  const cacheKey = `stock_chart_${symbol}_${range}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) throw new InternalServerErrorException('ALPHA_VANTAGE_KEY belum di-set');

  // 1D → intraday 5min, 1W/1M → daily
  const isIntraday = range === '1D';

  try {
    let candles: any[] = [];

    if (isIntraday) {
      const { data } = await axios.get('https://www.alphavantage.co/query', {
        httpsAgent,
        params: {
          function:    'TIME_SERIES_INTRADAY',
          symbol,
          interval:    '5min',
          outputsize:  'compact',
          apikey:      apiKey,
        },
      });

      const series = data['Time Series (5min)'];
      if (!series) throw new Error('Tidak ada data intraday');

      candles = Object.entries(series)
        .map(([time, v]: [string, any]) => ({
          time:  Math.floor(new Date(time).getTime() / 1000),
          open:  parseFloat(v['1. open']),
          high:  parseFloat(v['2. high']),
          low:   parseFloat(v['3. low']),
          close: parseFloat(v['4. close']),
        }))
        .sort((a, b) => a.time - b.time);

    } else {
      const { data } = await axios.get('https://www.alphavantage.co/query', {
        httpsAgent,
        params: {
          function:   'TIME_SERIES_DAILY',
          symbol,
          outputsize: range === '1M' ? 'compact' : 'compact',
          apikey:     apiKey,
        },
      });

      const series = data['Time Series (Daily)'];
      if (!series) throw new Error('Tidak ada data daily');

      const limitDays = range === '1W' ? 7 : 30;

      candles = Object.entries(series)
        .map(([time, v]: [string, any]) => ({
          time:  Math.floor(new Date(time).getTime() / 1000),
          open:  parseFloat(v['1. open']),
          high:  parseFloat(v['2. high']),
          low:   parseFloat(v['3. low']),
          close: parseFloat(v['4. close']),
        }))
        .sort((a, b) => a.time - b.time)
        .slice(-limitDays);
    }

    setCache(cacheKey, candles, 300_000);
    return candles;
  } catch (error: any) {
    this.logger.error(`Alpha Vantage chart error (${symbol}): ${error.message}`);
    throw new InternalServerErrorException(`Gagal mengambil chart ${symbol}`);
  }
}

async getGoldPrice() {
  const apiKey = process.env.GOLD_API_KEY;

  if (!apiKey) {
    return {
      from: 'XAU', to: 'USD',
      price: 3320.50, high: 3340.00, low: 3300.00,
      prev_close_price: 3315.00,
      lastRefreshed: new Date().toISOString(),
      isMock: true, marketStatus: 'closed', message: 'No API key',
    };
  }

  try {
    const response = await axios.get(this.goldUrl, {
      httpsAgent,
      headers: { 'x-access-token': apiKey, 'Content-Type': 'application/json' },
    });

    const data = response.data;

    // FIX: jangan throw kalau data.error, coba pakai prev_close_price dulu
    const isMarketClosed = !data.price || data.price === 0;
    const effectivePrice = isMarketClosed
      ? (data.prev_close_price ?? null)
      : data.price;

    return {
      from: 'XAU', to: 'USD',
      price: effectivePrice,
      high: data.high ?? null,
      low: data.low ?? null,
      prev_close_price: data.prev_close_price ?? null,
      lastRefreshed: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : null,
      isMock: false,
      marketStatus: isMarketClosed ? 'closed' : 'open',
      message: isMarketClosed ? 'Market emas sedang tutup.' : null,
    };
  } catch (error: any) {
    this.logger.error(`GoldAPI Crash: ${error.message}`);
    // FIX: jangan throw 500 — return mock supaya frontend tetap jalan
    return {
      from: 'XAU', to: 'USD',
      price: null, high: null, low: null,
      prev_close_price: null,
      lastRefreshed: null,
      isMock: true,
      marketStatus: 'closed',
      message: 'Data tidak tersedia saat ini.',
    };
  }
}

  async getGoldNews() {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) { this.logger.warn('GNEWS_API_KEY belum di-set'); return []; }
    try {
      const response = await axios.get('https://gnews.io/api/v4/search', {
        httpsAgent,
        params: { q: 'gold market OR crypto OR bitcoin OR finance', lang: 'en', max: 10, apikey: apiKey },
      });
      return (response.data.articles || []).map((a: any) => ({
        title: a.title, description: a.description, content: a.content,
        url: a.url, image: a.image, publishedAt: a.publishedAt,
        source: a.source?.name || 'Unknown Source',
      }));
    } catch (error: any) {
      this.logger.error(`GNews API Error: ${error.message}`);
      return [];
    }
  }

  // ── FIX: Ganti Binance → CoinGecko OHLC (tidak kena 451) ─────
  // CoinGecko /coins/{id}/ohlc return: [[timestamp, open, high, low, close], ...]
  // Dikonversi ke format Binance-like supaya frontend chart tidak perlu diubah
  async getKlines(
    symbol: string = 'BTCUSDT',
    interval: string = '5m',
    limit: number = 500,
  ) {
    const cacheKey = `klines_${symbol}_${interval}_${limit}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      // Map symbol BTCUSDT → bitcoin
      const coinId = this.symbolToCoinId(symbol);
      const days = INTERVAL_TO_DAYS[interval] ?? 1;

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc`,
        { httpsAgent, params: { vs_currency: 'usd', days } },
      );

      // CoinGecko OHLC: [[time, open, high, low, close]]
      // Convert ke Binance klines format: [time, open, high, low, close, volume, ...]
      const data = response.data.map((c: number[]) => [
        c[0],           // open time
        String(c[1]),   // open
        String(c[2]),   // high
        String(c[3]),   // low
        String(c[4]),   // close
        '0',            // volume (CoinGecko OHLC tidak include volume)
        c[0] + 60000,   // close time
        '0', '0', '0', '0', '0',
      ]);

      // Ambil limit candle terakhir
      const sliced = data.slice(-limit);
      setCache(cacheKey, sliced, 30_000);
      return sliced;
    } catch (error: any) {
      this.logger.error(`Klines Error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil data klines.');
    }
  }

  // ── FIX: Analytics juga pakai CoinGecko ──────────────────────
  async getAnalytics(
    symbol: string = 'BTCUSDT',
    interval: string = '5m',
    limit: number = 20,
  ) {
    try {
      const coinId = this.symbolToCoinId(symbol);
      const days = INTERVAL_TO_DAYS[interval] ?? 1;

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc`,
        { httpsAgent, params: { vs_currency: 'usd', days } },
      );

      const candles: number[][] = response.data;
      if (!candles || candles.length === 0) throw new Error('Tidak ada data OHLC');

      const slice = candles.slice(-limit);
      const latest = slice[slice.length - 1];
      const closes = slice.map(c => c[4]);

      const high = latest[2];
      const low = latest[3];
      const close = latest[4];
      const oldest = closes[0];

      const volatility = parseFloat((((high - low) / low) * 100).toFixed(2));
      const trendScore = parseFloat((((close - oldest) / oldest) * 100).toFixed(2));
      const sentiment = trendScore > 0 ? 'Bullish' : trendScore < 0 ? 'Bearish' : 'Neutral';

      return {
        symbol, price: close, high, low,
        volume: 0, // CoinGecko OHLC tidak include volume
        volatility, trendScore, sentiment,
        time: new Date(latest[0]).toISOString(),
        source: 'coingecko',
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error(`Analytics Error: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengambil data analytics.');
    }
  }

  // ── Helper: BTCUSDT → bitcoin, ETHUSDT → ethereum, dll ───────
  private symbolToCoinId(symbol: string): string {
    const map: Record<string, string> = {
      'BTCUSDT': 'bitcoin', 'ETHUSDT': 'ethereum',
      'SOLUSDT': 'solana',  'BNBUSDT': 'binancecoin',
      'XRPUSDT': 'ripple',
    };
    return map[symbol.toUpperCase()] ?? 'bitcoin';
  }
}