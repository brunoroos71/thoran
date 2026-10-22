export interface Attribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
}

const KEY = 'thoran.attribution';

/** Guarda a primeira atribuição da sessão para não perder UTM ao navegar. */
export function captureAttribution(): Attribution {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  const p = new URLSearchParams(window.location.search);
  const a: Attribution = {
    utm_source: p.get('utm_source'),
    utm_medium: p.get('utm_medium'),
    utm_campaign: p.get('utm_campaign'),
    referrer: document.referrer || null,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
  return a;
}
