// Gateway Stripe (cartão para assinaturas; cartão e Pix para recarga e anual à vista).
// Pix no Stripe é só pagamento único: não existe assinatura mensal recorrente em Pix.
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno';
import { ChangeKind, Customer, Gateway, GatewayError } from './gateway.ts';
import { lookupKey, mapStripeEvent, type StripeSubscription } from './stripe-map.ts';
import type { Cycle, PlanId } from './events.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const crypto = Stripe.createSubtleCryptoProvider();
const SITE = Deno.env.get('SITE_URL') ?? 'https://thoran.com.br';

const priceCache = new Map<string, string>();
/** Preços criados por scripts/stripe-setup.mjs com lookup_key thoran_<plano>_<ciclo>. */
async function priceId(plan: PlanId, cycle: Cycle) {
  const key = lookupKey(plan, cycle);
  if (priceCache.has(key)) return priceCache.get(key)!;
  const { data } = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  if (!data[0]) throw new GatewayError(`preco_nao_configurado:${key}`);
  priceCache.set(key, data[0].id);
  return data[0].id;
}

async function ensureCustomer(c: Customer): Promise<{ id: string; created: boolean }> {
  if (c.gatewayCustomerId) return { id: c.gatewayCustomerId, created: false };
  const found = await stripe.customers.search({ query: `metadata['user_id']:'${c.userId}'`, limit: 1 }).catch(() => ({ data: [] as Stripe.Customer[] }));
  if (found.data[0]) return { id: found.data[0].id, created: true };
  const cus = await stripe.customers.create({ email: c.email, metadata: { user_id: c.userId }, preferred_locales: ['pt-BR'] });
  return { id: cus.id, created: true };
}

const urls = (q: string) => ({ success_url: `${SITE}/app/planos?checkout=ok&${q}`, cancel_url: `${SITE}/app/planos?checkout=cancelado` });

export const stripeGateway: Gateway = {
  name: 'stripe',

  async subscribe(c, plan, cycle, method, priceCents) {
    const cus = await ensureCustomer(c);
    const meta = { user_id: c.userId, plan, cycle };

    if (method === 'pix') {
      // Pix: só o anual, pago à vista. Mensal recorrente em Pix não existe no Stripe.
      if (cycle !== 'anual') throw new GatewayError('pix_somente_anual');
      const s = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: cus.id,
        client_reference_id: c.userId,
        payment_method_types: ['pix'],
        payment_method_options: { pix: { expires_after_seconds: 3600 } },
        line_items: [{ quantity: 1, price_data: { currency: 'brl', unit_amount: priceCents, product_data: { name: `Thoran ${plan === 'pro' ? 'Pro' : 'Basic'} · anual` } } }],
        metadata: { ...meta, kind: 'annual_pix' },
        locale: 'pt-BR',
        ...urls('tipo=assinatura'),
      });
      return { result: { status: 'redirect', url: s.url! }, events: [], customerId: cus.created ? cus.id : undefined };
    }

    const s = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: cus.id,
      client_reference_id: c.userId,
      payment_method_types: ['card'],
      line_items: [{ price: await priceId(plan, cycle), quantity: 1 }],
      subscription_data: { metadata: meta },
      metadata: { ...meta, kind: 'subscription' },
      allow_promotion_codes: true,
      locale: 'pt-BR',
      ...urls('tipo=assinatura'),
    });
    return { result: { status: 'redirect', url: s.url! }, events: [], customerId: cus.created ? cus.id : undefined };
  },

  async changePlan(c, plan, cycle, kind: ChangeKind) {
    if (!c.gatewaySubscriptionId) throw new GatewayError('sem_assinatura_recorrente'); // ex.: anual pago no Pix
    const sub = await stripe.subscriptions.retrieve(c.gatewaySubscriptionId);
    const item = sub.items.data[0];
    const price = await priceId(plan, cycle);

    if (kind === 'downgrade') {
      // Próxima fatura já sai no preço novo; os créditos mudam na renovação (pending_plan_id).
      await stripe.subscriptions.update(sub.id, { items: [{ id: item.id, price }], proration_behavior: 'none' });
      return { result: { status: 'scheduled', at: new Date(sub.current_period_end * 1000).toISOString() }, events: [], applies: 'next_renewal' };
    }
    // Upgrade e troca de ciclo: valem na hora, cobrando a diferença proporcional agora.
    await stripe.subscriptions.update(sub.id, { items: [{ id: item.id, price }], proration_behavior: 'always_invoice', payment_behavior: 'error_if_incomplete' });
    return { result: { status: 'done' }, events: [], applies: 'now' };
  },

  async cancel(c) {
    if (!c.gatewaySubscriptionId) return { result: { status: 'done' }, events: [{ type: 'subscription.cancel_requested', userId: c.userId }] };
    await stripe.subscriptions.update(c.gatewaySubscriptionId, { cancel_at_period_end: true });
    // o webhook customer.subscription.updated confirma; aplicamos já para a interface refletir
    return { result: { status: 'done' }, events: [{ type: 'subscription.cancel_requested', userId: c.userId }] };
  },

  async topup(c, method, priceCents, credits) {
    const cus = await ensureCustomer(c);
    const s = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: cus.id,
      client_reference_id: c.userId,
      payment_method_types: method === 'pix' ? ['pix'] : ['card'],
      ...(method === 'pix' ? { payment_method_options: { pix: { expires_after_seconds: 3600 } } } : {}),
      line_items: [{ quantity: 1, price_data: { currency: 'brl', unit_amount: priceCents, product_data: { name: `Recarga de ${credits} créditos Thoran` } } }],
      metadata: { user_id: c.userId, kind: 'topup' },
      payment_intent_data: { metadata: { user_id: c.userId, kind: 'topup' } },
      locale: 'pt-BR',
      ...urls('tipo=recarga'),
    });
    return { result: { status: 'redirect', url: s.url! }, events: [], customerId: cus.created ? cus.id : undefined };
  },

  async portal(c) {
    if (!c.gatewayCustomerId) throw new GatewayError('sem_cliente');
    const s = await stripe.billingPortal.sessions.create({ customer: c.gatewayCustomerId, return_url: `${SITE}/app/planos`, locale: 'pt-BR' });
    return { result: { status: 'redirect', url: s.url }, events: [] };
  },

  async parseWebhook(req) {
    const sig = req.headers.get('stripe-signature');
    if (!sig) throw new Error('sem assinatura');
    const body = await req.text();
    const evt = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, crypto);
    return mapStripeEvent(evt as never, async (id) => (await stripe.subscriptions.retrieve(id)) as unknown as StripeSubscription);
  },
};
