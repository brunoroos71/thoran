/** Contrato puro compartilhado com o site. Sem LLM nem preços inventados. */
export type BitcoinCase = { signal_date: string; entry_date: string; exit_date: string; entry_usd: number; exit_usd: number; gross_pct: number; net_pct: number; path_loss_pct: number; dca_net_pct: number | null }
export type BitcoinStats = { n: number; wins: number; win_pct: number; win_interval: number[]; mean_pct: number; median_pct: number; p10_pct: number; p90_pct: number; min_pct: number; max_pct: number; worst_path_pct: number; mean_dca_pct: number | null }
export type BitcoinHorizon = { days: number; stats: BitcoinStats | null; older: BitcoinStats | null; recent: BitcoinStats | null; baseline: BitcoinStats | null; cases: BitcoinCase[]; verdict: 'favorable' | 'unfavorable' | 'mixed' | 'insufficient' }
export type BitcoinStudy = { version: 1; asset: 'BTC/USD'; scope: 'research_only' | 'commercial_approved'; as_of: string; generated_for: string; entry_lag_days: number; source: { name: string; url: string; sha256: string; license_reference?: string }; reference_usd: number; period: { from: string; to: string }; cost_pct: number; regime: { momentum_pct: number; trend_pct: number; volatility_pct: number; regime: (number | boolean)[] }; horizons: BitcoinHorizon[]; method: string; limitations: string[] }

// Escopo deliberadamente explícito: não confundir eventos políticos, impostos, outros ativos ou alavancagem
// com este estudo de compra à vista por regime de preços.
export function isBitcoinDecision(query: string): boolean {
  const q = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[?!.,;:]/g, ' ').replace(/\s+/g, ' ').trim()
  return /^(?:(?:eu )?(?:quero|devo|posso|vou|vale a pena) comprar|compro|comprar) (?:bitcoin|btc)(?: (?:amanha))?(?: (?:compensa|vale a pena))?$/.test(q)
    || /^(?:compensa|vale a pena) comprar (?:bitcoin|btc)(?: (?:amanha))?$/.test(q)
}
export const bitcoinToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
export const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2).replace('.', ',')}%`
export const usd = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
export function conclusion(h: BitcoinHorizon): string {
  if (h.verdict === 'unfavorable') return 'Eu evitaria comprar visando este prazo: a mediana e a média na metade recente foram negativas após o custo assumido.'
  if (h.verdict === 'favorable') return 'A comparação favorece a compra neste prazo, condicionada a suportar as perdas observadas; isso não demonstra vantagem futura nem define um tamanho de posição.'
  if (h.verdict === 'mixed') return 'Eu esperaria evidência mais consistente antes de comprar por este sinal: os critérios de vantagem histórica não foram todos atendidos.'
  return 'Eu não usaria este recorte como motivo suficiente para comprar: a amostra não atende ao mínimo de 20 casos e 5 em cada metade do período.'
}
export function validBitcoinStudy(x: unknown): x is BitcoinStudy {
  try {
    const r = x as BitcoinStudy
    const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
    const date = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v).toISOString().slice(0, 10) === v
    const stats = (s: BitcoinStats | null) => s === null || (Number.isInteger(s.n) && s.n > 0 && Number.isInteger(s.wins) && s.wins >= 0 && s.wins <= s.n && s.win_interval.length === 2 && s.win_interval.every(finite) && [s.win_pct, s.mean_pct, s.median_pct, s.p10_pct, s.p90_pct, s.min_pct, s.max_pct, s.worst_path_pct].every(finite) && (s.mean_dca_pct === null || finite(s.mean_dca_pct)))
    return r.version === 1 && r.asset === 'BTC/USD' && ['research_only', 'commercial_approved'].includes(r.scope) && date(r.as_of) && date(r.generated_for) && date(r.period.from) && date(r.period.to) && r.period.to === r.as_of && r.generated_for > r.as_of && r.period.from <= r.period.to
      && Number.isInteger(r.entry_lag_days) && r.entry_lag_days >= 2 && r.entry_lag_days <= 4 && r.entry_lag_days === (Date.parse(r.generated_for) - Date.parse(r.as_of)) / 86400000 + 1 && finite(r.reference_usd) && r.reference_usd > 0 && finite(r.cost_pct) && r.cost_pct >= 0
      && [r.regime.momentum_pct, r.regime.trend_pct, r.regime.volatility_pct].every(finite)
      && typeof r.source.name === 'string' && /^https:\/\//.test(r.source.url) && /^[a-f0-9]{64}$/.test(r.source.sha256)
      && typeof r.method === 'string' && r.limitations.every(l => typeof l === 'string')
      && r.horizons.length === 4 && r.horizons.every((h, i) => h.days === [1, 7, 30, 90][i] && ['favorable', 'unfavorable', 'mixed', 'insufficient'].includes(h.verdict) && [h.stats, h.older, h.recent, h.baseline].every(stats) && h.cases.length === (h.stats?.n ?? 0) && h.cases.every((c, j) => date(c.signal_date) && date(c.entry_date) && date(c.exit_date) && c.signal_date < c.entry_date && c.entry_date < c.exit_date && c.exit_date <= r.as_of && (!j || c.signal_date > h.cases[j-1].exit_date) && [c.entry_usd, c.exit_usd, c.net_pct, c.gross_pct, c.path_loss_pct].every(finite) && c.entry_usd > 0 && c.exit_usd > 0 && (c.dca_net_pct === null || finite(c.dca_net_pct))))
  } catch { return false }
}
export function bitcoinResponse(input: unknown, today: string, research = false) {
  const age = validBitcoinStudy(input) ? (Date.parse(today) - Date.parse(input.as_of)) / 86400000 : NaN
  const usable = validBitcoinStudy(input) && (research ? input.scope === 'research_only' : input.scope === 'commercial_approved' && !!input.source.license_reference && age >= 1 && age <= 3 && input.generated_for === today)
  const r = usable ? input as BitcoinStudy : undefined
  const prefix = r?.scope === 'research_only' ? `**Pesquisa interna — fotografia de ${r.as_of}.** Fonte comercial ainda pendente. Esta conclusão descreve aquela fotografia, não uma cotação ao vivo.\n\n` : ''
  const lines = r?.horizons.map(h => h.stats ? `- **${h.days} ${h.days === 1 ? 'dia' : 'dias'}:** ${h.stats.wins} de ${h.stats.n} casos positivos (${h.stats.win_pct.toFixed(1).replace('.', ',')}%); média ${pct(h.stats.mean_pct)}, mediana ${pct(h.stats.median_pct)}. ${conclusion(h)}` : `- **${h.days} ${h.days === 1 ? 'dia' : 'dias'}:** sem casos comparáveis.`) ?? []
  const explanation = r ? prefix + '**Comprar amanhã compensa? Depende de quando você pretende vender.** Comprar amanhã e manter por 30 dias é diferente de apostar na alta de um dia. Comparei compras no dia seguinte à data de análise, por quatro prazos, sem escolher casos pelo resultado posterior.\n\n' + lines.join('\n') + '\n\n**Recomendação para revender após 1 dia:** ' + conclusion(r.horizons[0]) + ' Para manter por mais tempo, use a conclusão do prazo correspondente acima. Não há evidência suficiente aqui para afirmar que esperar um dia garante preço menor.\n\nResultados em USD, após custo hipotético total de ' + pct(r.cost_pct) + ' sobre o capital inicial; sem impostos e sem efeito USD/BRL. Frequência passada não é probabilidade de lucro amanhã.'
    : 'Para dizer se comprar Bitcoin amanhã compensa, preciso de histórico atualizado com uso autorizado. Essa base ainda não está disponível no site. O estudo comparará 1, 7, 30 e 90 dias, ganhos e perdas, compra de uma vez e parcelada. Sem essa evidência, não há base para recomendar a compra. Nenhum crédito será cobrado por esta resposta.'
  return { id: crypto.randomUUID(), event: { title: 'Bitcoin: compra e resultados por prazo', detected_at: new Date().toISOString() }, precedents: { count: 0, period: r?.period ?? { from: '', to: '' }, items: [] }, stats: [], explanation, short: explanation,
    disclaimer: 'Comparação histórica condicionada às premissas descritas. Resultados futuros podem ser diferentes e as perdas podem ser maiores.',
    query_redacted: 'Compensa comprar Bitcoin amanhã? Comparação histórica por prazo.', filtered: false, no_charge: !r || research || !r.horizons.some(h => h.stats), bitcoin_version: 1, bitcoin_study: r, source: r?.source.name }
}
