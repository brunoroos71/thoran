import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTitle } from '@/hooks/useTitle';
import { useCredits } from '@/services/billing/CreditsProvider';
import { CreditError } from '@/services/billing/types';
import { agentService, AgentError } from '@/services/agent';
import type { AnalysisResponse } from '@/services/agent/types';
import { scenarioQuestion, type ScenarioRequest } from '@/services/agent/scenario-contract';
import { saveAnalysis } from '@/services/historyService';
import { ScenarioComparison } from '@/components/app/ScenarioComparison';

export default function Scenarios() {
  useTitle('Cenários cambiais');
  const [request, setRequest] = useState<ScenarioRequest>({ currency: 'USD', horizon: 20, objective: 'compare' });
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { charge, state, askTopup } = useCredits();
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const demo = agentService.mode === 'mock';
  const cost = state?.costs.analise ?? 5;
  function update(patch: Partial<ScenarioRequest>) { setRequest(r => ({ ...r, ...patch })); setResult(null); setError(''); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setResult(null);
    const abort = new AbortController(); controller.current = abort;
    const query = scenarioQuestion(request);
    try {
      const run = () => agentService.analyze({ query, market: 'global', locale: 'pt-BR', scenario_request: request }, { signal: abort.signal });
      const response = demo ? await run() : await charge('consumo_analise', `scenario_${crypto.randomUUID()}`, run);
      if (abort.signal.aborted) return;
      if (!response.scenarios) throw new Error('O agente ainda não disponibilizou a comparação de cenários.');
      setResult(response);
      saveAnalysis(query, response);
    } catch (e) {
      if (abort.signal.aborted) return;
      if ((e instanceof CreditError || e instanceof AgentError) && e.code === 'credits') {
        askTopup(cost); setError('Saldo insuficiente para esta comparação.');
      } else if (e instanceof AgentError && e.message.includes('Nenhum crédito')) setError(e.message);
      else setError('Não foi possível concluir a comparação. Confira a conexão e tente novamente. Se houve débito sem resposta, ele será estornado pelo servidor.');
    } finally { if (!abort.signal.aborted) setBusy(false); }
  }
  const field = 'mt-2 min-h-[48px] w-full rounded-xl border border-linha bg-grafite px-3 text-texto focus:outline-none focus:ring-2 focus:ring-raio';
  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-8 md:py-12">
      <p className="label text-raio">Planejamento cambial</p>
      <h1 className="mt-3 max-w-3xl text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">Dois cenários. Uma decisão com contexto.</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-nevoa">Compare o efeito de uma alta e de uma queda do dólar ou do euro. A conclusão considera seu objetivo; os números vêm de até dez anos de cotações oficiais disponíveis.</p>
      {demo && <p className="mt-5 rounded-xl border border-linha p-4 text-sm text-nevoa">Demonstração gratuita com uma fotografia histórica de 22/10/2026. Não consulta cotações atuais nem debita créditos.</p>}
      <form onSubmit={submit} className="my-8 rounded-card border border-linha p-5 sm:p-6">
        <fieldset disabled={busy} className="grid gap-5 disabled:opacity-60 sm:grid-cols-3">
          <legend className="sr-only">Configurar comparação</legend>
          <label className="text-sm">Moeda
            <select className={field} value={request.currency} onChange={e => update({ currency: e.target.value as ScenarioRequest['currency'] })}>
              <option value="USD">Dólar · USD/BRL</option><option value="EUR">Euro · EUR/BRL</option>
            </select>
          </label>
          <label className="text-sm">Janela histórica
            <select className={field} value={request.horizon} onChange={e => update({ horizon: Number(e.target.value) as ScenarioRequest['horizon'] })}>
              <option value={5}>5 observações diárias</option><option value={20}>20 observações diárias</option><option value={60}>60 observações diárias</option>
            </select>
          </label>
          <label className="text-sm">Seu objetivo
            <select className={field} value={request.objective} onChange={e => update({ objective: e.target.value as ScenarioRequest['objective'] })}>
              <option value="compare">Comparar risco</option><option value="pay">Pagar em dólar ou euro</option><option value="receive">Receber e converter em reais</option>
            </select>
          </label>
        </fieldset>
        <p className="mt-4 text-xs leading-relaxed text-meta">A janela mede a distância entre observações na série; não é um prazo de previsão. Nenhum valor pessoal é necessário.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button disabled={busy} type="submit" className="min-h-[48px] rounded-full bg-raio px-6 font-semibold text-carbono hover:bg-texto disabled:cursor-wait disabled:opacity-60">{busy ? 'Comparando…' : 'Comparar cenários'}</button>
          <p className="text-xs text-meta">{demo ? 'Sem consumo de créditos' : `${cost} créditos · estorno se faltar base ou houver falha`}</p>
        </div>
      </form>
      <div aria-live="polite" aria-busy={busy}>
        {error && <p role="alert" className="mb-6 rounded-xl border border-linha p-4">{error}</p>}
        {result?.scenarios && <ScenarioComparison result={result.scenarios} />}
      </div>
      <p className="mt-8 text-sm text-meta">Para consultar fatos e eventos do repertório, <Link to="/app" className="text-nevoa underline">abra uma conversa</Link>.</p>
    </article>
  );
}
