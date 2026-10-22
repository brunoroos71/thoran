// POST /waitlist-join  — único caminho de escrita na tabela waitlist.
import { admin } from '../_shared/supabase.ts';
import { clientIp, cors, json, sha256 } from '../_shared/http.ts';
import { waitlistEmail } from '../_shared/emailTemplate.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_MAX = 5; // envios
const RATE_WINDOW_MIN = 10; // por IP a cada 10 minutos
const clip = (v: unknown, n = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'generic' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'generic' }, 400);
  }

  // Honeypot: robô preencheu → finge sucesso e não grava nada
  if (clip(body.website)) return json({ ok: true });

  const email = String(body.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'invalid' }, 400);
  if (body.consent !== true) return json({ error: 'consent' }, 400);

  // Limite por IP
  const ipHash = await sha256(clientIp(req) + (Deno.env.get('IP_SALT') ?? ''));
  const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
  const { count } = await admin
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('bucket', 'waitlist')
    .eq('ip_hash', ipHash)
    .gte('created_at', since);
  if ((count ?? 0) >= RATE_MAX) return json({ error: 'rate' }, 429);
  await admin.from('rate_limits').insert({ bucket: 'waitlist', ip_hash: ipHash });

  const { error } = await admin.from('waitlist').insert({
    email,
    locale: clip(body.locale, 10) ?? 'pt-BR',
    utm_source: clip(body.utm_source),
    utm_medium: clip(body.utm_medium),
    utm_campaign: clip(body.utm_campaign),
    referrer: clip(body.referrer, 500),
    consent_at: new Date().toISOString(),
  });
  if (error?.code === '23505') return json({ error: 'duplicate' }, 409);
  if (error) {
    console.error('waitlist insert', error);
    return json({ error: 'generic' }, 500);
  }

  // E-mail de confirmação (Resend). Falha no e-mail não desfaz a inscrição.
  const key = Deno.env.get('RESEND_API_KEY');
  if (key) {
    const { subject, html, text } = waitlistEmail();
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM') ?? 'Thoran <ola@thoran.com.br>', to: email, subject, html, text }),
    }).catch((e) => console.error('resend', e));
  }

  return json({ ok: true });
});
