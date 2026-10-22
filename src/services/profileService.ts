import { supabase } from '@/lib/supabase';
import { readLS, writeLS } from '@/lib/storage';
import type { Market } from './agent';

export type Level = 'iniciante' | 'intermediario' | 'avancado';
export type Plan = 'free' | 'pro' | 'max';

export interface Profile {
  id: string;
  name: string | null;
  experience_level: Level | null;
  markets: Market[];
  plan: Plan;
  locale: 'pt-BR' | 'en-US';
  onboarded: boolean;
  terms_version?: string | null;
  terms_accepted_at?: string | null;
}

const LS = 'thoran.demo.profile';

export async function getProfile(userId: string): Promise<Profile | null> {
  if (supabase) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return (data as Profile) ?? null;
  }
  return readLS<Profile | null>(LS, null);
}

export async function upsertProfile(p: Partial<Profile> & { id: string }) {
  if (supabase) {
    const { error } = await supabase.from('profiles').upsert(p);
    if (error) throw error;
    return;
  }
  const cur = readLS<Profile | null>(LS, null);
  writeLS(LS, { name: null, experience_level: null, markets: [], plan: 'free', locale: 'pt-BR', onboarded: false, ...cur, ...p });
}
