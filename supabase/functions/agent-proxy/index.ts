import { isBitcoinDecision, validBitcoinStudy } from '../_shared/bitcoin.ts';
// POST /agent-proxy — único caminho entre o front e o agente.
// 1) valida o usuário  2) debita créditos (antes de chamar)  3) chama o agente com a chave secreta
// 4) grava analyses + agent_calls  5) devolve em SSE (text, analysis, done)  6) estorna se o agente falhar
//
// O agente é a função `analyze` do projeto Thoran (repositório trade-agent). Ela responde JSON no formato
// AnalysisResponse: o texto completo (explanation), a versão curta de 3 linhas (short) e, quando há casos parecidos
// no repertório, o cartão (precedents, stats, chart). No chat vai sempre a versão curta:
// - pergunta rápida (1 crédito): só o texto; a página da análise também mostra só a versão curta;
// - análise completa (5): o texto e o cartão; a página da análise mostra o texto completo;
// - análise sem caso parecido (recusa, ou tema fora do repertório): não tem cartão, então cobra como pergunta.
import { admin, userFromRequest } from '../_shared/supabase.ts';
import { cors, json } from '../_shared/http.ts';
import { notifyLowBalance } from '../_shared/credits.ts';
import { isScenarioRequest, matchesScenarioResponse, scenarioQuestion } from '../_shared/scenarios.ts';
import type { ScenarioResult } from '../_shared/scenario-contract.ts';

const API_URL = Deno.env.get('AGENT_API_URL'); // ex.: https://<projeto>.supabase.co/functions/v1
const API_KEY = Deno.env.get('AGENT_API_KEY');
const TIMEOUT_MS = 60_000;
// Os textos D2/D3 e o fecho das "Regras do agente". O agente sempre manda o dele; este é só a rede de segurança.
const DISCLAIMER =
  'Sou uma IA e posso errar. Isto não é recomendação de investimento: a empresa não é analista credenciada nem consultora autorizada pela CVM. Rentabilidade passada não indica rentabilidade futura. Não digo se você deve comprar, quando entrar nem quanto colocar.';

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
// Caracteres de controle que a analyze recusa. O \u000B é a quebra de linha manual do Word: vira quebra de linha.
const CONTROL = /[\u0000-\u0008\u000C\u000E-\u001F\u007F]/g;

type Analysis = Record<string, unknown> & {
  id: string;
  explanation: string;
  short?: string;
  disclaimer?: string;
  no_charge?: boolean;
  bitcoin_version?: number;
  bitcoin_study?: unknown;
  filtered?: boolean; // o filtro de saída barrou o texto e mandou a mensagem de segurança
  scenarios?: ScenarioResult;

  query_redacted?: string;
  precedents?: { count?: number } & Record<string, unknown>;
};

const isAnalysis = (x: unknown): x is Analysis =>
  typeof x === 'object' &&
  x !== null &&
  typeof (x as Analysis).id === 'string' &&
  (x as Analysis).id.length > 0 &&
  typeof (x as Analysis).explanation === 'string';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!['POST', 'GET'].includes(req.method)) return json({ code: 'generic' }, 405);

  const user = await userFromRequest(req);
  if (!user) return json({ code: 'unauthorized' }, 401);
  // Consulta sem débito: protege o cliente novo durante a publicação gradual dos dois repositórios.
  if (req.method === 'GET') return json({ scenarios_version: 1, bitcoin_version: 1 });

  // Entrada no formato do contrato
  let input: { query?: string; market?: string | null; locale?: string; mode?: string; scenario_request?: unknown };
  try {
    input = await req.json();
  } catch {
    return json({ code: 'generic' }, 400);
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ code: 'generic' }, 400);
  if (input.scenario_request !== undefined && (!isScenarioRequest(input.scenario_request) || input.mode === 'pergunta')) return json({ code: 'generic' }, 400);
  const scenarioRequest = isScenarioRequest(input.scenario_request) ? input.scenario_request : undefined;
  const query = scenarioRequest ? scenarioQuestion(scenarioRequest) : String(input.query ?? '').replace(/\u000B/g, '\n').replace(CONTROL, ' ').trim().slice(0, 2000);
  if (!query) return json({ code: 'generic' }, 400);
  const market = ['b3', 'crypto', 'global'].includes(String(input.market)) ? input.market : null;
  const locale = input.locale === 'en-US' ? 'en-US' : 'pt-BR';
  // pergunta rápida = 1 crédito; análise completa = 5 (valores em credit_config)
  const kind = input.mode === 'pergunta' ? 'consumo_pergunta' : 'consumo_analise';

  if (!API_URL || !API_KEY) return json({ code: 'offline' }, 503);

  // Débito ANTES de chamar o agente (atômico, nunca deixa o saldo negativo)
  const callRef = `call_${crypto.randomUUID()}`;
  const { data: debited, error: debitErr } = await admin.rpc('consume_credits', { p_user: user.id, p_kind: kind, p_ref: callRef });
  if (debitErr) {
    const code = /saldo_insuficiente/.test(debitErr.message) ? 'credits' : /inadimplente|cancelada|sem_assinatura/.test(debitErr.message) ? 'blocked' : 'generic';
    const { data: bal } = await admin.rpc('credit_balance', { p_user: user.id });
    return json({ code, balance: bal ?? 0 }, code === 'generic' ? 500 : 402);
  }
  let balanceAfter = debited as number;
  // refund_credits é idempotente: se falhar, tenta de novo; se falhar de novo, fica no log com a referência.
  let refunded = false;
  const refund = async () => {
    for (let i = 0; i < 2 && !refunded; i++) {
      const { error } = await admin.rpc('refund_credits', { p_user: user.id, p_ref: callRef });
      if (error) console.error('estorno falhou', callRef, error.message);
      else refunded = true;
    }
    return refunded;
  };

  const started = Date.now();
  const failed = async (status: number, e?: unknown) => {
    if (e) console.error('agent offline', e);
    await admin.from('agent_calls').insert({ user_id: user.id, status, latency_ms: Date.now() - started });
    await refund();
    // 400 = a analyze recusou a pergunta: tentar de novo não adianta, então não é "fora do ar"
    return status === 400 ? json({ code: 'generic' }, 400) : json({ code: 'offline' }, 502);
  };

  let analysis: unknown;
  try {
    const upstream = await fetch(`${API_URL.replace(/\/$/, '')}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, market, locale, scenario_request: scenarioRequest }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!upstream.ok) return await failed(upstream.status);
    analysis = await upstream.json();
  } catch (e) {
    return await failed(0, e);
  }
  if (!isAnalysis(analysis)) return await failed(200, 'resposta fora do contrato');
  if (scenarioRequest && !matchesScenarioResponse(analysis.scenarios, scenarioRequest)) return await failed(200, 'cenários fora do contrato');

  if (!scenarioRequest && isBitcoinDecision(query) && (analysis.bitcoin_version !== 1 ||
      (analysis.bitcoin_study ? !validBitcoinStudy(analysis.bitcoin_study) || analysis.bitcoin_study.scope !== 'commercial_approved' : analysis.no_charge !== true))) {
    return await failed(200, 'estudo Bitcoin ausente ou fora do contrato');
  }
  const { query_redacted, filtered, no_charge, ...a } = analysis;
  if (!a.disclaimer) a.disclaimer = DISCLAIMER; // compliance: sempre com aviso
  const short = a.short || a.explanation;
  const hasCard = (a.precedents?.count ?? 0) > 0 || a.scenarios?.status === 'ready' || !!a.bitcoin_study;

  // O filtro barrou o texto: a pessoa recebe a mensagem de segurança e não paga pela falha.
  // Análise sem cartão: devolve os 5 e cobra 1, como pergunta (só se o estorno entrou, para não cobrar 5 + 1).
  if (filtered || no_charge || (scenarioRequest && a.scenarios?.status === 'insufficient')) {
    await refund();
  } else if (kind === 'consumo_analise' && !hasCard && (await refund())) {
    await admin.rpc('consume_credits', { p_user: user.id, p_kind: 'consumo_pergunta', p_ref: `${callRef}:pergunta` });
  }
  if (refunded) {
    const { data: bal } = await admin.rpc('credit_balance', { p_user: user.id });
    balanceAfter = (bal as number | null) ?? balanceAfter;
  }
  // O que fica guardado é o que foi entregue: sem cartão, a versão curta.
  const stored: Analysis =
    kind === 'consumo_pergunta' || !hasCard
      ? { ...a, explanation: short, precedents: { count: 0, period: { from: '', to: '' }, items: [] }, stats: [], chart: undefined }
      : a;

  // A pergunta vai para o histórico sem o trecho de voto e sem valor em dinheiro (N9): o agente já manda assim.
  // insert, não upsert: um id repetido nunca sobrescreve a análise de outra pessoa.
  const { error: saveErr } = await admin
    .from('analyses')
    .insert({ id: stored.id, user_id: user.id, question: query_redacted || query, response: stored });
  if (saveErr) console.error('analyses', saveErr.message);
  await admin.from('agent_calls').insert({ user_id: user.id, analysis_id: stored.id, status: 200, latency_ms: Date.now() - started });
  notifyLowBalance(user.id, user.email, balanceAfter).catch((e) => console.error('low balance', e));

  const body = sse('text', { delta: short }) + sse('analysis', stored) + sse('done', { balance: balanceAfter });
  return new Response(body, { headers: { ...cors, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
});
