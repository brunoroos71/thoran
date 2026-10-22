import { useState } from 'react';
import { useI18n } from '@/i18n';
import { useReveal } from '@/hooks/useReveal';
import { useQuotes } from '@/hooks/useQuotes';
import { cx } from '@/lib/format';
import { ASSETS, ALL_ASSETS, fmtPrice, type Asset } from '@/services/marketService';
import { SpotCard } from '@/components/fx/SpotCard';
import { CandleChart } from '@/components/ui/CandleChart';
import { Move } from '@/components/ui/Move';
import { Link } from 'react-router-dom';
import { env } from '@/lib/env';
import { trackCta } from '@/lib/analytics';

const KEYS = ['b3', 'crypto', 'global'] as const;

export function Markets() {
  const { t, locale } = useI18n();
  const ref = useReveal<HTMLElement>();
  const quotes = useQuotes(ALL_ASSETS);
  const [sel, setSel] = useState<Record<string, string>>({ b3: 'IBOV', crypto: 'BTC', global: 'SPX' });
  const latest = Math.max(0, ...Object.values(quotes).map((q) => q?.updatedAt ?? 0));

  return (
    <section ref={ref} id="mercados" aria-labelledby="mercados-title" className="scroll-mt-28 py-20 md:py-32">
      <div className="wrap flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <h2 id="mercados-title" className="reveal text-display font-medium">
          {t.markets.title}
        </h2>
        <p className="reveal flex items-center gap-2 text-sm text-meta">
          <span className="relative flex h-2 w-2">
            <span className="absolute h-2 w-2 animate-ping rounded-full bg-alta/60 motion-reduce:hidden" />
            <span className="h-2 w-2 rounded-full bg-alta" />
          </span>
          {t.markets.live}
          {latest > 0 && ` · ${t.markets.updated} ${new Date(latest).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </div>

      <ul className="wrap mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible">
        {KEYS.map((k, i) => {
          const m = t.markets.items[i];
          const assets = ASSETS[k];
          const active = assets.find((a) => a.id === sel[k]) ?? assets[0];
          const q = quotes[active.id];
          return (
            <SpotCard as="li" key={k} className="reveal flex w-[88%] shrink-0 snap-start flex-col overflow-hidden sm:w-[62%] lg:w-auto" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="p-6 md:p-7">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-raio">{m.code}</p>
                  <p className="text-xs text-meta">{m.name}</p>
                </div>
                <p className="mt-5 text-sm text-nevoa">{active.name}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                  <p className="font-mono text-3xl font-medium tracking-tight xl:text-4xl">{q ? fmtPrice(q.last, active, locale) : '—'}</p>
                  {q && <Move value={+q.changePct.toFixed(2)} className="text-sm" />}
                </div>
              </div>
              <div className="px-3">
                {q && q.candles.length > 3 ? (
                  <CandleChart
                    candles={q.candles.slice(-36)}
                    height={170}
                    label={`${active.name}: ${t.markets.chartLabel}`}
                    format={(v) => v.toLocaleString(locale, { maximumFractionDigits: active.decimals })}
                    formatTime={(ts) => new Date(ts).toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  />
                ) : (
                  <div className="flex h-[150px] items-center justify-center text-sm text-meta">{q === null ? t.markets.unavailable : '…'}</div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-linha px-6 py-4 md:px-7">
                <p className="text-sm italic text-nevoa">{t.markets.examples[k]}</p>
                {env.waitlistMode ? (
                  <a href="/" onClick={() => trackCta(`market_${k}`)} className="shrink-0 text-sm font-medium text-raio hover:text-texto">
                    {t.markets.ask} →
                  </a>
                ) : (
                  <Link to="/cadastro" onClick={() => trackCta(`market_${k}`)} className="shrink-0 text-sm font-medium text-raio hover:text-texto">
                    {t.markets.ask} →
                  </Link>
                )}
              </div>
              <ul className="border-t border-linha" role="list">
                {assets.map((a: Asset) => {
                  const aq = quotes[a.id];
                  const on = a.id === active.id;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSel((s) => ({ ...s, [k]: a.id }))}
                        className={cx('flex min-h-[48px] w-full items-center justify-between gap-3 border-b border-linha px-6 font-mono text-sm transition-colors last:border-0 md:px-7', on ? 'bg-texto/[.04] text-texto' : 'text-nevoa hover:bg-texto/[.03]')}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cx('h-1.5 w-1.5 rounded-full', on ? 'bg-raio' : 'bg-transparent')} />
                          {a.label}
                        </span>
                        <span className="flex items-center gap-4">
                          <span className="hidden text-meta sm:inline xl:inline">{aq ? fmtPrice(aq.last, a, locale) : ''}</span>
                          {aq ? <Move value={+aq.changePct.toFixed(2)} /> : <span className="text-meta">—</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </SpotCard>
          );
        })}
      </ul>
      <p className="wrap mt-6 text-xs text-meta">{t.markets.source}</p>
    </section>
  );
}
