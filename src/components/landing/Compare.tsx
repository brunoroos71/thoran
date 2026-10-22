import { useI18n } from '@/i18n';
import { useReveal } from '@/hooks/useReveal';
import { SpotCard } from '@/components/fx/SpotCard';
import { Logo } from '@/components/ui/Logo';

export function Compare() {
  const { t } = useI18n();
  const c = t.compare;
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id="comparativo" aria-labelledby="compare-title" className="wrap scroll-mt-28 py-20 md:py-32">
      <h2 id="compare-title" className="reveal mx-auto max-w-3xl text-center text-display font-medium">
        {c.title}
      </h2>
      <p className="reveal mt-5 text-center text-nevoa">{c.eyebrow}</p>

      <div className="mt-14 grid gap-4 lg:grid-cols-2">
        <div className="reveal rounded-[24px] border border-linha p-6 md:p-10">
          <h3 className="text-xl font-medium text-nevoa">{c.colSignals}</h3>
          <dl className="mt-8 flex flex-col">
            {c.rows.map((r) => (
              <div key={r.topic} className="flex items-start justify-between gap-6 border-t border-linha py-5">
                <dt className="text-sm text-meta">{r.topic}</dt>
                <dd className="flex items-center gap-3 text-right text-lg text-nevoa">
                  {r.signals}
                  <span aria-label="não" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-baixa/15 font-mono text-xs text-baixa">✕</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <SpotCard className="reveal p-6 [transition-delay:120ms] md:p-10">
          <div className="flex items-center justify-between">
            <Logo size={24} />
            <span className="rounded-full bg-raio/10 px-3 py-1 font-mono text-[11px] text-raio">{c.colThoran}</span>
          </div>
          <dl className="mt-8 flex flex-col">
            {c.rows.map((r) => (
              <div key={r.topic} className="flex items-start justify-between gap-6 border-t border-linha py-5">
                <dt className="text-sm text-meta">{r.topic}</dt>
                <dd className="flex items-center gap-3 text-right text-lg font-medium text-texto">
                  {r.thoran}
                  <span aria-label="sim" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raio font-mono text-xs text-carbono">✓</span>
                </dd>
              </div>
            ))}
          </dl>
        </SpotCard>
      </div>
    </section>
  );
}
