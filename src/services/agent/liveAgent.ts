import { isBitcoinDecision } from './bitcoin';
import { functionsUrl, supabase } from '@/lib/supabase';
import { AgentError, type AgentChunk, type AgentService, type AnalysisResponse, type AnalyzeRequest, type StreamOptions } from './types';

/**
 * Fala SOMENTE com a Edge Function /agent-proxy (nunca com a API do agente).
 * O proxy responde em SSE:  event: text|analysis|done|error  +  data: JSON
 */
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) throw new AgentError('unauthorized');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function open(req: AnalyzeRequest, signal?: AbortSignal, mode: StreamOptions['mode'] = 'analise') {
  let res: Response;
  try {
    const headers = await authHeaders();
    if (req.scenario_request || isBitcoinDecision(req.query)) {
      const capability = await fetch(functionsUrl('agent-proxy'), { method: 'GET', headers, signal, cache: 'no-store' });
      if (capability.status === 401) throw new AgentError('unauthorized');
      const supported = capability.ok ? await capability.json() : {};
      if ((req.scenario_request && supported.scenarios_version !== 1) || (isBitcoinDecision(req.query) && supported.bitcoin_version !== 1)) {
        throw new AgentError('offline', 'Esta análise ainda não foi ativada no servidor. Nenhum crédito foi debitado.');
      }
    }
    res = await fetch(functionsUrl('agent-proxy'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...req, mode }),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    if (e instanceof AgentError) throw e;
    throw new AgentError('offline');
  }
  if (res.status === 401) throw new AgentError('unauthorized');
  if (res.status === 402) {
    const b = await res.json().catch(() => ({}));
    throw new AgentError(b.code === 'blocked' ? 'blocked' : 'credits', undefined, b.balance);
  }
  if (res.status >= 502) throw new AgentError('offline');
  if (!res.ok || !res.body) throw new AgentError('generic');
  return res.body;
}

async function* stream(req: AnalyzeRequest, opts: StreamOptions = {}): AsyncGenerator<AgentChunk> {
  const body = await open(req, opts.signal, opts.mode);
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i: number;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const event = /^event: (.+)$/m.exec(frame)?.[1]?.trim();
      const raw = /^data: (.*)$/m.exec(frame)?.[1];
      const data = raw ? JSON.parse(raw) : null;
      if (event === 'text') yield { type: 'text', delta: data.delta };
      else if (event === 'analysis') yield { type: 'analysis', data };
      else if (event === 'error') throw new AgentError(data?.code ?? 'generic');
      else if (event === 'done') {
        yield { type: 'done' };
        return;
      }
    }
  }
  yield { type: 'done' };
}

async function analyze(req: AnalyzeRequest, opts: { signal?: AbortSignal } = {}): Promise<AnalysisResponse> {
  for await (const c of stream(req, opts)) if (c.type === 'analysis') return c.data;
  throw new AgentError('generic', 'sem análise na resposta');
}

export const liveAgent: AgentService = { mode: 'live', stream, analyze };
