import { strict as assert } from 'node:assert';
import fixtures from '../../../src/services/agent/scenario-fixtures.json' with { type: 'json' };

// Exercita o handler real com Auth, banco e agente simulados. Nenhuma chamada de rede é permitida.
Deno.test('cenários: débito, estorno, persistência e compatibilidade do proxy', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalServe = Deno.serve;
  const env = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-service-role', AGENT_API_URL: 'https://agent.test', AGENT_API_KEY: 'test-agent-key' };
  const previous = Object.fromEntries(Object.keys(env).map(k => [k, Deno.env.get(k)]));
  for (const [k, v] of Object.entries(env)) Deno.env.set(k, v);
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  let handler: (req: Request) => Promise<Response>;
  const request = { currency: 'USD', horizon: 20, objective: 'pay' } as const;
  const ready = { id: 'test-analysis', explanation: 'Texto completo', short: 'Resumo', precedents: { count: 0 },
    scenarios: fixtures.USD_20_pay };
  let upstream: unknown = ready;
  globalThis.fetch = (async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    calls.push({ path: url.pathname, body });
    const response = (value: unknown) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
    if (url.pathname === '/auth/v1/user') return response({ id: 'test-user', email: 'test@example.com' });
    if (url.pathname === '/analyze') return response(upstream);
    if (url.pathname === '/rest/v1/rpc/consume_credits') return response(95);
    if (url.pathname === '/rest/v1/rpc/credit_balance') return response(100);
    if (url.pathname === '/rest/v1/credit_config') return response({ value: 10 });
    if (['/rest/v1/rpc/refund_credits', '/rest/v1/analyses', '/rest/v1/agent_calls'].includes(url.pathname)) return response(null);
    throw new Error(`Requisição inesperada: ${url.pathname}`);
  }) as typeof fetch;
  Deno.serve = ((fn: typeof handler) => { handler = fn; return {} }) as typeof Deno.serve;
  const send = (data: unknown) => handler(new Request('https://proxy.test', { method: 'POST', headers: { Authorization: 'Bearer test-user-token', 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
  const rpc = (name: string) => calls.filter(c => c.path === `/rest/v1/rpc/${name}`);
  try {
    await import('./index.ts');
    await t.step('consulta de compatibilidade autentica sem débito', async () => {
      calls.length = 0;
      const response = await handler(new Request('https://proxy.test', { headers: { Authorization: 'Bearer test-user-token' } }));
      assert.equal(response.status, 200); assert.deepEqual(await response.json(), { scenarios_version: 1 });
      assert.equal(rpc('consume_credits').length, 0);
    });
    await t.step('comparação completa custa uma análise e mantém os dois cenários no histórico', async () => {
      calls.length = 0; upstream = ready;
      const response = await send({ query: 'Tenho um valor pessoal', scenario_request: request, mode: 'analise' });
      assert.equal(response.status, 200); assert.match(await response.text(), /Texto completo/);
      assert.equal(rpc('consume_credits').length, 1); assert.equal(rpc('consume_credits')[0].body.p_kind, 'consumo_analise');
      assert.equal(rpc('refund_credits').length, 0);
      const sent = calls.find(c => c.path === '/analyze')!.body;
      assert.deepEqual(sent.scenario_request, request); assert.doesNotMatch(String(sent.query), /valor pessoal/);
      const saved = calls.find(c => c.path === '/rest/v1/analyses')!.body;
      assert.deepEqual((saved.response as typeof ready).scenarios, ready.scenarios);
    });
    await t.step('evidência insuficiente estorna sem cobrar pergunta rápida', async () => {
      calls.length = 0; upstream = { ...ready, scenarios: { ...ready.scenarios, status: 'insufficient', scenarios: [], evidence: undefined } };
      const response = await send({ scenario_request: request });
      assert.equal(response.status, 200); await response.text();
      assert.equal(rpc('consume_credits').length, 1); assert.equal(rpc('refund_credits').length, 1);
    });
    await t.step('agente antigo estorna e responde erro em vez de entregar resposta errada', async () => {
      calls.length = 0; upstream = { ...ready, scenarios: undefined };
      const response = await send({ scenario_request: request });
      assert.equal(response.status, 502); await response.text();
      assert.equal(rpc('refund_credits').length, 1); assert.equal(calls.some(c => c.path === '/rest/v1/analyses'), false);
    });
    await t.step('pedido inválido ou modo rápido não debita', async () => {
      for (const data of [null, { scenario_request: { ...request, horizon: 21 } }, { scenario_request: request, mode: 'pergunta' }]) {
        calls.length = 0; const response = await send(data);
        assert.equal(response.status, 400); await response.text(); assert.equal(rpc('consume_credits').length, 0);
      }
    });
    await t.step('conversa comum sem cartão conserva cobrança de pergunta', async () => {
      calls.length = 0; upstream = { ...ready, scenarios: undefined };
      const response = await send({ query: 'Como está o dólar?', mode: 'analise' });
      assert.equal(response.status, 200); await response.text();
      assert.deepEqual(rpc('consume_credits').map(c => c.body.p_kind), ['consumo_analise', 'consumo_pergunta']);
      assert.equal(rpc('refund_credits').length, 1);
    });
  } finally {
    globalThis.fetch = originalFetch; Deno.serve = originalServe;
    for (const [k, v] of Object.entries(previous)) { if (v === undefined) Deno.env.delete(k); else Deno.env.set(k, v); }
  }
});
