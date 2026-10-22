import { admin } from './supabase.ts';

/** Avisa (uma vez por ciclo) quando o saldo chega ao limite configurado (padrão 10). */
export async function notifyLowBalance(userId: string, email: string | undefined, balance: number) {
  const { data: cfg } = await admin.from('credit_config').select('value').eq('key', 'low_balance_threshold').maybeSingle();
  const threshold = cfg?.value ?? 10;
  if (balance > threshold) return;
  const { data: sub } = await admin.from('subscriptions').select('low_balance_notified_at').eq('user_id', userId).maybeSingle();
  if (sub?.low_balance_notified_at) return;
  await admin.from('subscriptions').update({ low_balance_notified_at: new Date().toISOString() }).eq('user_id', userId);

  const key = Deno.env.get('RESEND_API_KEY');
  if (!key || !email) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM') ?? 'Thoran <ola@thoran.com.br>',
      to: email,
      subject: `Restam ${balance} créditos no Thoran`,
      text: `Restam ${balance} créditos na sua conta. Você pode fazer uma recarga de 50 créditos ou mudar de plano em ${Deno.env.get('SITE_URL') ?? 'https://thoran.com.br'}/app/planos.\n\nO Thoran não faz recomendação de investimento.`,
    }),
  });
}
