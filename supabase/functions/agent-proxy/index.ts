// POST /agent-proxy — único caminho entre o front e a API do agente.
// 1) valida o usuário  2) debita créditos (antes de chamar)  3) chama a API com a chave secreta
// 4) repassa o streaming (SSE)  5) grava analyses + agent_calls  6) estorna se o agente falhar
import { admin, userFromRequest } from '../_shared/supabase.ts';
import { cors, json } from '../_shared/http.ts';
import { notifyLowBalance } from '../_shared/credits.ts';

const API_URL = Deno.env.get('AGENT_API_URL'); // ex.: https://agent.thoran.internal
const API_KEY = Deno.env.get('AGENT_API_KEY');
const TIMEOUT_MS = 60_000;
const DISCLAIMER =
  'O Thoran não faz recomendação de investimento. Resultados passados não garantem resultados futuros. Operar no mercado envolve risco de perda.';

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ code: 'generic' }, 405);

  const user = await userFromRequest(req);
  if (!user) return json({ code: 'unauthorized' }, 401);

  // Entrada no formato do contrato
  let input: { query?: string; market?: string | null; locale?: string; mode?: string };
  try {
    input = await req.json();
  } catch {
    return json({ code: 'generic' }, 400);
  }
  const query = String(input.query ?? '').trim().slice(0, 2000);
  if (!query) return json({ code: 'generic' }, 400);
  const market = ['b3', 'crypto', 'global'].includes(String(input.market)) ? input.market : null;
  const locale = input.locale === 'en-US' ? 'en-US' : 'pt-BR';
  // pergunta rápida = 1 crédito; análise completa = 5 (valores em credit_config)
  const kind = input.mode === 'pergunta' ? 'consumo_pergunta' : 'consumo_analise';

  if (!API_URL || !API_KEY) return json({ code: 'offline' }, 503);

  // Débito ANTES de chamar o agente (atômico, nunca deixa o saldo negativo)
  const callRef = `call_${crypto.randomUUID()}`;
  const { data: balanceAfter, error: debitErr } = await admin.rpc('consume_credits', { p_user: user.id, p_kind: kind, p_ref: callRef });
  if (debitErr) {
    const code = /saldo_insuficiente/.test(debitErr.message) ? 'credits' : /inadimplente|cancelada|sem_assinatura/.test(debitErr.message) ? 'blocked' : 'generic';
    const { data: bal } = await admin.rpc('credit_balance', { p_user: user.id });
    return json({ code, balance: bal ?? 0 }, code === 'generic' ? 500 : 402);
  }
  let refunded = false;
  const refund = async () => {
    if (refunded) return;
    refunded = true;
    await admin.rpc('refund_credits', { p_user: user.id, p_ref: callRef });
  };
  notifyLowBalance(user.id, user.email, balanceAfter as number).catch((e) => console.error('low balance', e));

  const started = Date.now();
  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL.replace(/\/$/, '')}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
      body: JSON.stringify({ query, market, locale }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    await admin.from('agent_calls').insert({ user_id: user.id, status: 0, latency_ms: Date.now() - started });
    console.error('agent offline', e);
    await refund();
    return json({ code: 'offline' }, 502);
  }
  if (!upstream.ok || !upstream.body) {
    await admin.from('agent_calls').insert({ user_id: user.id, status: upstream.status, latency_ms: Date.now() - started });
    await refund();
    return json({ code: 'offline' }, 502);
  }

  let gotAnalysis = false;
  const save = async (analysis: Record<string, unknown>) => {
    gotAnalysis = true;
    if (!analysis.disclaimer) analysis.disclaimer = DISCLAIMER; // compliance: sempre com aviso
    await admin.from('analyses').upsert({ id: String(analysis.id), user_id: user.id, question: query, response: analysis });
    await admin.from('agent_calls').insert({ user_id: user.id, analysis_id: String(analysis.id), status: 200, latency_ms: Date.now() - started });
  };

  const enc = new TextEncoder();
  const isJson = upstream.headers.get('content-type')?.includes('application/json');

  const stream = new ReadableStream({
    async start(controller) {
      const push = (s: string) => controller.enqueue(enc.encode(s));
      try {
        if (isJson) {
          // API sem streaming: devolve explicação como texto e o objeto como card
          const analysis = await upstream.json();
          await save(analysis);
          push(sse('text', { delta: analysis.explanation ?? '' }));
          push(sse('analysis', analysis));
        } else {
          // API com SSE: repassa os quadros e intercepta os objetos de análise
          const reader = upstream.body!.pipeThrough(new TextDecoderStream()).getReader();
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
              if (event === 'analysis' && raw) {
                const analysis = JSON.parse(raw);
                await save(analysis);
                push(sse('analysis', analysis));
              } else if (event === 'text' && raw) push(sse('text', JSON.parse(raw)));
              else if (event === 'error') push(sse('error', { code: 'generic' }));
            }
          }
        }
        // análise completa sem nenhum card = resposta inválida: devolve os créditos
        if (kind === 'consumo_analise' && !gotAnalysis) {
          await refund();
          push(sse('error', { code: 'offline', refunded: true }));
        } else push(sse('done', { balance: balanceAfter }));
      } catch (e) {
        console.error('agent stream', e);
        await refund();
        push(sse('error', { code: 'offline', refunded: true }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...cors, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
});
