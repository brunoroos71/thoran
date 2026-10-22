import { useI18n } from '@/i18n';
import { useReveal } from '@/hooks/useReveal';
import { BrainGraph, BRAIN_COUNTS } from './BrainGraph';

/** "Nosso cérebro": o grafo da base de conhecimento, interativo. */
export function Brain() {
  const { t } = useI18n();
  const b = t.brain;
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id="cerebro" aria-labelledby="cerebro-title" className="scroll-mt-28 py-20 md:py-32">
      <div className="wrap grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="reveal text-sm text-raio">{b.eyebrow}</p>
          <h2 id="cerebro-title" className="reveal mt-4 text-h2 font-medium">
            {b.title}
          </h2>
        </div>
        <p className="reveal text-lg leading-relaxed text-nevoa lg:col-span-5">{b.lead}</p>
      </div>

      <div className="mt-12 px-3 md:px-6">
        <div className="reveal relative mx-auto max-w-[1480px] overflow-hidden rounded-[28px] border border-linha bg-[#0d0f13] md:rounded-[36px]">
          <BrainGraph className="block h-[520px] w-full touch-none md:h-[680px]" />
          {/* topo: período + dica */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5 md:p-7">
            <span className="rounded-full border border-linha bg-carbono/70 px-3 py-1.5 font-mono text-xs text-nevoa backdrop-blur">{b.period}</span>
            <span className="hidden items-center gap-2 rounded-full border border-linha bg-carbono/70 px-3 py-1.5 text-xs text-nevoa backdrop-blur sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-raio" />
              {b.hint}
            </span>
          </div>
          {/* base: grupos e quantidade de pontos desenhados */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d0f13] via-[#0d0f13]/80 to-transparent p-5 pt-16 md:p-7 md:pt-20">
            <ul className="flex flex-wrap gap-2">
              {BRAIN_COUNTS.map((c) => (
                <li key={c.label} className="rounded-full border border-linha bg-carbono/70 px-3 py-1 text-xs text-nevoa backdrop-blur">
                  {c.label} <span className="font-mono text-meta">{c.n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-meta">{b.caption}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
