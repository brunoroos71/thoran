import { useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useReveal } from '@/hooks/useReveal';
import { buildMockAnalysis } from '@/services/agent/mockAgent';
import { PrecedentCard } from '@/components/ui/PrecedentCard';
import { Tilt } from '@/components/fx/Tilt';

export function PrecedentShowcase() {
  const { t, locale } = useI18n();
  const ref = useReveal<HTMLElement>();
  const example = useMemo(() => buildMockAnalysis({ query: 'copom selic landing', market: 'b3', locale }), [locale]);
  return (
    <section ref={ref} aria-labelledby="precedente-title" className="wrap grid items-center gap-12 py-20 md:py-32 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-5">
        <h2 id="precedente-title" className="reveal text-h2 font-medium">
          {t.precedent.title}
        </h2>
        <p className="reveal mt-6 max-w-md text-lg leading-relaxed text-nevoa">{t.precedent.lead}</p>
        <ul className="mt-10 flex flex-col gap-3">
          {t.precedent.points.map((p, i) => (
            <li key={p.title} className="reveal flex gap-4 rounded-2xl border border-linha p-5" style={{ transitionDelay: `${i * 80}ms` }}>
              <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-raio" />
              <span>
                <span className="block font-medium">{p.title}</span>
                <span className="text-sm text-nevoa">{p.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="reveal lg:col-span-7" data-cursor="ver">
        <Tilt max={4}>
          <PrecedentCard data={example} illustrative className="rounded-[24px] lg:p-8" />
        </Tilt>
      </div>
    </section>
  );
}
