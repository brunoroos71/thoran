import { env, hasSupabase } from '@/lib/env';
import { functionsUrl } from '@/lib/supabase';

/**
 * Cotações reais para a landing.
 * Cripto: API pública da Binance direto do navegador (CORS liberado).
 * B3 e internacional: Yahoo Finance via proxy (dev: vite /yahoo; produção: Edge Function market-data).
 */
export interface Candle {
  t: number; // epoch ms
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface Quote {
  id: string;
  candles: Candle[];
  last: number;
  changePct: number; // vs. fechamento do dia anterior (ou 24h no cripto)
  updatedAt: number;
}

export interface Asset {
  id: string;
  label: string;
  name: string;
  source: 'binance' | 'yahoo';
  symbol: string;
  currency: 'BRL' | 'USD' | 'PTS';
  decimals: number;
}

export const ASSETS: Record<'b3' | 'crypto' | 'global', Asset[]> = {
  b3: [
    { id: 'IBOV', label: 'IBOV', name: 'Ibovespa', source: 'yahoo', symbol: '^BVSP', currency: 'PTS', decimals: 0 },
    { id: 'USDBRL', label: 'USD/BRL', name: 'Dólar à vista', source: 'yahoo', symbol: 'BRL=X', currency: 'BRL', decimals: 4 },
    { id: 'PETR4', label: 'PETR4', name: 'Petrobras PN', source: 'yahoo', symbol: 'PETR4.SA', currency: 'BRL', decimals: 2 },
    { id: 'VALE3', label: 'VALE3', name: 'Vale ON', source: 'yahoo', symbol: 'VALE3.SA', currency: 'BRL', decimals: 2 },
  ],
  crypto: [
    { id: 'BTC', label: 'BTC', name: 'Bitcoin', source: 'binance', symbol: 'BTCUSDT', currency: 'USD', decimals: 0 },
    { id: 'ETH', label: 'ETH', name: 'Ethereum', source: 'binance', symbol: 'ETHUSDT', currency: 'USD', decimals: 2 },
    { id: 'SOL', label: 'SOL', name: 'Solana', source: 'binance', symbol: 'SOLUSDT', currency: 'USD', decimals: 2 },
  ],
  global: [
    { id: 'SPX', label: 'S&P 500', name: 'S&P 500', source: 'yahoo', symbol: '^GSPC', currency: 'PTS', decimals: 0 },
    { id: 'NDX', label: 'Nasdaq', name: 'Nasdaq Composite', source: 'yahoo', symbol: '^IXIC', currency: 'PTS', decimals: 0 },
    { id: 'DXY', label: 'DXY', name: 'Índice dólar', source: 'yahoo', symbol: 'DX-Y.NYB', currency: 'PTS', decimals: 2 },
  ],
};

export const ALL_ASSETS = [...ASSETS.b3, ...ASSETS.crypto, ...ASSETS.global];

async function binance(a: Asset): Promise<Quote> {
  const base = 'https://api.binance.com/api/v3';
  const [k, t] = await Promise.all([
    fetch(`${base}/klines?symbol=${a.symbol}&interval=1h&limit=48`).then((r) => r.json()),
    fetch(`${base}/ticker/24hr?symbol=${a.symbol}`).then((r) => r.json()),
  ]);
  const candles: Candle[] = (k as string[][]).map((x) => ({ t: +x[0], o: +x[1], h: +x[2], l: +x[3], c: +x[4] }));
  return { id: a.id, candles, last: +t.lastPrice, changePct: +t.priceChangePercent, updatedAt: Date.now() };
}

function yahooUrl(symbol: string) {
  const q = `interval=1h&range=5d`;
  if (import.meta.env.DEV) return `/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?${q}`;
  if (hasSupabase) return `${functionsUrl('market-data')}?symbol=${encodeURIComponent(symbol)}&${q}`;
  return null;
}

async function yahoo(a: Asset): Promise<Quote> {
  const url = yahooUrl(a.symbol);
  if (!url) throw new Error('sem proxy de cotações');
  const headers: Record<string, string> = hasSupabase && !import.meta.env.DEV ? { apikey: env.supabaseAnonKey } : {};
  const j = await fetch(url, { headers }).then((r) => r.json());
  const r = j.chart.result[0];
  const q = r.indicators.quote[0];
  const off = (r.meta.gmtoffset ?? 0) * 1000;
  const candles: Candle[] = [];
  r.timestamp.forEach((ts: number, i: number) => {
    if ([q.open[i], q.high[i], q.low[i], q.close[i]].some((v) => v == null)) return;
    candles.push({ t: ts * 1000, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i] });
  });
  const last = r.meta.regularMarketPrice ?? candles[candles.length - 1].c;
  // fechamento do pregão anterior = último candle de um dia (no fuso da bolsa) diferente do atual
  const day = (t: number) => new Date(t + off).toISOString().slice(0, 10);
  const today = day(candles[candles.length - 1].t);
  const prev = [...candles].reverse().find((c) => day(c.t) !== today);
  const ref = prev?.c ?? candles[0].o;
  return { id: a.id, candles: candles.slice(-48), last, changePct: ((last - ref) / ref) * 100, updatedAt: (r.meta.regularMarketTime ?? Date.now() / 1000) * 1000 };
}

export async function fetchQuote(a: Asset): Promise<Quote> {
  return a.source === 'binance' ? binance(a) : yahoo(a);
}

export function fmtPrice(v: number, a: Asset, locale = 'pt-BR') {
  const n = v.toLocaleString(locale, { minimumFractionDigits: a.decimals, maximumFractionDigits: a.decimals });
  return a.currency === 'BRL' ? `R$ ${n}` : a.currency === 'USD' ? `US$ ${n}` : n;
}
