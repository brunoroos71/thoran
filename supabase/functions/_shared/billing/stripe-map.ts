/**
 * Tradução de eventos do Stripe para BillingEvent. Sem dependência de Deno nem do SDK,
 * para poder ser testada isoladamente (scripts/test-stripe-map.mts).
 * API do Stripe fixada em 2024-06-20 (current_period_* na assinatura).
 */
import type { BillingEvent, Cycle, PlanId } from './events.ts';

/* Subconjunto dos objetos do Stripe que usamos */
export interface StripePrice {
  id: string;
  lookup_key: string | null;
  unit_amount: number | null;
  recurring: { interval: 'month' | 'year' } | null;
}
export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_start: number;
  current_period_end: number;
  metadata: Record<string, string>;
  items: { data: { id: string; price: StripePrice }[] };
}
export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, any>; previous_attributes?: Record<string, any> };
}

export const lookupKey = (plan: PlanId, cycle: Cycle) => `thoran_${plan}_${cycle}`;

export function planFromPrice(price: StripePrice): { plan: PlanId; cycle: Cycle } | null {
  const m = /^thoran_(basic|pro)_(mensal|anual)$/.exec(price.lookup_key ?? '');
  if (m) return { plan: m[1] as PlanId, cycle: m[2] as Cycle };
  return null;
}

const iso = (s: number) => new Date(s * 1000).toISOString();

export async function mapStripeEvent(evt: StripeEvent, getSubscription: (id: string) => Promise<StripeSubscription>): Promise<BillingEvent[]> {
  const o = evt.data.object;

  switch (evt.type) {
    // Checkout pago: recarga (cartão ou Pix) ou plano anual pago à vista no Pix.
    // Assinaturas no cartão são tratadas em invoice.paid.
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      if (o.payment_status !== 'paid') return []; // Pix ainda não pago: espera async_payment_succeeded
      const userId = o.client_reference_id ?? o.metadata?.user_id;
      if (!userId) return [];
      const paymentId = (o.payment_intent as string) ?? o.id;
      if (o.metadata?.kind === 'topup') return [{ type: 'topup.paid', userId, paymentId, amountCents: o.amount_total ?? 0 }];
      if (o.metadata?.kind === 'annual_pix') {
        const start = new Date();
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        return [
          {
            type: 'subscription.activated',
            userId,
            plan: o.metadata.plan as PlanId,
            cycle: 'anual',
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
            gatewaySubscriptionId: null, // Pix não renova sozinho: o cron avisa e encerra no fim do período
            gatewayCustomerId: (o.customer as string) ?? null,
            paymentId,
            amountCents: o.amount_total ?? 0,
            autoRenew: false,
          },
        ];
      }
      return [];
    }

    case 'invoice.paid': {
      if (!o.subscription) return [];
      const sub = await getSubscription(o.subscription as string);
      const userId = sub.metadata.user_id;
      const pc = planFromPrice(sub.items.data[0].price);
      if (!userId || !pc) return [];
      const base = { userId, periodStart: iso(sub.current_period_start), periodEnd: iso(sub.current_period_end), paymentId: o.id as string, amountCents: o.amount_paid ?? 0 };
      if (o.billing_reason === 'subscription_create')
        return [{ type: 'subscription.activated', ...base, plan: pc.plan, cycle: pc.cycle, gatewaySubscriptionId: sub.id, gatewayCustomerId: sub.customer, autoRenew: true }];
      if (o.billing_reason === 'subscription_cycle') return [{ type: 'invoice.paid', ...base }];
      // subscription_update (proração de upgrade/troca de ciclo): sincroniza período e plano
      return [{ type: 'subscription.synced', userId, plan: pc.plan, cycle: pc.cycle, periodStart: base.periodStart, periodEnd: base.periodEnd }];
    }

    case 'invoice.payment_failed': {
      if (!o.subscription) return [];
      const sub = await getSubscription(o.subscription as string);
      return sub.metadata.user_id ? [{ type: 'payment.failed', userId: sub.metadata.user_id, paymentId: o.id as string }] : [];
    }

    case 'customer.subscription.updated': {
      const sub = o as unknown as StripeSubscription;
      const userId = sub.metadata?.user_id;
      if (!userId) return [];
      const prev = evt.data.previous_attributes ?? {};
      const out: BillingEvent[] = [];
      if ('cancel_at_period_end' in prev) out.push({ type: sub.cancel_at_period_end ? 'subscription.cancel_requested' : 'subscription.resumed', userId });
      if ('items' in prev) {
        const pc = planFromPrice(sub.items.data[0].price);
        if (pc) out.push({ type: 'subscription.synced', userId, plan: pc.plan, cycle: pc.cycle, periodStart: iso(sub.current_period_start), periodEnd: iso(sub.current_period_end) });
      }
      return out;
    }

    case 'customer.subscription.deleted': {
      const userId = (o as unknown as StripeSubscription).metadata?.user_id;
      return userId ? [{ type: 'subscription.ended', userId }] : [];
    }

    default:
      return [];
  }
}
