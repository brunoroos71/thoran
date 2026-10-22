import { supabase } from '@/lib/supabase';
import { readLS, writeLS } from '@/lib/storage';

export interface Alert {
  id: string;
  term: string;
  created_at: string;
}

const LS = 'thoran.demo.alerts';

// Estrutura pronta; as notificações serão ligadas depois (cron + e-mail/push).
export async function listAlerts(): Promise<Alert[]> {
  if (supabase) {
    const { data } = await supabase.from('alerts').select('id, term, created_at').order('created_at', { ascending: false });
    return (data as Alert[]) ?? [];
  }
  return readLS<Alert[]>(LS, []);
}

export async function addAlert(term: string): Promise<Alert> {
  if (supabase) {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('alerts').insert({ term, user_id: u.user?.id }).select().single();
    if (error) throw error;
    return data as Alert;
  }
  const a = { id: crypto.randomUUID(), term, created_at: new Date().toISOString() };
  writeLS(LS, [a, ...readLS<Alert[]>(LS, [])]);
  return a;
}

export async function removeAlert(id: string) {
  if (supabase) {
    await supabase.from('alerts').delete().eq('id', id);
    return;
  }
  writeLS(LS, readLS<Alert[]>(LS, []).filter((a) => a.id !== id));
}
