// GET /admin-waitlist — lista de espera para o painel. Só profiles.is_admin = true.
import { admin, userFromRequest } from '../_shared/supabase.ts';
import { cors, json } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await userFromRequest(req);
  if (!user) return json({ error: 'auth' }, 401);
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) return json({ error: 'forbidden' }, 403);

  const { data, error } = await admin
    .from('waitlist')
    .select('email, created_at, locale, utm_source, utm_medium, utm_campaign, referrer, consent_at')
    .order('created_at', { ascending: false })
    .limit(50000);
  if (error) return json({ error: 'generic' }, 500);
  return json({ rows: data });
});
