/** Orientação para a pergunta geral sobre carteira; não presume posições, vencedor ou reação atual. */
export type ElectionEvidence = { cases: { date: string; title: string; move_pct: number }[]; source: string }
export function isPortfolioDecision(query: string): boolean {
  const q = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return /\beleic(?:ao|oes)\b/.test(q) && /\b(investimentos|carteira|portfolio|patrimonio)\b/.test(q)
    && /\b(o que (?:eu )?(?:devo |posso )?fazer|como (?:devo )?(?:agir|investir|reorganizar)|que rumo|mudo|mudar|reorganizo)\b/.test(q)
    && !/\b(voto|votar|em quem|melhor candidato|bitcoin|btc|ethereum|petr[34]|vale3|alavanc\w*|opcoes|binarias|imposto|declarar|aposentadoria)\b/.test(q)
}
export function portfolioResponse(evidence: ElectionEvidence) {
  const cases = evidence.cases.filter(c => /^\d{4}-\d{2}-\d{2}$/.test(c.date) && c.date < '2026-01-01' && /2º turno/.test(c.title) && Number.isFinite(c.move_pct))
  const historical = cases.length ? `Nos ${cases.length} segundos turnos anteriores incluídos nesta base, o Ibovespa teve estas reações no primeiro pregão: ${cases.map(c => `${c.title}: ${c.move_pct > 0 ? '+' : ''}${c.move_pct.toFixed(2).replace('.', ',')}%`).join('; ')}. Essa amostra pequena não estabelece uma regra para comprar ou vender sua carteira após uma eleição.` : 'Não há casos históricos validados suficientes nesta resposta para apontar uma direção de mercado.'
  const recommendation = '**Rumo recomendado:** não aumente o risco só por causa da eleição. Proteja o dinheiro de curto prazo e corrija concentrações antes de fazer uma nova aposta.'
  const actions = [
    '- **Se vai precisar do dinheiro em breve:** priorize liquidez e baixa oscilação nessa parcela. Se ela estiver em ativos voláteis, avalie reduzir essa exposição, considerando impostos, custos e condições de resgate.',
    '- **Se a carteira já é diversificada e voltada ao longo prazo:** mantenha o plano enquanto seus objetivos e sua capacidade de suportar perdas não mudarem. O resultado eleitoral, sozinho, não justifica desmontá-la.',
    '- **Se está concentrado em um ativo ou setor:** priorize rebalancear para os limites do seu plano, em vez de aumentar a posição por entusiasmo ou vender tudo por medo.',
  ].join('\n')
  const analysis = `**Por que esse rumo?**\n${historical}\n\n**O que ainda falta confirmar**\nEsta análise não confirma o vencedor nem a reação do mercado à eleição recente. Não estou tratando a sua menção ao resultado como uma apuração verificada. Para recomendar uma mudança específica de ativos, é preciso confirmar as medidas econômicas anunciadas, sua execução e os preços atuais, além de conhecer sua carteira.`
  const change = '**O que faria a recomendação mudar?**\nNecessidade de usar o dinheiro antes do previsto, risco acima do que você suporta ou mudança comprovada nos fundamentos dos investimentos. Uma proposta de campanha, isoladamente, não comprova essa mudança.'
  const followup = '**Para indicar o próximo ajuste concreto:** em quais ativos você está investido e quando pretende usar esse dinheiro?'
  const shortActions = [
    '- **Se vai precisar do dinheiro em breve:** priorize liquidez e baixa oscilação; reduza exposição incompatível com esse prazo, considerando custos e impostos.',
    '- **Se a carteira já é diversificada para o longo prazo:** mantenha o plano, desde que seus objetivos e sua tolerância a perdas não tenham mudado.',
    '- **Se está concentrado em um ativo ou setor:** priorize rebalancear para os limites do seu plano, em vez de apostar mais no resultado eleitoral.',
  ].join('\n')
  const short = [recommendation, '**Próximos passos**', shortActions, '**Por que essa orientação?**', historical, 'A eleição recente e sua reação de mercado ainda não estão verificadas nesta resposta. A orientação acima trata da gestão de risco; não é uma previsão pós-eleitoral.', followup].join('\n\n')
  const sources = 'Fontes da orientação: https://www.gov.br/investidor/pt-br/investir/antes-de-investir/defina-seus-objetivos/qual-o-melhor-investimento · https://www.gov.br/investidor/pt-br/investir/cuidados-ao-investir/evitando-problemas'
  const explanation = [recommendation, '**O que fazer na prática**', actions, analysis, change, followup, `Fonte dos casos: ${evidence.source}`, sources].join('\n\n')
  return { id: crypto.randomUUID(), event: { title: 'Eleição: qual rumo tomar com a carteira', detected_at: new Date().toISOString() },
    precedents: { count: 0, period: { from: '', to: '' }, items: [] }, stats: [], explanation, short: short + '\n\n' + sources,
    disclaimer: 'Orientação condicionada ao prazo, à composição da carteira e à capacidade de suportar perdas. O histórico não prevê o resultado futuro.',
    query_redacted: 'Após a eleição presidencial, o que fazer com os investimentos?', filtered: false, portfolio_version: 1 }
}
