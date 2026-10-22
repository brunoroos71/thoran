export const fmtPct = (v: number, locale = 'pt-BR') =>
  `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;

/** Variação com sinal na unidade do dado: '%' (padrão) ou pontos-base ('p.b.', juros). */
export const fmtMove = (v: number, unit = '%', locale = 'pt-BR') => {
  if (unit === '%') return fmtPct(v, locale);
  const n = Math.abs(v).toLocaleString(locale, { maximumFractionDigits: 1 });
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${n} ${unit}`;
};

export const fmtDate = (iso: string, locale = 'pt-BR') =>
  new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Lê o ano direto da string para não sofrer com fuso ("2016-01-01" viraria 2015 em UTC−3)
export const fmtYear = (iso: string) => iso.slice(0, 4);

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
