import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useReveal } from '@/hooks/useReveal';
import { SpotCard } from '@/components/fx/SpotCard';
import { Symbol } from '@/components/ui/Logo';

/** Visual 1: campo de entrada digitando manchetes em loop. */
function TypingInput({ lines }: { lines: string[] }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(lines[0].length);
    const full = lines[i];
    const t = setTimeout(
      () => {
        if (n < full.length) setN(n + 1);
        else {
          setN(0);
          setI((i + 1) % lines.length);
        }
      },
      n < full.length ? 45 : 1600,
    );
    return () => clearTimeout(t);
  }, [i, n, lines]);
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-6">
      <div className="flex items-center gap-3 rounded-full border border-linha bg-carbono px-5 py-4 font-mono text-sm text-texto">
        <span className="truncate">
          {lines[i].slice(0, n)}
          <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-blink bg-raio" />
        </span>
        <span className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raio text-carbono">↑</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {['B3', 'Cripto', 'Internacional'].map((m, k) => (
          <span key={m} className={`rounded-full border px-3 py-1 font-mono text-[11px] ${k === 0 ? 'border-raio text-raio' : 'border-linha text-meta'}`}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Visual 2: linha do tempo 2016–2026 com varredura acendendo casos parecidos. */
function MemoryScan() {
  const years = Array.from({ length: 11 }, (_, k) => 2016 + k);
  const hits = new Set([2016, 2018, 2021, 2022, 2024]);
  return (
    <div className="relative flex h-full flex-col justify-center gap-4 overflow-hidden p-6">
      <div className="relative grid grid-cols-11 gap-1.5">
        {years.map((y) => (
          <div key={y} className="flex flex-col items-center gap-1.5">
            <span className={`h-10 w-full rounded-md ${hits.has(y) ? 'bg-raio/80' : 'bg-linha'} ${hits.has(y) ? 'animate-pulse' : ''}`} style={{ animationDelay: `${(y - 2016) * 120}ms` }} />
            <span className="font-mono text-[9px] text-meta">{String(y).slice(2)}</span>
          </div>
        ))}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 w-16 animate-[scan_3.2s_linear_infinite] bg-gradient-to-r from-transparent via-raio/25 to-transparent motion-reduce:hidden" />
      </div>
      <p className="font-mono text-xs text-nevoa">
        <span className="text-raio">5</span> casos parecidos · 2016–2026
      </p>
    </div>
  );
}

/** Visual 3: resultado — setas e contagem. */
function ResultMini() {
  const rows: [string, string, 'down' | 'up'][] = [
    ['2022', '−0,9%', 'down'],
    ['2016', '−0,6%', 'down'],
    ['2021', '+0,2%', 'up'],
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-2 p-6">
      {rows.map(([y, v, d]) => (
        <div key={y} className="flex items-center justify-between rounded-xl border border-linha bg-carbono px-4 py-3 font-mono text-sm">
          <span className="text-meta">Copom · {y}</span>
          <span className={d === 'down' ? 'text-baixa' : 'text-alta'}>
            {d === 'down' ? '▼' : '▲'} {v}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-2 text-xs text-nevoa">
        <Symbol size={12} /> 10 de 14 casos com queda em 1h
      </div>
    </div>
  );
}

export function HowItWorks() {
  const { t } = useI18n();
  const ref = useReveal<HTMLElement>();
  const visuals = [<TypingInput key="a" lines={t.ticker.slice(0, 4)} />, <MemoryScan key="b" />, <ResultMini key="c" />];
  return (
    <section ref={ref} id="como-funciona" aria-labelledby="how-title" className="wrap scroll-mt-28 py-20 md:py-32">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <h2 id="how-title" className="reveal max-w-2xl text-h2 font-medium">
          {t.how.title}
        </h2>
        <p className="reveal max-w-sm text-nevoa">{t.how.eyebrow} · {t.common.illustrative.toLowerCase()}</p>
      </div>
      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {t.how.steps.map((s, i) => (
          <SpotCard as="li" key={s.k} className="reveal flex flex-col overflow-hidden" style={{ transitionDelay: `${i * 100}ms` }}>
            <div aria-hidden className="h-56 border-b border-linha bg-carbono/40">
              {visuals[i]}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6 md:p-8">
              <p className="flex items-center gap-3 font-mono text-xs text-meta">
                <span className="text-raio">{s.k}</span>
                {s.tag}
              </p>
              <h3 className="text-2xl font-medium tracking-tight md:text-3xl">{s.title}</h3>
              <p className="leading-relaxed text-nevoa">{s.body}</p>
            </div>
          </SpotCard>
        ))}
      </ol>
    </section>
  );
}
