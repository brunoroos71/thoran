import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

/** A chave secreta nova (SUPABASE_SECRET_KEYS, JSON com a "default") ou, sem ela, a service role antiga. */
function secretKey(): string {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (raw) {
    try {
      const k = (JSON.parse(raw) as Record<string, string>).default;
      if (k) return k;
    } catch {
      // não é JSON: segue para a antiga
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
}

/** Cliente com service role: ignora RLS. Só usar dentro das Edge Functions. */
export const admin = createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), {
  auth: { persistSession: false },
});

/** Valida o JWT do usuário no Auth e devolve o user (ou null). As funções com login dependem disto, não do gateway. */
export async function userFromRequest(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}
