import type { ScenarioResult } from '@/services/agent/scenario-contract';

const rate = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 });
const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
const date = (s: string) => s ? s.split('-').reverse().join('/') : 'indisponível';

export function ScenarioComparison({ result }: { result: ScenarioResult }) {
  const e = result.evidence;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linha pb-4">
        <h2 className="text-xl font-medium">Comparação {result.request.currency}/BRL</h2>
        <p className="font-mono text-xs text-nevoa">Referência: {date(result.as_of)}</p>
      </div>
      {e && (
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-meta">Cotação histórica</p><p className="mt-1 font-mono text-lg">{rate(e.reference_rate)}</p></div>
          <div><p className="text-meta">Amostra efetiva</p><p className="mt-1 font-mono text-lg">{e.windows} janelas de {result.request.horizon} observações</p></div>
          <div><p className="text-meta">Recorte consultado</p><p className="mt-1 font-mono">{date(e.from)} — {date(e.to)}</p></div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {result.scenarios.map(s => (
          <section key={s.id} className="rounded-card border border-linha bg-grafite p-6">
            <p className="label text-nevoa">Cenário {s.id} · hipotético</p>
            <h3 className="mt-3 text-xl font-medium">{s.title}</h3>
            <div className="mt-5 flex flex-wrap items-baseline gap-3 font-mono">
              <span className="text-3xl">{pct(s.change_pct)}</span><span className="text-nevoa">{rate(s.reference_rate)}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-nevoa">{s.conditions}</p>
            <p className="mt-5 border-t border-linha pt-4 text-sm leading-relaxed">{s.impact}</p>
          </section>
        ))}
      </div>
      <section className="rounded-card border border-raio/40 bg-raio/5 p-6">
        <h3 className="label text-raio">{result.status === 'ready' ? 'Conclusão condicional' : 'Evidência insuficiente'}</h3>
        <p className="mt-3 leading-relaxed">{result.conclusion}</p>
      </section>
      <details className="rounded-card border border-linha p-5" open={result.status === 'insufficient'}>
        <summary className="cursor-pointer font-medium">Evidências, método e limites</summary>
        {e && <p className="mt-4 text-sm text-nevoa">{e.observations} observações no recorte; {e.excluded_windows} janelas excluídas por lacunas. O trecho inicial menor que uma janela é descartado. Nos retornos históricos usados: mínimo {pct(e.min_pct)}, mediana {pct(e.median_pct)}, máximo {pct(e.max_pct)}. Esses valores descrevem o passado.</p>}
        <p className="mt-4 text-sm leading-relaxed text-nevoa">{result.method}</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-nevoa">
          {result.limitations.map(l => <li key={l}>{l}</li>)}
        </ul>
      </details>
      <p className="text-xs leading-relaxed text-meta">Fonte dos números: <a className="underline hover:text-texto" href={result.source.url} target="_blank" rel="noreferrer">{result.source.name}</a>. Contexto: <a className="underline hover:text-texto" href="https://www.bcb.gov.br/estabilidadefinanceira/politicacambial" target="_blank" rel="noreferrer">política cambial do Banco Central</a>. Não há probabilidade atribuída a A ou B.</p>
    </div>
  );
}
