// node scripts/test-stripe-map.mts — testa a tradução de eventos do Stripe (sem rede)
import assert from 'node:assert/strict';
import { mapStripeEvent, type StripeSubscription } from '../supabase/functions/_shared/billing/stripe-map.ts';

const sub = (lookup: string, extra: Partial<StripeSubscription> = {}): StripeSubscription => ({
  id: 'sub_1',
  customer: 'cus_1',
  status: 'active',
  cancel_at_period_end: false,
  current_period_start: 1_790_000_000,
  current_period_end: 1_792_600_000,
  metadata: { user_id: 'u1' },
  items: { data: [{ id: 'si_1', price: { id: 'price_1', lookup_key: lookup, unit_amount: 4990, recurring: { interval: 'month' } } }] },
  ...extra,
});
const get = (s: StripeSubscription) => async () => s;
const ev = (type: string, object: Record<string, unknown>, previous_attributes?: Record<string, unknown>) => ({ id: 'evt_1', type, data: { object, previous_attributes } });

// assinatura nova no cartão
let r = await mapStripeEvent(ev('invoice.paid', { id: 'in_1', subscription: 'sub_1', billing_reason: 'subscription_create', amount_paid: 4990 }), get(sub('thoran_pro_mensal')));
assert.equal(r[0].type, 'subscription.activated');
assert.deepEqual([r[0].type === 'subscription.activated' && r[0].plan, r[0].type === 'subscription.activated' && r[0].cycle], ['pro', 'mensal']);

// renovação
r = await mapStripeEvent(ev('invoice.paid', { id: 'in_2', subscription: 'sub_1', billing_reason: 'subscription_cycle', amount_paid: 4990 }), get(sub('thoran_pro_mensal')));
assert.equal(r[0].type, 'invoice.paid');

// proração de upgrade → sync
r = await mapStripeEvent(ev('invoice.paid', { id: 'in_3', subscription: 'sub_1', billing_reason: 'subscription_update' }), get(sub('thoran_pro_anual')));
assert.equal(r[0].type, 'subscription.synced');

// falha de pagamento
r = await mapStripeEvent(ev('invoice.payment_failed', { id: 'in_4', subscription: 'sub_1' }), get(sub('thoran_basic_mensal')));
assert.deepEqual(r, [{ type: 'payment.failed', userId: 'u1', paymentId: 'in_4' }]);

// recarga paga (cartão) e Pix ainda pendente
r = await mapStripeEvent(ev('checkout.session.completed', { id: 'cs_1', payment_status: 'paid', client_reference_id: 'u1', payment_intent: 'pi_1', amount_total: 1990, metadata: { kind: 'topup' } }), get(sub('x')));
assert.deepEqual(r, [{ type: 'topup.paid', userId: 'u1', paymentId: 'pi_1', amountCents: 1990 }]);
r = await mapStripeEvent(ev('checkout.session.completed', { id: 'cs_2', payment_status: 'unpaid', client_reference_id: 'u1', metadata: { kind: 'topup' } }), get(sub('x')));
assert.deepEqual(r, []);
r = await mapStripeEvent(ev('checkout.session.async_payment_succeeded', { id: 'cs_2', payment_status: 'paid', client_reference_id: 'u1', payment_intent: 'pi_2', amount_total: 1990, metadata: { kind: 'topup' } }), get(sub('x')));
assert.equal(r[0].type, 'topup.paid');

// anual à vista no Pix
r = await mapStripeEvent(ev('checkout.session.async_payment_succeeded', { id: 'cs_3', payment_status: 'paid', client_reference_id: 'u1', payment_intent: 'pi_3', customer: 'cus_1', amount_total: 49900, metadata: { kind: 'annual_pix', plan: 'pro' } }), get(sub('x')));
assert.equal(r[0].type, 'subscription.activated');
assert.equal(r[0].type === 'subscription.activated' && r[0].autoRenew, false);

// cancelamento pedido / desistência / troca de plano no portal
r = await mapStripeEvent(ev('customer.subscription.updated', sub('thoran_basic_mensal', { cancel_at_period_end: true }) as never, { cancel_at_period_end: false }), get(sub('x')));
assert.deepEqual(r, [{ type: 'subscription.cancel_requested', userId: 'u1' }]);
r = await mapStripeEvent(ev('customer.subscription.updated', sub('thoran_basic_mensal') as never, { cancel_at_period_end: true }), get(sub('x')));
assert.deepEqual(r, [{ type: 'subscription.resumed', userId: 'u1' }]);
r = await mapStripeEvent(ev('customer.subscription.updated', sub('thoran_basic_anual') as never, { items: {} }), get(sub('x')));
assert.equal(r[0].type, 'subscription.synced');

// fim
r = await mapStripeEvent(ev('customer.subscription.deleted', sub('thoran_basic_mensal') as never), get(sub('x')));
assert.deepEqual(r, [{ type: 'subscription.ended', userId: 'u1' }]);

// evento sem user_id ou desconhecido: ignora
r = await mapStripeEvent(ev('invoice.paid', { id: 'in_9', subscription: 'sub_1', billing_reason: 'subscription_cycle' }), get(sub('thoran_pro_mensal', { metadata: {} })));
assert.deepEqual(r, []);
r = await mapStripeEvent(ev('charge.refunded', {}), get(sub('x')));
assert.deepEqual(r, []);

console.log('stripe-map: 14 cenários ok');
