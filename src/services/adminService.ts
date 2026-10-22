import { hasSupabase } from '@/lib/env';
import { functionsUrl, supabase } from '@/lib/supabase';

export interface WaitlistRow {
  email: string;
  created_at: string;
  locale: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  consent_at: string;
}

/** Lê via Edge Function admin-waitlist (verifica is_admin no servidor). */
export async function fetchWaitlist(): Promise<{ rows: WaitlistRow[]; demo: boolean } | { error: 'auth' | 'forbidden' | 'generic' }> {
  if (!hasSupabase || !supabase) return { rows: demoRows(), demo: true };
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { error: 'auth' };
  const res = await fetch(functionsUrl('admin-waitlist'), { headers: { Authorization: `Bearer ${data.session.access_token}` } });
  if (res.status === 401) return { error: 'auth' };
  if (res.status === 403) return { error: 'forbidden' };
  if (!res.ok) return { error: 'generic' };
  return { rows: (await res.json()).rows, demo: false };
}

export function toCsv(rows: WaitlistRow[]) {
  const cols: (keyof WaitlistRow)[] = ['email', 'created_at', 'locale', 'utm_source', 'utm_medium', 'utm_campaign', 'referrer', 'consent_at'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

function demoRows(): WaitlistRow[] {
  const src = ['instagram', 'youtube', null, 'tiktok', 'newsletter', null, 'instagram'];
  const camp = ['lancamento', 'raio', null, 'lancamento'];
  return Array.from({ length: 184 }, (_, i) => {
    const d = new Date(Date.now() - Math.floor(Math.pow(i / 184, 0.7) * 21) * 864e5 - i * 3.7e5);
    const s = src[i % src.length];
    return {
      email: `pessoa${i + 1}@exemplo.com`,
      created_at: d.toISOString(),
      locale: 'pt-BR',
      utm_source: s,
      utm_medium: s ? 'social' : null,
      utm_campaign: s ? camp[i % camp.length] : null,
      referrer: null,
      consent_at: d.toISOString(),
    };
  });
}
