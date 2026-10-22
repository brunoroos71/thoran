// GET /market-data?symbol=^BVSP&interval=1h&range=5d — proxy público e com cache para o Yahoo Finance.
// Só símbolos da lista permitida, para a função não virar proxy aberto.
import { cors } from '../_shared/http.ts';

const ALLOWED = new Set(['^BVSP', 'BRL=X', 'PETR4.SA', 'VALE3.SA', '^GSPC', '^IXIC', 'DX-Y.NYB']);
const INTERVALS = new Set(['1h', '1d']);
const RANGES = new Set(['1d', '5d', '1mo']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const u = new URL(req.url);
  const symbol = u.searchParams.get('symbol') ?? '';
  const interval = u.searchParams.get('interval') ?? '1h';
  const range = u.searchParams.get('range') ?? '5d';
  if (!ALLOWED.has(symbol) || !INTERVALS.has(interval) || !RANGES.has(range)) return new Response('bad request', { status: 400, headers: cors });

  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, s-maxage=60' },
  });
});
