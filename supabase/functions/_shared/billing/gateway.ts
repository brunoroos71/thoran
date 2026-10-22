import type { BillingEvent, Cycle, PlanId } from './events.ts';

export type PayMethod = 'card' | 'pix';
export type ActionResult = { status: 'done' } | { status: 'scheduled'; at: string } | { status: 'redirect'; url: string } | { status: 'pix'; qrCode: string; copyPaste: string };

export interface Customer {
  userId: string;
  email: string;
  gatewayCustomerId?: string | null;
  gatewaySubscriptionId?: string | null;
}

export interface GatewayResponse {
  result: ActionResult;
  /** Eventos para aplicar na hora (pagamento síncrono). O webhook reaplica de forma idempotente. */
  events: BillingEvent[];
  /** Cliente criado no gateway nesta chamada, para salvar em subscriptions.gateway_customer_id. */
  customerId?: string;
}

export type ChangeKind = 'upgrade' | 'downgrade' | 'cycle';

export class GatewayError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/**
 * Interface do gateway. Implementações: mockGateway (aprova tudo) e stripeGateway (stripe.ts).
 * Valores em centavos vêm sempre do banco (plans / credit_config).
 */
export interface Gateway {
  name: 'mock' | 'stripe';
  subscribe(c: Customer, plan: PlanId, cycle: Cycle, method: PayMethod, priceCents: number): Promise<GatewayResponse>;
  /** Devolve quando a troca vale: 'now' (upgrade, troca de ciclo no Stripe) ou 'next_renewal' (downgrade). */
  changePlan(c: Customer, plan: PlanId, cycle: Cycle, kind: ChangeKind): Promise<GatewayResponse & { applies: 'now' | 'next_renewal' }>;
  cancel(c: Customer): Promise<GatewayResponse>;
  topup(c: Customer, method: PayMethod, priceCents: number, credits: number): Promise<GatewayResponse>;
  /** Portal para trocar cartão e ver faturas (Stripe Billing Portal). */
  portal?(c: Customer): Promise<GatewayResponse>;
  /** Valida a assinatura do webhook e traduz o payload. */
  parseWebhook(req: Request): Promise<BillingEvent[]>;
}

const addMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x.toISOString();
};

/** Gateway simulado: aprova tudo na hora. Útil em staging sem chaves do Stripe. */
export const mockGateway: Gateway = {
  name: 'mock',
  async subscribe(c, plan, cycle, _method, priceCents) {
    const now = new Date();
    const id = `mock_${crypto.randomUUID()}`;
    return {
      result: { status: 'done' },
      events: [{ type: 'subscription.activated', userId: c.userId, plan, cycle, periodStart: now.toISOString(), periodEnd: addMonths(now, cycle === 'anual' ? 12 : 1), gatewaySubscriptionId: id, paymentId: `pay_${id}`, amountCents: priceCents, autoRenew: true }],
    };
  },
  async changePlan(_c, _p, _cy, kind) {
    return { result: { status: 'done' }, events: [], applies: kind === 'upgrade' ? 'now' : 'next_renewal' };
  },
  async cancel(c) {
    return { result: { status: 'done' }, events: [{ type: 'subscription.cancel_requested', userId: c.userId }] };
  },
  async topup(c, _method, priceCents) {
    return { result: { status: 'done' }, events: [{ type: 'topup.paid', userId: c.userId, paymentId: `topup_${crypto.randomUUID()}`, amountCents: priceCents }] };
  },
  async parseWebhook(req) {
    // aceita eventos já normalizados, protegidos por segredo compartilhado (útil para testes)
    if (req.headers.get('x-mock-secret') !== Deno.env.get('BILLING_WEBHOOK_SECRET')) throw new Error('assinatura inválida');
    return (await req.json()) as BillingEvent[];
  },
};

/** Sem BILLING_GATEWAY não há cobrança: o simulado só entra quando alguém pede `mock`, porque ele aprova tudo de graça. */
export async function getGateway(): Promise<Gateway> {
  const name = Deno.env.get('BILLING_GATEWAY');
  if (name === 'stripe') return (await import('./stripe.ts')).stripeGateway;
  if (name === 'mock') return mockGateway;
  throw new GatewayError('gateway_nao_configurado');
}
