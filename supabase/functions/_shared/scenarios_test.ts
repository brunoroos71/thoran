import { strict as assert } from 'node:assert';
import { isScenarioRequest, matchesScenarioResponse } from './scenarios.ts';
import fixtures from '../../../src/services/agent/scenario-fixtures.json' with { type: 'json' };
const request = { currency: 'USD', horizon: 20, objective: 'pay' } as const;
Deno.test('agente antigo, resposta incompleta ou de outro pedido não são cobrados como comparação', () => {
  assert.equal(matchesScenarioResponse(undefined, request), false);
  assert.equal(matchesScenarioResponse({ version: 1, request, status: 'ready', conclusion: 'ok', scenarios: [] }, request), false);
  assert.equal(matchesScenarioResponse(fixtures.USD_20_pay, request), true);
  assert.equal(matchesScenarioResponse({ ...fixtures.USD_20_pay, evidence: { windows: 125 } }, request), false);
  const insufficient = { ...fixtures.USD_20_pay, status: 'insufficient', conclusion: 'Sem base', scenarios: [] };
  assert.equal(matchesScenarioResponse(insufficient, request), true);
  assert.equal(matchesScenarioResponse({ ...insufficient, request: { ...request, currency: 'EUR' } }, request), false);
  assert.equal(isScenarioRequest({ ...request, horizon: '20' }), false);
});
