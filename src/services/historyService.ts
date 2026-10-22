import { supabase } from '@/lib/supabase';
import { readLS, writeLS } from '@/lib/storage';
import type { AnalysisResponse } from './agent';

export interface StoredAnalysis {
  id: string;
  question: string;
  response: AnalysisResponse;
  created_at: string;
}

const LS = 'thoran.demo.analyses';

/**
 * No modo live o /agent-proxy já grava em `analyses`. No modo mock, o front grava
 * (Supabase com RLS quando há sessão; localStorage na demonstração).
 */
export async function saveAnalysis(question: string, response: AnalysisResponse, persistRemote: boolean) {
  const row: StoredAnalysis = { id: response.id, question, response, created_at: new Date().toISOString() };
  const local = readLS<StoredAnalysis[]>(LS, []);
  writeLS(LS, [row, ...local.filter((r) => r.id !== row.id)].slice(0, 100));
  window.dispatchEvent(new Event('thoran:history')); // atualiza a lista de recentes na barra lateral
  if (persistRemote && supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user)
      await supabase.from('analyses').upsert({ id: row.id, user_id: data.user.id, question, response });
  }
}

export async function listAnalyses(): Promise<StoredAnalysis[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('analyses')
      .select('id, question, response, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data?.length) return data as StoredAnalysis[];
  }
  return readLS<StoredAnalysis[]>(LS, []);
}

export async function getAnalysis(id: string): Promise<StoredAnalysis | null> {
  if (supabase) {
    const { data } = await supabase.from('analyses').select('id, question, response, created_at').eq('id', id).maybeSingle();
    if (data) return data as StoredAnalysis;
  }
  return readLS<StoredAnalysis[]>(LS, []).find((r) => r.id === id) ?? null;
}
