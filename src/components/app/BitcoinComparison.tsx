import { useState } from 'react';
import { conclusion, pct, usd, type BitcoinStudy } from '@/services/agent/bitcoin';

export function BitcoinComparison({ study: r }: { study: BitcoinStudy }) {
  const [days, setDays] = useState(30);
  const h = r.horizons.find(h => h.days === days)!;
  const s = h.stats;
  return <section className="min-w-0 space-y-5 rounded-3xl border border-linha bg-grafite p-4 sm:p-6" aria-label="Resultados históricos de Bitcoin">
    <header className="space-y-2">
      <p className="label text-raio">Como teriam ficado US$ 1.000?</p>
      <p className="text-sm text-nevoa">Base {r.as_of} · BTC/USD {usd(r.reference_usd)} · {r.scope === 'research_only' ? 'Pesquisa interna · fonte comercial pendente' : 'Estudo histórico'}</p>
      <p className="text-sm text-nevoa">Recorte: {r.period.from} a {r.period.to}. Casos semelhantes por tendência, retorno e volatilidade; não são acontecimentos idênticos.</p>
    </header>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Prazo de manutenção após a compra">
      {r.horizons.map(x => <button key={x.days} type="button" aria-pressed={days === x.days} onClick={() => setDays(x.days)} className={`min-h-[44px] rounded-full border px-4 text-sm ${days === x.days ? 'border-raio text-raio' : 'border-linha text-nevoa'}`}>{x.days} dia{x.days === 1 ? '' : 's'}</button>)}
    </div>
    <p className="text-xs text-meta">Prazo contado após a entrada simulada. Os 30 dias iniciais são uma comparação, não uma suposição sobre seu objetivo.</p>
    {s ? <>
      <div className="grid gap-3 sm:grid-cols-2">
        {[{ title: 'Cenário A · resultado desfavorável (P10)', value: s.p10_pct }, { title: 'Cenário B · resultado favorável (P90)', value: s.p90_pct }].map(x => <div key={x.title} className="space-y-2 rounded-2xl border border-linha p-4">
          <p className="text-sm text-nevoa">{x.title}</p><p className="font-mono text-2xl">{usd(1000 * (1 + x.value / 100))}</p><p className="font-mono text-sm">{pct(x.value)} · diferença de {usd(1000 * x.value / 100)}</p>
        </div>)}
      </div>
      <p className="text-xs text-meta">P10 e P90 são percentis interpolados da amostra: cerca de 10% dos resultados ficam abaixo e 10% acima desses limites. Não são pisos, tetos ou previsões. “Favorável” significa a parte melhor da distribuição; ela também pode ser negativa.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm"><caption className="sr-only">Resultados líquidos do custo hipotético para {days} {days === 1 ? 'dia' : 'dias'}</caption><tbody>
          {[
            ['Casos positivos', `${s.wins} de ${s.n} (${s.win_pct.toFixed(1).replace('.', ',')}%)`],
            ['Média antes do custo assumido', pct(s.mean_pct + r.cost_pct)],
            ['Média / mediana após custo', `${pct(s.mean_pct)} / ${pct(s.median_pct)}`],
            ['Pior / melhor resultado ao sair', `${pct(s.min_pct)} / ${pct(s.max_pct)}`],
            ['Pior perda desde a entrada, pelos fechamentos', pct(s.worst_path_pct)],
            ['Compra sem filtro de regime · média', h.baseline ? `${pct(h.baseline.mean_pct)} (${h.baseline.n} janelas)` : 'Sem base'],
            ['Metade antiga · média', h.older ? `${pct(h.older.mean_pct)} (${h.older.n} casos)` : 'Sem casos'],
            ['Metade recente · média', h.recent ? `${pct(h.recent.mean_pct)} (${h.recent.n} casos)` : 'Sem casos'],
            ['Intervalo descritivo de frequência · Wilson 95%', `${s.win_interval.map(x => x.toFixed(1).replace('.', ',') + '%').join(' a ')}`],
          ].map(([label, value]) => <tr key={label} className="border-b border-linha"><th scope="row" className="py-3 pr-4 font-normal text-nevoa">{label}</th><td className="py-3 font-mono">{value}</td></tr>)}
        </tbody></table>
      </div>
      {s.mean_dca_pct !== null && <div className="space-y-2 rounded-2xl border border-linha p-4"><h3 className="font-medium">Comprar de uma vez ou parcelar?</h3><p className="text-sm text-nevoa">Nas mesmas {s.n} datas, compra única: média {pct(s.mean_pct)}; quatro compras semanais iguais: {pct(s.mean_dca_pct)}. Diferença: {(s.mean_dca_pct - s.mean_pct).toFixed(2).replace('.', ',')} pontos percentuais. Mesmo capital inicial e custo total; caixa sem rendimento. Vantagem histórica média não garante menor risco nem lucro.</p></div>}
      <p className="text-sm"><strong>Conclusão para {days} {days === 1 ? 'dia' : 'dias'}:</strong> {conclusion(h)}</p>
      <details className="rounded-2xl border border-linha p-4"><summary className="cursor-pointer text-sm text-raio">Ver todos os {s.n} casos usados</summary><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[540px] text-left text-xs"><thead><tr>{['Sinal', 'Compra', 'Saída', 'Compra única', 'Parcelada'].map(v => <th scope="col" className="p-2" key={v}>{v}</th>)}</tr></thead><tbody>{h.cases.map(c => <tr key={c.signal_date} className="border-t border-linha"><td className="p-2">{c.signal_date}</td><td className="p-2">{c.entry_date}</td><td className="p-2">{c.exit_date}</td><td className="p-2">{pct(c.net_pct)}</td><td className="p-2">{c.dca_net_pct === null ? '—' : pct(c.dca_net_pct)}</td></tr>)}</tbody></table></div></details>
    </> : <p>Não há casos comparáveis para este prazo.</p>}
    <details className="text-sm text-nevoa"><summary className="cursor-pointer text-raio">Premissas, critérios e limites</summary><div className="mt-3 space-y-3"><p>Estado na referência: retorno em 30 dias {pct(r.regime.momentum_pct)}; distância da média de 200 dias {pct(r.regime.trend_pct)}; volatilidade anualizada {pct(r.regime.volatility_pct)}.</p><p>{r.method}</p><p>O comparativo sem filtro usa janelas não sobrepostas do mesmo recorte, com datas diferentes. Conclusão favorável exige pelo menos 20 casos, 5 em cada metade, limite inferior de Wilson acima de 50%, média superior à base e médias positivas nas duas metades. Conclusão desfavorável exige a mesma amostra mínima, mediana não positiva e média recente não positiva. Demais resultados são mistos.</p><ul className="list-disc space-y-2 pl-5">{r.limitations.map(l => <li key={l}>{l}</li>)}</ul><p>Valores de US$ 1.000 são apenas escala de comparação; não definem quanto investir.</p></div></details>
    <p className="text-xs text-meta">Fonte: <a href={r.source.url} target="_blank" rel="noreferrer" className="text-raio underline">{r.source.name}</a>. Custo total assumido: {pct(r.cost_pct)} sobre o capital inicial. Sem impostos e sem câmbio USD/BRL.</p>
  </section>;
}
