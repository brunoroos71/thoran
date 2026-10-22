import { CREDIT_COST, LOW_BALANCE, PLANS, TOPUP, TRIAL_CREDITS, type Cycle, type PlanId } from '@/config/pricing';
import { readLS, writeLS } from '@/lib/storage';
import { CreditError, type BillingService, type BillingState, type ConsumeKind, type LedgerEntry, type LedgerKind, type Subscription } from './types';

/**
 * Billing simulado no navegador. Reproduz as MESMAS regras das funções SQL
 * (supabase/migrations/20261023000000_credits.sql) para a interface poder ser testada sem gateway.
 */
interface Store {
  sub: Subscription;
  ledger: LedgerEntry[];
}

const KEY = 'thoran.demo.billing';
const ROLLOVER_CAP = 300;

const fresh = (): Store => ({
  sub: { planId: null, cycle: 'mensal', status: 'trial', periodStart: null, periodEnd: null, pendingPlanId: null, pendingCycle: null, cancelAtPeriodEnd: false, graceUntil: null, autoRenew: true },
  ledger: [entry(TRIAL_CREDITS, 'trial', 'recarga', 'signup')],
});

function entry(amount: number, kind: LedgerKind, bucket: 'plano' | 'recarga', reference: string | null): LedgerEntry {
  return { id: crypto.randomUUID(), amount, kind, bucket, reference, created_at: new Date().toISOString() };
}

const load = (): Store => readLS<Store | null>(KEY, null) ?? fresh();
const save = (s: Store) => writeLS(KEY, s);
const sum = (l: LedgerEntry[], bucket?: 'plano' | 'recarga') => l.filter((e) => !bucket || e.bucket === bucket).reduce((a, e) => a + e.amount, 0);
const addMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};
const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));

function grantMonthly(s: Store, ref: string) {
  if (s.ledger.some((e) => e.kind === 'renovacao' && e.reference === ref)) return; // idempotente
  if (s.sub.pendingPlanId) {
    s.sub.planId = s.sub.pendingPlanId;
    s.sub.pendingPlanId = null;
  }
  if (s.sub.pendingCycle) {
    s.sub.cycle = s.sub.pendingCycle;
    s.sub.pendingCycle = null;
  }
  const plan = PLANS[s.sub.planId!];
  const left = Math.max(0, sum(s.ledger, 'plano'));
  const keep = plan.rollover ? Math.min(left, ROLLOVER_CAP - plan.creditsPerMonth) : 0;
  if (left - keep > 0) s.ledger.push(entry(-(left - keep), 'expiracao', 'plano', `renov:${ref}`));
  s.ledger.push(entry(plan.creditsPerMonth, 'renovacao', 'plano', ref));
}

function state(s: Store): BillingState {
  return {
    subscription: s.sub,
    balance: sum(s.ledger),
    ledger: [...s.ledger].reverse(),
    costs: { pergunta: CREDIT_COST.pergunta, analise: CREDIT_COST.analise },
    lowThreshold: LOW_BALANCE,
  };
}

export const mockBilling: BillingService = {
  mode: 'mock',
  async getState() {
    return state(load());
  },

  async subscribe(plan: PlanId, cycle: Cycle, method) {
    // mesma regra do Stripe: Pix só no anual à vista, sem renovação automática
    if (method === 'pix' && cycle !== 'anual') throw new Error('pix_somente_anual');
    await wait();
    const s = load();
    const now = new Date();
    s.sub = { ...s.sub, planId: plan, cycle, status: 'ativa', periodStart: now.toISOString(), periodEnd: addMonths(now, cycle === 'anual' ? 12 : 1).toISOString(), cancelAtPeriodEnd: false, graceUntil: null, pendingPlanId: null, pendingCycle: null, autoRenew: method !== 'pix' };
    grantMonthly(s, `sub_${now.getTime()}`);
    save(s);
    return { status: 'done' };
  },

  async changePlan(plan: PlanId, cycle: Cycle) {
    await wait();
    const s = load();
    const cur = s.sub.planId ? PLANS[s.sub.planId] : null;
    const target = PLANS[plan];
    if (cur && target.creditsPerMonth > cur.creditsPerMonth && cycle === s.sub.cycle) {
      // upgrade: vale na hora e entrega a diferença de créditos do mês
      s.sub.planId = plan;
      s.ledger.push(entry(target.creditsPerMonth - cur.creditsPerMonth, 'renovacao', 'plano', `upgrade_${Date.now()}`));
      save(s);
      return { status: 'done' };
    }
    s.sub.pendingPlanId = plan === s.sub.planId ? null : plan;
    s.sub.pendingCycle = cycle === s.sub.cycle ? null : cycle;
    save(s);
    return { status: 'scheduled', at: s.sub.periodEnd ?? new Date().toISOString() };
  },

  async cancel() {
    await wait();
    const s = load();
    s.sub.cancelAtPeriodEnd = true;
    s.sub.status = 'cancelada';
    save(s);
    return { status: 'done' };
  },

  async buyTopup() {
    await wait();
    const s = load();
    s.ledger.push(entry(TOPUP.credits, 'recarga', 'recarga', `topup_${Date.now()}`));
    save(s);
    return { status: 'done' };
  },

  async consume(kind: ConsumeKind, ref: string) {
    const s = load();
    if (s.sub.status === 'inadimplente' || (s.sub.status === 'cancelada' && s.sub.periodEnd && new Date(s.sub.periodEnd) < new Date())) throw new CreditError('blocked', sum(s.ledger));
    const cost = kind === 'consumo_analise' ? CREDIT_COST.analise : CREDIT_COST.pergunta;
    const bal = sum(s.ledger);
    if (bal < cost) throw new CreditError('credits', bal);
    const fromPlan = Math.min(cost, Math.max(0, sum(s.ledger, 'plano')));
    if (fromPlan) s.ledger.push(entry(-fromPlan, kind, 'plano', ref));
    if (cost - fromPlan) s.ledger.push(entry(-(cost - fromPlan), kind, 'recarga', ref));
    save(s);
    return bal - cost;
  },

  async refund(ref: string) {
    const s = load();
    if (!s.ledger.some((e) => e.kind === 'estorno' && e.reference === ref)) {
      s.ledger.filter((e) => e.reference === ref && e.kind.startsWith('consumo')).forEach((e) => s.ledger.push(entry(-e.amount, 'estorno', e.bucket, ref)));
      save(s);
    }
    return sum(s.ledger);
  },

  async simulateRenewal() {
    const s = load();
    if (!s.sub.planId) return;
    if (s.sub.cancelAtPeriodEnd) {
      // período acabou: tudo expira
      const p = sum(s.ledger, 'plano');
      const r = sum(s.ledger, 'recarga');
      if (p > 0) s.ledger.push(entry(-p, 'expiracao', 'plano', 'cancel'));
      if (r > 0) s.ledger.push(entry(-r, 'expiracao', 'recarga', 'cancel'));
      s.sub = fresh().sub;
      s.sub.status = 'cancelada';
    } else {
      const start = s.sub.periodEnd ? new Date(s.sub.periodEnd) : new Date();
      if (s.sub.cycle === 'mensal') {
        s.sub.periodStart = start.toISOString();
        s.sub.periodEnd = addMonths(start, 1).toISOString();
      }
      grantMonthly(s, `renov_${Date.now()}`);
    }
    save(s);
  },
};
