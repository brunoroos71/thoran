import { useI18n } from '@/i18n';
import { useReveal } from '@/hooks/useReveal';

export function Faq() {
  const { t } = useI18n();
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id="faq" aria-labelledby="faq-title" className="wrap grid scroll-mt-28 gap-12 py-20 md:py-32 lg:grid-cols-12">
      <h2 id="faq-title" className="reveal text-h2 font-medium lg:col-span-4">
        {t.faq.title}
      </h2>
      <div className="flex flex-col gap-3 lg:col-span-8">
        {t.faq.items.map((it) => (
          <details key={it.q} className="reveal group rounded-[20px] border border-linha bg-grafite/40 px-6 transition-colors open:bg-grafite hover:border-aco md:px-8">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-medium tracking-tight md:text-xl [&::-webkit-details-marker]:hidden">
              {it.q}
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-linha transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:bg-raio group-open:text-carbono">
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-7 leading-relaxed text-nevoa">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
