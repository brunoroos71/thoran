#!/usr/bin/env node
/**
 * Cria (ou atualiza) produtos e preços do Thoran no Stripe a partir da tabela `plans`.
 * Rode de novo sempre que mudar um preço no banco: o lookup_key é transferido para o preço novo
 * (assinantes atuais continuam no preço antigo até mudarem de plano, padrão do Stripe).
 *
 *   STRIPE_SECRET_KEY=sk_test_… SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/stripe-setup.mjs
 *   (sem SUPABASE_*, usa os valores padrão do seed)
 */
const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error('Defina STRIPE_SECRET_KEY');
  process.exit(1);
}

const SEED = [
  { id: 'basic', name: 'Basic', monthly_cents: 5790, annual_cents: 57900, credits_per_month: 80 },
  { id: 'pro', name: 'Pro', monthly_cents: 9790, annual_cents: 97900, credits_per_month: 150 },
];

async function plans() {
  const url = process.env.SUPABASE_URL;
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !sk) return SEED;
  const r = await fetch(`${url}/rest/v1/plans?active=eq.true&select=*`, { headers: { apikey: sk, Authorization: `Bearer ${sk}` } });
  if (!r.ok) throw new Error(`Supabase: ${r.status}`);
  return r.json();
}

// API REST do Stripe com form-encoding (sem dependências)
function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === 'object' ? form(x, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(x))));
    else if (typeof v === 'object') form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}
async function stripe(method, path, body) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Stripe-Version': '2024-06-20', ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: body ? form(body) : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${path}: ${j.error?.message}`);
  return j;
}

for (const p of await plans()) {
  const productId = `thoran_${p.id}`;
  let product = await stripe('GET', `products/${productId}`).catch(() => null);
  if (!product)
    product = await stripe('POST', 'products', { id: productId, name: `Thoran ${p.name}`, description: `${p.credits_per_month} créditos por mês`, metadata: { plan: p.id } });
  else await stripe('POST', `products/${productId}`, { name: `Thoran ${p.name}`, description: `${p.credits_per_month} créditos por mês` });

  for (const [cycle, cents, interval] of [
    ['mensal', p.monthly_cents, 'month'],
    ['anual', p.annual_cents, 'year'],
  ]) {
    const lookup = `thoran_${p.id}_${cycle}`;
    const existing = (await stripe('GET', `prices?lookup_keys[]=${lookup}&active=true&limit=1`)).data[0];
    if (existing && existing.unit_amount === cents && existing.recurring?.interval === interval) {
      console.log(`= ${lookup}: ${existing.id} (sem mudança)`);
      continue;
    }
    const price = await stripe('POST', 'prices', {
      product: productId,
      currency: 'brl',
      unit_amount: cents,
      recurring: { interval },
      lookup_key: lookup,
      transfer_lookup_key: true,
      tax_behavior: 'inclusive',
      metadata: { plan: p.id, cycle },
    });
    if (existing) await stripe('POST', `prices/${existing.id}`, { active: false });
    console.log(`+ ${lookup}: ${price.id} (R$ ${(cents / 100).toFixed(2).replace('.', ',')})`);
  }
}
// Webhook: cria o endpoint do billing-webhook (o segredo whsec_ só aparece na criação)
const ref = process.env.SUPABASE_PROJECT_REF;
if (ref) {
  const url = `https://${ref}.supabase.co/functions/v1/billing-webhook`;
  const events = [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'invoice.paid',
    'invoice.payment_failed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ];
  const existing = (await stripe('GET', 'webhook_endpoints?limit=100')).data.find((w) => w.url === url && w.status === 'enabled');
  if (existing && process.env.STRIPE_WEBHOOK_SECRET) {
    await stripe('POST', `webhook_endpoints/${existing.id}`, { enabled_events: events });
    console.log(`= webhook: ${existing.id} (já configurado)`);
  } else if (existing) {
    console.log(`! webhook ${existing.id} existe, mas o segredo não está no .env.production.local. Copie o "Signing secret" no painel da Stripe (Developers › Webhooks) para STRIPE_WEBHOOK_SECRET.`);
  } else {
    const wh = await stripe('POST', 'webhook_endpoints', { url, enabled_events: events, description: 'Thoran · billing-webhook (Supabase)', api_version: '2024-06-20' });
    const { execFileSync } = await import('node:child_process');
    const { fileURLToPath } = await import('node:url');
    execFileSync('node', [fileURLToPath(new URL('./env-set.mjs', import.meta.url)), 'STRIPE_WEBHOOK_SECRET'], { input: wh.secret, stdio: ['pipe', 'inherit', 'inherit'] });
    console.log(`+ webhook: ${wh.id} → ${url}`);
  }
}
console.log('\nPronto. Recarga usa price_data com o valor de credit_config.topup_cents (não precisa de preço fixo).');
