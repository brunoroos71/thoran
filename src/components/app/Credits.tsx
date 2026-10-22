import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { cx } from '@/lib/format';
import { PLANS, TOPUP, money } from '@/config/pricing';
import { billingService } from '@/services/billing';
import { useCredits } from '@/services/billing/CreditsProvider';
import { Symbol } from '@/components/ui/Logo';

/** Saldo sempre visível: raio + número. */
export function CreditsBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  const { state } = useCredits();
  const low = state && state.balance <= state.lowThreshold;
  return (
    <Link
      to="/app/planos"
      className={cx('inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 font-mono text-sm transition-colors', low ? 'border-trovao/50 text-trovao' : 'border-linha text-texto hover:border-raio', className)}
      aria-label={`${t.app.credits.balance}: ${state?.balance ?? '…'} ${t.app.credits.unit}`}
    >
      <Symbol size={13} tone={low ? 'mono-light' : 'dark'} className={low ? 'fill-trovao' : undefined} />
      {state?.balance ?? '…'}
    </Link>
  );
}

/** Aviso quando restam poucos créditos (padrão: 10). */
export function LowBalanceBanner() {
  const { t } = useI18n();
  const { state } = useCredits();
  if (!state || state.balance > state.lowThreshold) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-trovao/30 bg-trovao/10 px-4 py-3 text-sm text-trovao sm:px-8">
      <span>{t.app.credits.low.replace('{n}', String(state.balance))}</span>
      <Link to="/app/planos" className="underline underline-offset-2">
        {t.app.seePlans}
      </Link>
    </div>
  );
}

/** Modal de saldo insuficiente: recarga ou upgrade. Nunca deixa o saldo ficar negativo. */
export function InsufficientModal() {
  const { t, locale } = useI18n();
  const c = t.app.credits;
  const { state, modal, closeModal, refresh } = useCredits();
  const [busy, setBusy] = useState<string | null>(null);
  if (!modal || !state) return null;
  const sub = state.subscription;
  const canUpgrade = sub.planId !== 'pro';

  const run = async (k: string, fn: () => Promise<unknown>) => {
    setBusy(k);
    try {
      await fn();
      await refresh();
      closeModal();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-carbono/80 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="credits-modal-title" onKeyDown={(e) => e.key === 'Escape' && closeModal()}>
      <div className="w-full max-w-md rounded-[24px] border border-linha bg-grafite p-6 shadow-2xl sm:p-8">
        <p className="flex h-12 w-12 items-center justify-center rounded-2xl bg-trovao/15">
          <Symbol size={20} tone="mono-light" className="fill-trovao" />
        </p>
        <h2 id="credits-modal-title" className="mt-5 text-2xl font-medium">
          {c.modalTitle}
        </h2>
        <p className="mt-2 text-nevoa">
          {c.modalBody.replace('{cost}', `${modal.cost} ${t.pricing.credits}`).replace('{balance}', String(state.balance))}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {/* recarga é para assinantes; no teste grátis, oferece assinar */}
          {!sub.planId && (
            <button
              autoFocus
              disabled={!!busy}
              onClick={() => run('basic', () => billingService.subscribe('basic', 'mensal', 'card'))}
              className="flex min-h-[52px] items-center justify-between rounded-2xl border border-linha px-5 font-medium transition-colors hover:border-texto disabled:opacity-60"
            >
              <span>{busy === 'basic' ? t.common.loading : `${t.app.choose} Basic`}</span>
              <span className="font-mono text-nevoa">
                {money(PLANS.basic.monthlyCents, locale)}
                {t.pricing.perMonth}
              </span>
            </button>
          )}
          {sub.planId && <button
            autoFocus
            disabled={!!busy}
            onClick={() => run('topup', () => billingService.buyTopup('card'))}
            className="flex min-h-[52px] items-center justify-between rounded-2xl bg-raio px-5 font-semibold text-carbono transition-colors hover:bg-texto disabled:opacity-60"
          >
            <span>{busy === 'topup' ? t.common.loading : c.topup}</span>
            <span className="font-mono">{money(TOPUP.cents, locale)}</span>
          </button>}
          {canUpgrade && (
            <button
              disabled={!!busy}
              onClick={() => run('up', () => (sub.planId ? billingService.changePlan('pro', sub.cycle) : billingService.subscribe('pro', 'mensal', 'card')))}
              className="flex min-h-[52px] items-center justify-between rounded-2xl border border-linha px-5 font-medium transition-colors hover:border-texto disabled:opacity-60"
            >
              <span>{busy === 'up' ? t.common.loading : c.upgrade}</span>
              <span className="font-mono text-nevoa">
                {money(PLANS.pro.monthlyCents, locale)}
                {t.pricing.perMonth}
              </span>
            </button>
          )}
          <button onClick={closeModal} className="min-h-[44px] text-sm text-meta hover:text-texto">
            {c.close}
          </button>
        </div>
        {billingService.mode === 'mock' && <p className="mt-4 text-center text-xs text-meta">{c.simulated}</p>}
      </div>
    </div>
  );
}
