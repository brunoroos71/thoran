import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { cx, fmtDate } from '@/lib/format';
import { PLANS, TOPUP, annualMonthlyCents, money, type Cycle, type PlanId } from '@/config/pricing';
import { billingService, type BillingResult, type PayMethod } from '@/services/billing';
import { useCredits } from '@/services/billing/CreditsProvider';
import { PageHead } from '@/components/app/AppLayout';
import { CycleToggle } from '@/components/ui/CycleToggle';
import { Symbol } from '@/components/ui/Logo';
import { Disclaimer } from '@/components/ui/Disclaimer';

export default function Plans() {
  const { t, locale } = useI18n();
  const c = t.app.credits;
  const p = t.pricing;
  useTitle(t.app.plansTitle);
  const { state, refresh } = useCredits();
  const [params] = useSearchParams();
  const intentPlan = (params.get('plano') ?? sessionStorage.getItem('thoran.intent.plan')) as PlanId | null;
  const [cycle, setCycle] = useState<Cycle>((params.get('ciclo') ?? sessionStorage.getItem('thoran.intent.cycle') ?? 'mensal') as Cycle);
  const [method, setMethod] = useState<PayMethod>('card');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // volta do checkout do Stripe: o webhook lança os créditos em segundos, então atualizamos algumas vezes
  useEffect(() => {
    const ck = params.get('checkout');
    if (!ck) return;
    setNotice(ck === 'ok' ? c.checkoutOk : c.checkoutCanceled);
    if (ck !== 'ok') return;
    const timers = [1500, 4000, 8000, 15000].map((ms) => setTimeout(refresh, ms));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state?.subscription.planId) setCycle(state.subscription.pendingCycle ?? state.subscription.cycle);
  }, [state?.subscription.planId, state?.subscription.cycle, state?.subscription.pendingCycle]);

  const month = useMemo(() => {
    if (!state) return null;
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const thisMonth = state.ledger.filter((e) => new Date(e.created_at) >= start);
    const used = -thisMonth.filter((e) => e.kind.startsWith('consumo')).reduce((a, e) => a + e.amount, 0) - thisMonth.filter((e) => e.kind === 'estorno').reduce((a, e) => a + e.amount, 0);
    const received = thisMonth.filter((e) => e.amount > 0 && e.kind !== 'estorno').reduce((a, e) => a + e.amount, 0);
    return { used, total: Math.max(used + state.balance, received, 1) };
  }, [state]);

  if (!state || !month) return <p className="p-8 text-meta">{t.common.loading}</p>;
  const sub = state.subscription;
  const current = sub.planId ? PLANS[sub.planId] : null;
  const pct = Math.min(100, (month.used / month.total) * 100);

  const act = async (key: string, fn: () => Promise<BillingResult>) => {
    setBusy(key);
    setNotice(null);
    try {
      const r = await fn();
      sessionStorage.removeItem('thoran.intent.plan');
      sessionStorage.removeItem('thoran.intent.cycle');
      await refresh();
      setNotice(r.status === 'scheduled' ? c.scheduled.replace('{d}', fmtDate(r.at, locale)) : c.done);
    } catch (e) {
      setNotice((e as Error).message === 'pix_somente_anual' ? c.pixAnnualOnly : t.auth.errGeneric);
    } finally {
      setBusy(null);
    }
  };

  const statusLine = () => {
    if (sub.status === 'trial') return '';
    if (sub.status === 'inadimplente') return c.blocked;
    if (sub.graceUntil) return c.graceUntil.replace('{d}', fmtDate(sub.graceUntil, locale));
    if (sub.cancelAtPeriodEnd && sub.periodEnd) return c.canceled.replace('{d}', fmtDate(sub.periodEnd, locale));
    if (sub.periodEnd && sub.autoRenew === false) return `${c.endsOn.replace('{d}', fmtDate(sub.periodEnd, locale))} · ${c.pixNoRenew}`;
    if (sub.periodEnd) return c.renewsOn.replace('{d}', fmtDate(sub.periodEnd, locale));
    return '';
  };

  const pixBlocked = method === 'pix' && cycle === 'mensal';
  const planAction = (id: PlanId) => {
    const plan = PLANS[id];
    const isCurrent = sub.planId === id && sub.cycle === cycle && !sub.cancelAtPeriodEnd;
    if (isCurrent) return { label: c.currentPlan, disabled: true, run: undefined };
    if (!current || sub.cancelAtPeriodEnd)
      return { label: `${t.app.choose} ${plan.name}`, disabled: pixBlocked, run: () => act(id, () => billingService.subscribe(id, cycle, method)) };
    const upgrade = plan.creditsPerMonth > current.creditsPerMonth && cycle === sub.cycle;
    return { label: upgrade ? c.upgradeNow : c.downgradeNext, disabled: method === 'pix', run: () => act(id, () => billingService.changePlan(id, cycle)) };
  };

  return (
    <>
      <PageHead title={t.app.plansTitle} lead={t.app.plansLead} />
      <div className="flex flex-col gap-6 px-4 py-8 sm:px-8">
        {notice && (
          <p role="status" className="rounded-2xl border border-raio/40 bg-raio/10 px-5 py-3 text-sm text-raio">
            {notice}
          </p>
        )}

        {/* Resumo: plano + saldo */}
        <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-[24px] border border-linha p-6">
            <p className="label text-meta">{c.currentPlan}</p>
            <p className="mt-3 text-3xl font-medium">
              {current ? current.name : c.trial}
              {current && <span className="ml-2 text-base text-meta">· {sub.cycle === 'anual' ? p.annual : p.monthly}</span>}
            </p>
            <p className={cx('mt-2 text-sm', sub.status === 'inadimplente' || sub.graceUntil ? 'text-trovao' : 'text-nevoa')}>{statusLine()}</p>
            {sub.pendingPlanId && <p className="mt-1 text-sm text-meta">→ {PLANS[sub.pendingPlanId].name} {sub.periodEnd && `· ${fmtDate(sub.periodEnd, locale)}`}</p>}
          </div>
          <div className="rounded-[24px] border border-linha p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="label text-meta">{c.balance}</p>
                <p className="mt-2 flex items-center gap-2 font-mono text-5xl font-medium">
                  <Symbol size={28} />
                  {state.balance}
                </p>
              </div>
              <button
                disabled={!!busy || !current}
                onClick={() => act('topup', () => billingService.buyTopup(method))}
                title={!current ? p.lead : undefined}
                className="min-h-[48px] rounded-full bg-raio px-5 text-sm font-semibold text-carbono transition-colors hover:bg-texto disabled:opacity-50"
              >
                {busy === 'topup' ? t.common.loading : c.buyTopup.replace('{v}', money(TOPUP.cents, locale))}
              </button>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs text-meta">
                <span>{c.usedThisMonth}</span>
                <span className="font-mono">
                  {month.used} / {month.total}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-grafite" role="progressbar" aria-valuemin={0} aria-valuemax={month.total} aria-valuenow={month.used} aria-label={c.usedThisMonth}>
                <div className={cx('h-full rounded-full transition-[width] duration-700', state.balance <= state.lowThreshold ? 'bg-trovao' : 'bg-raio')} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Troca de plano */}
        <section className="rounded-[24px] border border-linha p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CycleToggle value={cycle} onChange={setCycle} />
            <fieldset className="flex items-center gap-2">
              <legend className="sr-only">{c.payMethod}</legend>
              <span className="text-sm text-meta">{c.payMethod}:</span>
              {(['card', 'pix'] as PayMethod[]).map((m) => (
                <button key={m} type="button" aria-pressed={method === m} onClick={() => setMethod(m)} className={cx('min-h-[40px] rounded-full border px-4 text-sm', method === m ? 'border-raio text-raio' : 'border-linha text-nevoa')}>
                  {m === 'card' ? c.card : c.pix}
                </button>
              ))}
            </fieldset>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {(['basic', 'pro'] as PlanId[]).map((id) => {
              const plan = PLANS[id];
              const a = planAction(id);
              const highlight = id === 'pro';
              return (
                <li key={id} className={cx('flex flex-col gap-4 rounded-2xl p-6', highlight ? 'ring-1 ring-raio/60 bg-grafite' : 'border border-linha', intentPlan === id && !current && 'outline outline-2 outline-offset-4 outline-raio')}>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-medium">{plan.name}</p>
                    {highlight && <span className="rounded-full bg-raio px-3 py-1 text-xs font-semibold text-carbono">{p.recommended}</span>}
                  </div>
                  <p className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tabular-nums tracking-tight">{money(cycle === 'mensal' ? plan.monthlyCents : annualMonthlyCents(plan), locale)}</span>
                    <span className="text-meta">{p.perMonth}</span>
                  </p>
                  <p className="-mt-2 h-4 text-xs text-meta">{cycle === 'anual' && p.billedAnnually.replace('{v}', money(plan.annualCents, locale))}</p>
                  <p className="text-sm text-nevoa">{p.plans[id].features[0]}</p>
                  <button
                    disabled={a.disabled || !!busy}
                    onClick={a.run}
                    className={cx('mt-auto min-h-[48px] rounded-full font-semibold transition-colors disabled:opacity-60', a.disabled ? 'border border-linha text-meta' : highlight ? 'bg-raio text-carbono hover:bg-texto' : 'border border-linha hover:border-texto')}
                  >
                    {busy === id ? t.common.loading : a.label}
                  </button>
                </li>
              );
            })}
          </ul>
          {method === 'pix' && <p className="mt-4 text-sm text-trovao">{c.pixAnnualOnly}</p>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-meta">
              {p.cancel} {billingService.mode === 'live' && c.secure}
            </p>
            {billingService.openPortal && current && (
              <button onClick={() => act('portal', () => billingService.openPortal!())} className="min-h-[44px] text-nevoa underline-offset-2 hover:text-raio hover:underline">
                {c.portal}
              </button>
            )}
            {current && !sub.cancelAtPeriodEnd && (
              <button
                onClick={() => window.confirm(c.cancelConfirm) && act('cancel', () => billingService.cancel())}
                className="min-h-[44px] text-baixa underline-offset-2 hover:underline"
              >
                {c.cancelPlan}
              </button>
            )}
          </div>
          {billingService.mode === 'mock' && (
            <p className="mt-4 flex flex-wrap items-center gap-3 text-xs text-meta">
              {c.simulated}
              {billingService.simulateRenewal && current && (
                <button className="underline" onClick={async () => (await billingService.simulateRenewal!(), refresh())}>
                  Simular renovação
                </button>
              )}
            </p>
          )}
        </section>

        {/* Histórico */}
        <section className="rounded-[24px] border border-linha p-6">
          <h2 className="text-lg font-medium">{c.history}</h2>
          {state.ledger.length === 0 ? (
            <p className="mt-4 text-meta">{c.historyEmpty}</p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <tbody>
                {state.ledger.slice(0, 40).map((e) => (
                  <tr key={e.id} className="border-t border-linha">
                    <td className="whitespace-nowrap py-3 pr-4 font-mono text-xs text-meta">{fmtDate(e.created_at, locale)}</td>
                    <td className="py-3 pr-4">{c.kinds[e.kind]}</td>
                    <td className={cx('py-3 text-right font-mono', e.amount > 0 ? 'text-alta' : 'text-nevoa')}>
                      {e.amount > 0 ? '+' : '−'}
                      {Math.abs(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <Disclaimer />
      </div>
    </>
  );
}
