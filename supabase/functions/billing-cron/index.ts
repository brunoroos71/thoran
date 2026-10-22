// Rotina diária (agende com pg_cron ou Supabase Scheduled Functions, ex.: 03:00 BRT).
//  1) planos anuais: lança os créditos do mês quando next_credit_at venceu
//  2) carência vencida (3 dias após falha de pagamento): assinatura fica inadimplente
//  3) assinaturas canceladas (ou anual Pix sem renovação) cujo período acabou: créditos expiram
import { admin } from '../_shared/supabase.ts';
import { json } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.headers.get('Authorization') !== `Bearer ${Deno.env.get('CRON_SECRET')}`) return json({ error: 'auth' }, 401);
  const now = new Date().toISOString();
  const out = { annualGrants: 0, delinquent: 0, ended: 0 };

  const { data: annual } = await admin.from('subscriptions').select('user_id, next_credit_at').eq('cycle', 'anual').eq('status', 'ativa').lte('next_credit_at', now);
  for (const s of annual ?? []) {
    await admin.rpc('grant_monthly_credits', { p_user: s.user_id, p_ref: `anual_${s.user_id}_${s.next_credit_at.slice(0, 10)}` });
    out.annualGrants++;
  }

  const { data: late } = await admin.from('subscriptions').select('user_id').eq('status', 'ativa').lte('grace_until', now);
  for (const s of late ?? []) {
    await admin.from('subscriptions').update({ status: 'inadimplente', updated_at: now }).eq('user_id', s.user_id);
    out.delinquent++;
  }

  // anual pago no Pix (não renova sozinho): no fim do período, encerra como uma cancelada
  // TODO: e-mail de lembrete 7 dias antes de period_end com link de renovação
  await admin.from('subscriptions').update({ status: 'cancelada', cancel_at_period_end: true, updated_at: now }).eq('status', 'ativa').eq('auto_renew', false).lte('period_end', now);

  const { data: ended } = await admin.from('subscriptions').select('user_id').eq('status', 'cancelada').eq('cancel_at_period_end', true).lte('period_end', now);
  for (const s of ended ?? []) {
    await admin.from('subscriptions').update({ cancel_at_period_end: false, updated_at: now }).eq('user_id', s.user_id);
    await admin.rpc('expire_canceled', { p_user: s.user_id });
    out.ended++;
  }
  return json(out);
});
