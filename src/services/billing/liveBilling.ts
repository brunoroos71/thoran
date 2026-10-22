import { functionsUrl, supabase } from '@/lib/supabase';
import type { Cycle, PlanId } from '@/config/pricing';
import type { BillingResult, BillingService, BillingState, PayMethod } from './types';

/**
 * Billing real: lê assinatura e ledger do Supabase (RLS: só os próprios dados) e
 * dispara ações pela Edge Function /billing, que fala com o Stripe.
 * O débito de créditos NUNCA acontece aqui: é feito no /agent-proxy.
 */
async function call(body: Record<string, unknown>): Promise<BillingResult> {
  const { data } = await supabase!.auth.getSession();
  const res = await fetch(functionsUrl('billing'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session?.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'billing_error');
  const r = (await res.json()) as BillingResult;
  if (r.status === 'redirect') window.location.href = r.url;
  return r;
}

export const liveBilling: BillingService = {
  mode: 'live',
  async getState(): Promise<BillingState> {
    const sb = supabase!;
    const [{ data: sub }, { data: credits }, { data: ledger }] = await Promise.all([
      sb.from('subscriptions').select('*').maybeSingle(),
      sb.rpc('my_credits'),
      sb.from('credit_ledger').select('id, amount, kind, bucket, reference, created_at').order('created_at', { ascending: false }).limit(200),
    ]);
    return {
      subscription: {
        planId: sub?.plan_id ?? null,
        cycle: sub?.cycle ?? 'mensal',
        status: sub?.status ?? 'trial',
        periodStart: sub?.period_start ?? null,
        periodEnd: sub?.period_end ?? null,
        pendingPlanId: sub?.pending_plan_id ?? null,
        pendingCycle: sub?.pending_cycle ?? null,
        cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
        graceUntil: sub?.grace_until ?? null,
        autoRenew: sub?.auto_renew ?? true,
      },
      balance: credits?.balance ?? 0,
      ledger: (ledger ?? []).map((e) => ({ ...e, id: String(e.id) })),
      costs: { pergunta: credits?.cost_pergunta ?? 1, analise: credits?.cost_analise ?? 5 },
      lowThreshold: credits?.low_threshold ?? 10,
    };
  },
  subscribe: (plan: PlanId, cycle: Cycle, method: PayMethod) => call({ action: 'subscribe', plan, cycle, method }),
  changePlan: (plan: PlanId, cycle: Cycle) => call({ action: 'change', plan, cycle }),
  cancel: () => call({ action: 'cancel' }),
  buyTopup: (method: PayMethod) => call({ action: 'topup', method }),
  openPortal: () => call({ action: 'portal' }),
};
