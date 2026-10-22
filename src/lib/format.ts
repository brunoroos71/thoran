export const fmtPct = (v: number, locale = 'pt-BR') =>
  `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;

export const fmtDate = (iso: string, locale = 'pt-BR') =>
  new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Lê o ano direto da string para não sofrer com fuso ("2016-01-01" viraria 2015 em UTC−3)
export const fmtYear = (iso: string) => iso.slice(0, 4);

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
