import type { Cycle, PlanId } from '@/config/pricing';

export type SubscriptionStatus = 'trial' | 'ativa' | 'cancelada' | 'inadimplente';
export type LedgerKind = 'trial' | 'renovacao' | 'recarga' | 'consumo_pergunta' | 'consumo_analise' | 'estorno' | 'expiracao';
export type PayMethod = 'card' | 'pix';
export type ConsumeKind = 'consumo_pergunta' | 'consumo_analise';

export interface Subscription {
  planId: PlanId | null; // null no teste grátis
  cycle: Cycle;
  status: SubscriptionStatus;
  periodStart: string | null;
  periodEnd: string | null;
  pendingPlanId: PlanId | null;
  pendingCycle: Cycle | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
  autoRenew: boolean;
}

export interface LedgerEntry {
  id: string;
  amount: number;
  kind: LedgerKind;
  bucket: 'plano' | 'recarga';
  reference: string | null;
  created_at: string;
}

export interface BillingState {
  subscription: Subscription;
  balance: number;
  ledger: LedgerEntry[]; // mais recentes primeiro
  costs: { pergunta: number; analise: number };
  lowThreshold: number;
}

/** Resultado de uma ação de pagamento: concluída na hora (mock/cartão salvo) ou à espera do checkout/Pix. */
export type BillingResult = { status: 'done' } | { status: 'scheduled'; at: string } | { status: 'redirect'; url: string } | { status: 'pix'; qrCode: string; copyPaste: string };

export class CreditError extends Error {
  constructor(public code: 'credits' | 'blocked', public balance: number) {
    super(code);
  }
}

/** Interface única. mockBilling e liveBilling implementam exatamente isto (como o agentService). */
export interface BillingService {
  readonly mode: 'mock' | 'live';
  getState(): Promise<BillingState>;
  subscribe(plan: PlanId, cycle: Cycle, method: PayMethod): Promise<BillingResult>;
  /** Upgrade vale na hora; downgrade e troca de ciclo valem na próxima renovação. */
  changePlan(plan: PlanId, cycle: Cycle): Promise<BillingResult>;
  cancel(): Promise<BillingResult>;
  buyTopup(method: PayMethod): Promise<BillingResult>;
  /** Portal do gateway (trocar cartão, ver faturas). Só no live. */
  openPortal?(): Promise<BillingResult>;
  /** Só no mock: no live o débito acontece no servidor, dentro do /agent-proxy. */
  consume?(kind: ConsumeKind, ref: string): Promise<number>;
  refund?(ref: string): Promise<number>;
  /** Só no mock: avança um mês para testar renovação. */
  simulateRenewal?(): Promise<void>;
}
