import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

/** Cliente com service role: ignora RLS. Só usar dentro das Edge Functions. */
export const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

/** Valida o JWT do usuário e devolve o user (ou null). */
export async function userFromRequest(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}
