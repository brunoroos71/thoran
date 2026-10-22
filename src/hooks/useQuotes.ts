import { useEffect, useState } from 'react';
import { fetchQuote, type Asset, type Quote } from '@/services/marketService';

/** Busca cotações reais e atualiza a cada 60 s. Falhas ficam como null (a UI mostra "indisponível"). */
export function useQuotes(assets: Asset[], refreshMs = 60_000) {
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const key = assets.map((a) => a.id).join(',');
  useEffect(() => {
    let alive = true;
    const load = () =>
      Promise.all(
        assets.map((a) =>
          fetchQuote(a)
            .then((q) => [a.id, q] as const)
            .catch(() => [a.id, null] as const),
        ),
      ).then((rows) => alive && setQuotes((old) => ({ ...old, ...Object.fromEntries(rows.map(([id, q]) => [id, q ?? old[id] ?? null])) })));
    load();
    const iv = setInterval(() => document.visibilityState === 'visible' && load(), refreshMs);
    return () => {
      alive = false;
      clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshMs]);
  return quotes;
}
