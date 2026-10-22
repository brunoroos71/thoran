// GET /admin-stats?view=overview | accounts&q=&limit=&offset=
// Painel administrativo: só para contas com profiles.is_admin = true. Lê via funções SQL de relatório (service role).
import { admin, userFromRequest } from '../_shared/supabase.ts';
import { cors, json } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await userFromRequest(req);
  if (!user) return json({ error: 'auth' }, 401);
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) return json({ error: 'forbidden' }, 403);

  const u = new URL(req.url);
  const view = u.searchParams.get('view') ?? 'overview';
  if (view === 'accounts') {
    const q = (u.searchParams.get('q') ?? '').trim().slice(0, 100) || null;
    const limit = Math.min(500, Math.max(1, Number(u.searchParams.get('limit') ?? 50)));
    const offset = Math.max(0, Number(u.searchParams.get('offset') ?? 0));
    const { data, error } = await admin.rpc('admin_accounts', { p_search: q, p_limit: limit, p_offset: offset });
    if (error) return json({ error: 'generic' }, 500);
    return json(data);
  }
  const { data, error } = await admin.rpc('admin_dashboard');
  if (error) return json({ error: 'generic' }, 500);
  return json(data);
});
