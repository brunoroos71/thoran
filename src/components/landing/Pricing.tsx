import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { env } from '@/lib/env';
import { trackCta } from '@/lib/analytics';
import { cx } from '@/lib/format';
import { useReveal } from '@/hooks/useReveal';
import { PLANS, TOPUP, annualMonthlyCents, money, type Cycle, type PlanId } from '@/config/pricing';
import { SpotCard } from '@/components/fx/SpotCard';
import { CycleToggle } from '@/components/ui/CycleToggle';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Symbol } from '@/components/ui/Logo';

export function Pricing() {
  const { t, locale } = useI18n();
  const p = t.pricing;
  const ref = useReveal<HTMLElement>();
  const [cycle, setCycle] = useState<Cycle>('mensal');

  const cta = (id: PlanId, highlight: boolean) => {
    const cls = cx(
      'group mt-auto inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 font-semibold transition-colors',
      highlight ? 'bg-raio text-carbono hover:bg-texto' : 'border border-linha text-texto hover:border-texto hover:bg-texto hover:text-carbono',
    );
    const label = env.waitlistMode ? p.ctaWaitlist : p.ctaSignup;
    const arrow = <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>;
    return env.waitlistMode ? (
      <a href="/" className={cls} onClick={() => trackCta(`pricing_${id}`)}>
        {label} {arrow}
      </a>
    ) : (
      <Link to={`/cadastro?plano=${id}&ciclo=${cycle}`} className={cls} onClick={() => trackCta(`pricing_${id}`)}>
        {label} {arrow}
      </Link>
    );
  };

  return (
    <section ref={ref} id="planos" aria-labelledby="planos-title" className="wrap scroll-mt-28 py-20 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        {env.waitlistMode && (
          <p className="reveal mb-6 inline-flex items-center gap-2 rounded-full border border-raio/40 bg-raio/10 px-4 py-1.5 text-sm text-raio">
            <Symbol size={12} />
            {p.launchBadge}
          </p>
        )}
        <h2 id="planos-title" className="reveal text-h2 font-medium">
          {p.title}
        </h2>
        <p className="reveal mt-5 text-lg text-nevoa">{p.lead}</p>
        <div className="reveal mt-10">
          <CycleToggle value={cycle} onChange={setCycle} />
        </div>
      </div>

      <ul className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
        {(['basic', 'pro'] as PlanId[]).map((id, i) => {
          const plan = PLANS[id];
          const copy = p.plans[id];
          const highlight = id === 'pro';
          const main = cycle === 'mensal' ? plan.monthlyCents : annualMonthlyCents(plan);
          const Card = highlight ? SpotCard : 'div';
          return (
            <li key={id} className="reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <Card className={cx('relative flex h-full flex-col gap-6 rounded-[24px] p-7 md:p-9', highlight ? 'ring-1 ring-raio/60' : 'border border-linha')}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-2xl font-medium">{plan.name}</h3>
                  {highlight && <span className="rounded-full bg-raio px-3 py-1 text-xs font-semibold text-carbono">{p.recommended}</span>}
                </div>
                <div>
                  <p className="flex items-baseline gap-1">
                    <span className="text-5xl font-semibold tabular-nums tracking-tight">{money(main, locale)}</span>
                    <span className="text-meta">{p.perMonth}</span>
                  </p>
                  <p className="mt-2 h-5 text-sm text-meta" aria-live="polite">
                    {cycle === 'anual' && (
                      <>
                        {p.billedAnnually.replace('{v}', money(plan.annualCents, locale))} · <span className="text-raio">{p.twoFree}</span>
                      </>
                    )}
                  </p>
                </div>
                <p className="-mt-3 text-sm text-raio">{p.perAnalysis.replace('{v}', money(Math.round(main / (plan.creditsPerMonth / 5)), locale))}</p>
                <p className="text-nevoa">{copy.tagline}</p>
                <ul className="flex flex-col gap-3 border-t border-linha pt-6">
                  {copy.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span aria-hidden className={cx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px]', highlight ? 'bg-raio text-carbono' : 'bg-texto/10 text-texto')}>
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {cta(id, highlight)}
              </Card>
            </li>
          );
        })}
      </ul>

      {/* Como funcionam os créditos */}
      <div className="reveal mx-auto mt-6 grid max-w-5xl gap-px overflow-hidden rounded-[24px] border border-linha bg-linha md:grid-cols-3">
        <div className="bg-carbono p-6 md:p-8 md:col-span-3">
          <h3 className="text-xl font-medium">{p.howTitle}</h3>
        </div>
        {p.how.map((h) => (
          <div key={h.label} className="flex gap-4 bg-carbono p-6 md:p-8">
            <span className="flex h-12 min-w-12 items-center justify-center gap-1 rounded-2xl bg-grafite px-3 font-mono text-lg text-raio">
              <Symbol size={12} />
              {h.cost}
            </span>
            <div>
              <p className="font-medium">
                {h.label} · {h.cost} {h.cost === 1 ? p.credit : p.credits}
              </p>
              <p className="mt-1 text-sm text-nevoa">{h.body}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-4 bg-carbono p-6 md:p-8">
          <span className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-grafite px-3 font-mono text-lg text-trovao">+{TOPUP.credits}</span>
          <div>
            <p className="font-medium">{p.topupTitle}</p>
            <p className="mt-1 text-sm text-nevoa">{p.topupBody.replace('{v}', money(TOPUP.cents, locale))}</p>
          </div>
        </div>
      </div>

      <p className="reveal mt-8 text-center text-nevoa">{p.cancel}</p>
      <Disclaimer className="mx-auto mt-10 max-w-5xl" />
    </section>
  );
}
