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

/* ───────────── Painel administrativo (/admin) ───────────── */

export interface DailyPoint {
  day: string;
  n?: number;
  cents?: number;
}

export interface AdminDashboard {
  generated_at: string;
  accounts: { total: number; today: number; d7: number; d30: number; daily: DailyPoint[] };
  subscriptions: { paying: number; by_plan: { plan: string; cycle: string; n: number }[]; trial: number; conversion: number; mrr_cents: number };
  revenue: { month_cents: number; d30_cents: number; total_cents: number; topups_month: number; daily: DailyPoint[] };
  usage: {
    analyses_d30: number;
    questions_d30: number;
    refunds_d30: number;
    credits_d30: number;
    active_users_d7: number;
    daily: DailyPoint[];
    agent_calls_d30: number;
    agent_errors_d30: number;
  };
  health: {
    grace: number;
    delinquent: number;
    cancel_scheduled: number;
    webhook_errors: number;
    recent_events: { id: string; type: string; processed: boolean; error: string | null; received_at: string }[];
  };
}

export interface AdminAccount {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  plan: string | null;
  cycle: string | null;
  status: string | null;
  period_end: string | null;
  cancel_at_period_end: boolean | null;
  balance: number;
  last_use: string | null;
  used_d30: number;
  paid_cents: number;
  is_admin: boolean;
}

type AdminError = { error: 'auth' | 'forbidden' | 'generic' };

async function adminGet<T>(qs: string): Promise<T | AdminError> {
  if (!supabase) return { error: 'generic' };
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { error: 'auth' };
  const res = await fetch(`${functionsUrl('admin-stats')}?${qs}`, { headers: { Authorization: `Bearer ${data.session.access_token}` } });
  if (res.status === 401) return { error: 'auth' };
  if (res.status === 403) return { error: 'forbidden' };
  if (!res.ok) return { error: 'generic' };
  return (await res.json()) as T;
}

export const fetchDashboard = () => (hasSupabase ? adminGet<AdminDashboard>('view=overview') : Promise.resolve(demoDashboard()));
export const fetchAccounts = (q: string, offset = 0, limit = 50) =>
  hasSupabase
    ? adminGet<{ total: number; rows: AdminAccount[] }>(`view=accounts&q=${encodeURIComponent(q)}&offset=${offset}&limit=${limit}`)
    : Promise.resolve({ total: 0, rows: [] as AdminAccount[] });

export function accountsCsv(rows: AdminAccount[]) {
  const cols: (keyof AdminAccount)[] = ['email', 'created_at', 'last_sign_in_at', 'plan', 'cycle', 'status', 'balance', 'used_d30', 'paid_cents', 'last_use'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

// Modo demonstração (sem Supabase): números fictícios só para ver o layout.
function demoDashboard(): AdminDashboard {
  const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10));
  const wave = (i: number, b: number) => Math.max(0, Math.round(b + Math.sin(i / 3) * b * 0.6 + (i / 30) * b));
  return {
    generated_at: new Date().toISOString(),
    accounts: { total: 412, today: 9, d7: 61, d30: 214, daily: days.map((day, i) => ({ day, n: wave(i, 6) })) },
    subscriptions: { paying: 38, by_plan: [{ plan: 'basic', cycle: 'mensal', n: 21 }, { plan: 'pro', cycle: 'mensal', n: 14 }, { plan: 'pro', cycle: 'anual', n: 3 }], trial: 374, conversion: 9.2, mrr_cents: 21 * 2990 + 14 * 4990 + 3 * 4158 },
    revenue: { month_cents: 168520, d30_cents: 201330, total_cents: 402770, topups_month: 7, daily: days.map((day, i) => ({ day, cents: wave(i, 6000) })) },
    usage: { analyses_d30: 1840, questions_d30: 920, refunds_d30: 12, credits_d30: 10120, active_users_d7: 96, daily: days.map((day, i) => ({ day, n: wave(i, 90) })), agent_calls_d30: 2772, agent_errors_d30: 12 },
    health: { grace: 1, delinquent: 0, cancel_scheduled: 2, webhook_errors: 0, recent_events: [] },
  };
}
