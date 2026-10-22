// POST /billing — ações do usuário logado: subscribe | change | cancel | topup | portal
import { admin, userFromRequest } from '../_shared/supabase.ts';
import { cors, json } from '../_shared/http.ts';
import { getGateway, GatewayError, type ChangeKind, type GatewayResponse } from '../_shared/billing/gateway.ts';
import { applyEvent } from '../_shared/billing/handlers.ts';
import type { Cycle, PlanId } from '../_shared/billing/events.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await userFromRequest(req);
  if (!user) return json({ error: 'auth' }, 401);
  const body = await req.json().catch(() => ({}));
  const gw = await getGateway().catch(() => null);
  if (!gw) return json({ error: 'gateway_nao_configurado' }, 503); // BILLING_GATEWAY não definido: cobrança desligada

  const { data: sub } = await admin.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
  const customer = { userId: user.id, email: user.email ?? '', gatewayCustomerId: sub?.gateway_customer_id, gatewaySubscriptionId: sub?.gateway_subscription_id };
  const plan = body.plan as PlanId;
  const cycle = (body.cycle === 'anual' ? 'anual' : 'mensal') as Cycle;
  const method = body.method === 'pix' ? 'pix' : 'card';

  const price = async (id: PlanId, c: Cycle) => {
    const { data } = await admin.from('plans').select('monthly_cents, annual_cents, credits_per_month').eq('id', id).eq('active', true).single();
    return { cents: c === 'anual' ? data!.annual_cents : data!.monthly_cents, credits: data!.credits_per_month };
  };
  const cfg = async (key: string) => (await admin.from('credit_config').select('value').eq('key', key).single()).data!.value as number;

  // aplica eventos síncronos e guarda o cliente criado no gateway
  const finish = async (r: GatewayResponse) => {
    if (r.customerId) await admin.from('subscriptions').update({ gateway_customer_id: r.customerId, gateway: gw.name }).eq('user_id', user.id);
    for (const e of r.events) await applyEvent(e);
    return json(r.result);
  };

  try {
    if (body.action === 'subscribe') {
      if (!['basic', 'pro'].includes(plan)) return json({ error: 'plano' }, 400);
      if (sub?.status === 'ativa' && sub.gateway_subscription_id && !sub.cancel_at_period_end) return json({ error: 'ja_assinante' }, 409);
      return await finish(await gw.subscribe(customer, plan, cycle, method, (await price(plan, cycle)).cents));
    }

    if (body.action === 'change') {
      if (!sub?.plan_id) return json({ error: 'sem_plano' }, 400);
      const cur = await price(sub.plan_id, sub.cycle);
      const next = await price(plan, cycle);
      const kind: ChangeKind = cycle !== sub.cycle ? 'cycle' : next.credits > cur.credits ? 'upgrade' : 'downgrade';
      const r = await gw.changePlan(customer, plan, cycle, kind);
      for (const e of r.events) await applyEvent(e);

      if (r.applies === 'now') {
        // vale na hora; se o plano novo tem mais créditos, entrega a diferença do mês
        await admin.from('subscriptions').update({ plan_id: plan, cycle, pending_plan_id: null, pending_cycle: null }).eq('user_id', user.id);
        if (next.credits > cur.credits)
          await admin.from('credit_ledger').insert({ user_id: user.id, amount: next.credits - cur.credits, kind: 'renovacao', bucket: 'plano', reference: `upgrade_${crypto.randomUUID()}` });
        return json(r.result);
      }
      await admin
        .from('subscriptions')
        .update({ pending_plan_id: plan === sub.plan_id ? null : plan, pending_cycle: cycle === sub.cycle ? null : cycle })
        .eq('user_id', user.id);
      return json(r.result.status === 'scheduled' ? r.result : { status: 'scheduled', at: sub.period_end });
    }

    if (body.action === 'cancel') return await finish(await gw.cancel(customer));

    if (body.action === 'topup') {
      // recarga é para assinantes ativos
      if (!sub || sub.status !== 'ativa' || !sub.plan_id) return json({ error: 'assinatura_necessaria' }, 400);
      return await finish(await gw.topup(customer, method, await cfg('topup_cents'), await cfg('topup_credits')));
    }

    if (body.action === 'portal') {
      if (!gw.portal) return json({ error: 'indisponivel' }, 400);
      return await finish(await gw.portal(customer));
    }
    return json({ error: 'acao' }, 400);
  } catch (e) {
    console.error('billing', e);
    if (e instanceof GatewayError) return json({ error: e.code }, 400);
    return json({ error: 'gateway' }, 502);
  }
});
