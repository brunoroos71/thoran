import { env, hasSupabase } from '@/lib/env';
import { functionsUrl } from '@/lib/supabase';
import { readLS, writeLS } from '@/lib/storage';
import type { Attribution } from '@/lib/utm';

export type WaitlistError = 'invalid' | 'duplicate' | 'consent' | 'rate' | 'generic';
export type WaitlistResult = { ok: true } | { ok: false; error: WaitlistError };

export interface JoinInput extends Attribution {
  email: string;
  consent: boolean;
  website: string; // honeypot: humanos deixam vazio
  locale: string;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Nunca grava direto no banco: sempre via Edge Function waitlist-join. */
export async function joinWaitlist(input: JoinInput): Promise<WaitlistResult> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid' };
  if (!input.consent) return { ok: false, error: 'consent' };

  if (!hasSupabase) return demoJoin(email);

  try {
    const res = await fetch(functionsUrl('waitlist-join'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: env.supabaseAnonKey },
      body: JSON.stringify({ ...input, email }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    const err = (body.error as WaitlistError) ?? (res.status === 429 ? 'rate' : 'generic');
    return { ok: false, error: err };
  } catch {
    return { ok: false, error: 'generic' };
  }
}

// Modo demonstração (sem Supabase): simula o backend localmente.
async function demoJoin(email: string): Promise<WaitlistResult> {
  await new Promise((r) => setTimeout(r, 900));
  const list = readLS<string[]>('thoran.demo.waitlist', []);
  if (list.includes(email)) return { ok: false, error: 'duplicate' };
  writeLS('thoran.demo.waitlist', [...list, email]);
  return { ok: true };
}
