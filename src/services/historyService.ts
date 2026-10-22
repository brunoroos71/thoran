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
 * Guarda a resposta no navegador, para a lista de recentes da barra lateral (e para o histórico da demonstração).
 * No banco, quem grava é o /agent-proxy: o front só lê `analyses` (RLS: as próprias).
 */
export function saveAnalysis(question: string, response: AnalysisResponse) {
  const row: StoredAnalysis = { id: response.id, question, response, created_at: new Date().toISOString() };
  const local = readLS<StoredAnalysis[]>(LS, []);
  writeLS(LS, [row, ...local.filter((r) => r.id !== row.id)].slice(0, 100));
  window.dispatchEvent(new Event('thoran:history')); // atualiza a lista de recentes na barra lateral
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
