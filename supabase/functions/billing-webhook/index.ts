// POST /billing-webhook — o gateway avisa: pagamento confirmado, falhou, assinatura cancelada…
// Público (sem JWT); a autenticidade vem da assinatura do gateway (Stripe-Signature), validada em parseWebhook.
import { admin } from '../_shared/supabase.ts';
import { cors, json } from '../_shared/http.ts';
import { getGateway } from '../_shared/billing/gateway.ts';
import { applyEvent } from '../_shared/billing/handlers.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const gw = await getGateway().catch(() => null);
  if (!gw) return json({ error: 'gateway_nao_configurado' }, 503); // BILLING_GATEWAY não definido: cobrança desligada
  // id e tipo do evento original, para registro (o corpo só pode ser lido uma vez)
  const raw = req.clone();
  let events;
  try {
    events = await gw.parseWebhook(req);
  } catch (e) {
    console.warn('webhook rejeitado', e);
    return json({ error: 'assinatura' }, 400);
  }
  const meta = await raw.json().catch(() => ({}));
  const eventId = typeof meta?.id === 'string' ? meta.id : null;
  if (eventId) {
    const { data: seen } = await admin.from('billing_events').select('processed').eq('id', eventId).maybeSingle();
    if (seen?.processed) return json({ ok: true, duplicate: true });
    await admin.from('billing_events').upsert({ id: eventId, gateway: gw.name, type: meta.type ?? 'normalizado' });
  }
  for (const e of events) {
    try {
      await applyEvent(e);
    } catch (err) {
      console.error('webhook evento', e.type, err);
      if (eventId) await admin.from('billing_events').update({ error: String(err) }).eq('id', eventId);
      return json({ error: 'retry' }, 500); // o Stripe reenvia; os handlers são idempotentes
    }
  }
  if (eventId) await admin.from('billing_events').update({ processed: true, error: null }).eq('id', eventId);
  return json({ ok: true });
});
