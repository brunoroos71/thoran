import { admin } from '../supabase.ts';
import type { BillingEvent } from './events.ts';
import { recordInvoice } from './invoice.ts';

const GRACE_DAYS = async () => (await admin.from('credit_config').select('value').eq('key', 'grace_days').maybeSingle()).data?.value ?? 3;

/**
 * Aplica um evento de cobrança. Idempotente: webhooks podem chegar repetidos ou fora de ordem,
 * e os lançamentos usam a referência do pagamento (índice único em credit_ledger).
 */
export async function applyEvent(e: BillingEvent) {
  switch (e.type) {
    case 'subscription.activated': {
      await admin.from('subscriptions').upsert({
        user_id: e.userId,
        plan_id: e.plan,
        cycle: e.cycle,
        status: 'ativa',
        period_start: e.periodStart,
        period_end: e.periodEnd,
        next_credit_at: e.cycle === 'anual' ? e.periodStart : null,
        cancel_at_period_end: false,
        grace_until: null,
        pending_plan_id: null,
        pending_cycle: null,
        gateway_subscription_id: e.gatewaySubscriptionId,
        ...(e.gatewayCustomerId ? { gateway_customer_id: e.gatewayCustomerId } : {}),
        auto_renew: e.autoRenew,
        updated_at: new Date().toISOString(),
      });
      await admin.rpc('grant_monthly_credits', { p_user: e.userId, p_ref: e.paymentId });
      await recordInvoice(e.userId, e.amountCents, `Assinatura Thoran ${e.plan} (${e.cycle})`, e.paymentId);
      return;
    }
    case 'invoice.paid': {
      // renovação: anual só renova o período; os créditos do anual entram mês a mês pelo cron
      const { data: sub } = await admin.from('subscriptions').select('cycle').eq('user_id', e.userId).maybeSingle();
      await admin.from('subscriptions').update({ status: 'ativa', period_start: e.periodStart, period_end: e.periodEnd, grace_until: null, updated_at: new Date().toISOString() }).eq('user_id', e.userId);
      if (sub?.cycle !== 'anual') await admin.rpc('grant_monthly_credits', { p_user: e.userId, p_ref: e.paymentId });
      await recordInvoice(e.userId, e.amountCents, 'Renovação Thoran', e.paymentId);
      return;
    }
    case 'topup.paid': {
      const { data: cfg } = await admin.from('credit_config').select('value').eq('key', 'topup_credits').maybeSingle();
      // insert, não upsert: o índice único do ledger é parcial, e ON CONFLICT (colunas) sem o WHERE dele dá 42P10.
      // Pagamento repetido (webhook reenviado) bate no índice e volta 23505: aí não lança de novo.
      const { error } = await admin
        .from('credit_ledger')
        .insert({ user_id: e.userId, amount: cfg?.value ?? 50, kind: 'recarga', bucket: 'recarga', reference: e.paymentId });
      if (error && error.code !== '23505') throw error;
      await recordInvoice(e.userId, e.amountCents, 'Recarga de créditos Thoran', e.paymentId);
      return;
    }
    case 'payment.failed': {
      // 3 dias de carência com aviso; depois o cron marca inadimplente e o consumo bloqueia
      const until = new Date(Date.now() + (await GRACE_DAYS()) * 864e5).toISOString();
      await admin.from('subscriptions').update({ grace_until: until, updated_at: new Date().toISOString() }).eq('user_id', e.userId).is('grace_until', null);
      // TODO: e-mail "pagamento não aprovado" (Resend), como em _shared/credits.ts
      return;
    }
    case 'subscription.resumed':
      await admin.from('subscriptions').update({ cancel_at_period_end: false, status: 'ativa', updated_at: new Date().toISOString() }).eq('user_id', e.userId);
      return;
    case 'subscription.synced': {
      // mudança confirmada pelo gateway. Downgrade agendado continua pendente até a renovação.
      const { data: sub } = await admin.from('subscriptions').select('pending_plan_id').eq('user_id', e.userId).maybeSingle();
      const patch: Record<string, unknown> = { cycle: e.cycle, period_start: e.periodStart, period_end: e.periodEnd, updated_at: new Date().toISOString() };
      if (sub?.pending_plan_id !== e.plan) patch.plan_id = e.plan;
      if (e.cycle === 'anual') patch.next_credit_at = e.periodStart;
      await admin.from('subscriptions').update(patch).eq('user_id', e.userId);
      return;
    }
    case 'subscription.cancel_requested':
      await admin.from('subscriptions').update({ cancel_at_period_end: true, status: 'cancelada', updated_at: new Date().toISOString() }).eq('user_id', e.userId);
      return;
    case 'subscription.ended':
      await admin.from('subscriptions').update({ status: 'cancelada', cancel_at_period_end: false, updated_at: new Date().toISOString() }).eq('user_id', e.userId);
      await admin.rpc('expire_canceled', { p_user: e.userId });
      return;
  }
}
