import { isPortfolioDecision, portfolioResponse } from './portfolio-decision';
import electionEvidence from './election-evidence.json';
import { bitcoinResponse, bitcoinToday, isBitcoinDecision } from './bitcoin';
import type { AgentChunk, AgentService, AnalysisResponse, AnalyzeRequest, Direction, Market, Relevance, StreamOptions } from './types';
import type { ScenarioResult } from './scenario-contract';
import scenarioFixtures from './scenario-fixtures.json';

/**
 * Agente simulado. Segue exatamente o contrato de types.ts.
 * Os cartões de conversa são FICTÍCIOS; a interface marca essas respostas como
 * "Exemplo ilustrativo, com dados fictícios" quando AGENT_MODE=mock.
 */
// Cenários usam uma fotografia real e fixa, identificada como demonstração na tela.
function demoScenarios(req: AnalyzeRequest): AnalysisResponse {
  const r = req.scenario_request!;
  const result = (scenarioFixtures as Record<string, ScenarioResult>)[`${r.currency}_${r.horizon}_${r.objective}`];
  if (!result) throw new Error('Cenário indisponível');
  return { id: `mock_${crypto.randomUUID()}`, event: { title: `Cenários ${r.currency}/BRL · demonstração`, detected_at: new Date().toISOString() },
    precedents: { count: 0, period: { from: '', to: '' }, items: [] }, stats: [],
    scenarios: result, explanation: result.conclusion, short: result.conclusion,
    disclaimer: 'Demonstração com fotografia histórica de 22/10/2026. Não é uma cotação atual nem recomendação de investimento.' };
}

async function demoBitcoin(signal?: AbortSignal): Promise<AnalysisResponse> {
  let study: unknown;
  try {
    const res = await fetch('/bitcoin-research.json', { signal, cache: 'no-store' });
    if (res.ok) study = await res.json();
  } catch (e) { if ((e as Error).name === 'AbortError') throw e; }
  return bitcoinResponse(study, bitcoinToday(), true);
}

const DISCLAIMER =
  'O Thoran não faz recomendação de investimento. Resultados passados não garantem resultados futuros. Operar no mercado envolve risco de perda.';

interface Scenario {
  match: RegExp;
  market: Market;
  event: string;
  relevance: Relevance;
  asset: string;
  window: string;
  count: number;
  bias: number; // tendência média do movimento em %
  pastTitles: string[];
  intro: string;
  explanation: string;
  stats: (moves: number[]) => { label: string; value: string; direction: Direction }[];
}

const countBy = (moves: number[], f: (m: number) => boolean) => moves.filter(f).length;
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const pct = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1).replace('.', ',')}%`;

const SCENARIOS: Scenario[] = [
  {
    match: /copom|selic|juros|bc |banco central/i,
    market: 'b3',
    event: 'Copom eleva a Selic acima do esperado',
    relevance: 'atencao',
    asset: 'WIN',
    window: '1h',
    count: 14,
    bias: -0.45,
    pastTitles: [
      'Copom surpreende com alta de 0,75 p.p.',
      'BC acelera ritmo de alta da Selic',
      'Selic sobe e comunicado sinaliza mais altas',
      'Copom eleva juros em meio a inflação persistente',
      'Alta de juros maior que o consenso',
      'BC endurece tom e sobe a Selic',
    ],
    intro:
      'Encontrei casos em que o Copom subiu os juros acima do que o mercado esperava. Historicamente, nesses casos, o mini-índice tendeu a cair na primeira hora após o anúncio, porque juro mais alto encarece o crédito e torna a renda fixa mais atrativa que a bolsa. ',
    explanation:
      'Quando os juros sobem mais do que o mercado esperava, empresas passam a pagar mais caro para se financiar e a renda fixa fica mais atraente. Por isso, nos casos parecidos, parte dos investidores tirou dinheiro da bolsa logo após o anúncio. A reação costuma ser mais forte quando o comunicado indica novas altas. Em alguns casos, a queda foi revertida no mesmo dia, então a janela de tempo importa.',
    stats: (m) => [
      { label: 'casos com queda na primeira hora', value: `${countBy(m, (x) => x < 0)} de ${m.length}`, direction: 'down' },
      { label: 'movimento mediano do WIN em 1h', value: pct(median(m)), direction: median(m) < 0 ? 'down' : 'up' },
      { label: 'casos com reversão no mesmo dia', value: `${Math.max(2, Math.round(m.length * 0.28))} de ${m.length}`, direction: 'neutral' },
    ],
  },
  {
    match: /payroll|emprego|eua|fed|treasur|d[oó]lar/i,
    market: 'global',
    event: 'Payroll dos EUA vem acima do esperado',
    relevance: 'media',
    asset: 'WDO',
    window: '1h',
    count: 22,
    bias: 0.35,
    pastTitles: [
      'Payroll forte reforça juros altos nos EUA',
      'Criação de vagas supera projeções',
      'Mercado de trabalho americano segue aquecido',
      'Payroll dobra a expectativa',
      'Desemprego nos EUA cai inesperadamente',
    ],
    intro:
      'Nos casos em que o payroll americano veio acima do esperado, o dólar contra o real tendeu a subir na primeira hora. Emprego forte nos EUA costuma adiar cortes de juros por lá, o que atrai dinheiro para o dólar. ',
    explanation:
      'Um payroll forte indica economia americana aquecida. Isso faz o mercado esperar juros altos por mais tempo nos EUA, e títulos americanos rendendo mais atraem capital de países emergentes como o Brasil. Nos casos parecidos, o mini-dólar subiu na maior parte das vezes, mas o tamanho do movimento variou bastante conforme o cenário doméstico.',
    stats: (m) => [
      { label: 'casos com alta do WDO em 1h', value: `${countBy(m, (x) => x > 0)} de ${m.length}`, direction: 'up' },
      { label: 'movimento mediano do WDO em 1h', value: pct(median(m)), direction: median(m) > 0 ? 'up' : 'down' },
      { label: 'casos com movimento acima de 0,5%', value: `${countBy(m, (x) => Math.abs(x) > 0.5)} de ${m.length}`, direction: 'neutral' },
    ],
  },
  {
    match: /bitcoin|btc|cripto|etf|ethereum|eth|halving/i,
    market: 'crypto',
    event: 'ETFs de bitcoin registram saída líquida recorde',
    relevance: 'atencao',
    asset: 'BTC',
    window: '1d',
    count: 11,
    bias: -1.6,
    pastTitles: [
      'Fundos de bitcoin têm semana de resgates',
      'Saída de ETFs pressiona o BTC',
      'Grandes resgates em produtos de cripto',
      'Fluxo negativo em fundos de bitcoin',
    ],
    intro:
      'Encontrei episódios com saídas fortes de fundos de bitcoin. Nos casos parecidos, o BTC tendeu a cair no dia seguinte, mas com dispersão alta: cripto oscila mais que bolsa. ',
    explanation:
      'Quando muito dinheiro sai de ETFs de bitcoin, os gestores precisam vender BTC no mercado para devolver aos cotistas, o que pressiona o preço. Nos casos parecidos, a queda no dia seguinte foi mais comum, mas cripto tem movimentos grandes nos dois sentidos, então a probabilidade aqui é menos concentrada que em outros mercados.',
    stats: (m) => [
      { label: 'casos com queda em 24h', value: `${countBy(m, (x) => x < 0)} de ${m.length}`, direction: 'down' },
      { label: 'movimento mediano do BTC em 24h', value: pct(median(m)), direction: median(m) < 0 ? 'down' : 'up' },
      { label: 'maior oscilação observada', value: pct(Math.max(...m.map(Math.abs))), direction: 'neutral' },
    ],
  },
];

const GENERIC: Scenario = {
  match: /.*/,
  market: 'b3',
  event: 'Notícia de impacto macroeconômico no Brasil',
  relevance: 'media',
  asset: 'WIN',
  window: '1h',
  count: 9,
  bias: -0.1,
  pastTitles: ['Dado de inflação surpreende', 'Fala de autoridade mexe com o mercado', 'Indicador de atividade fora do consenso'],
  intro:
    'Encontrei alguns casos parecidos com essa notícia. A amostra é menor, então vale olhar com cuidado: nos casos parecidos, o mini-índice não teve uma direção clara na primeira hora. ',
  explanation:
    'Quando a amostra é pequena e as reações se dividem, o histórico indica que o evento sozinho não costuma definir a direção do mercado. Nesses casos, outras notícias do mesmo dia tendem a pesar mais. Use essa análise como contexto, não como sinal.',
  stats: (m) => [
    { label: 'casos com queda na primeira hora', value: `${countBy(m, (x) => x < 0)} de ${m.length}`, direction: 'neutral' },
    { label: 'movimento mediano em 1h', value: pct(median(m)), direction: 'neutral' },
  ],
};

// PRNG determinístico para a mesma pergunta gerar a mesma resposta
function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function pickScenario(req: AnalyzeRequest): Scenario {
  const byText = SCENARIOS.find((s) => s.match.test(req.query));
  if (byText) return byText;
  if (req.market) return SCENARIOS.find((s) => s.market === req.market) ?? GENERIC;
  return GENERIC;
}

export function buildMockAnalysis(req: AnalyzeRequest): AnalysisResponse {
  const s = pickScenario(req);
  const rnd = seeded(req.query.toLowerCase().trim() + s.asset);
  const spread = s.market === 'crypto' ? 3.2 : 1.1;
  const moves = Array.from({ length: s.count }, () => +(s.bias + (rnd() - 0.5) * spread).toFixed(2));

  const years = Array.from({ length: s.count }, () => 2016 + Math.floor(rnd() * 10)).sort((a, b) => b - a); // 10 anos de base (2016–2025)
  const items = moves
    .map((move, i) => ({
      date: new Date(Date.UTC(years[i], Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 27), 17)).toISOString(),
      title: s.pastTitles[i % s.pastTitles.length],
      similarity: +(0.95 - i * (0.3 / s.count) - rnd() * 0.04).toFixed(2),
      asset: s.asset,
      move_pct: move,
      window: s.window,
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const points = 13;
  const nowIndex = 4;
  const path = (end: number) => {
    const out = [0];
    for (let i = 1; i < points; i++) {
      const target = (end * i) / (points - 1);
      out.push(+(target + (rnd() - 0.5) * spread * 0.35).toFixed(2));
    }
    out[points - 1] = end;
    return out;
  };
  const precedents = moves.slice(0, 6).map(path);
  const current = path(s.bias).slice(0, nowIndex + 1);

  return {
    id: `mock_${Date.now().toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`,
    event: { title: s.event, detected_at: new Date().toISOString(), relevance: s.relevance },
    precedents: { count: s.count, period: { from: '2016-01-01', to: new Date().toISOString().slice(0, 10) }, items },
    stats: s.stats(moves),
    chart: { unit: '%', now_index: nowIndex, current, precedents },
    explanation: s.explanation,
    disclaimer: DISCLAIMER,
  };
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

async function* stream(req: AnalyzeRequest, opts: StreamOptions = {}): AsyncGenerator<AgentChunk> {
  if (!req.scenario_request && isPortfolioDecision(req.query)) {
    const data = portfolioResponse(electionEvidence);
    yield { type: 'text', delta: data.short };
    yield { type: 'analysis', data };
    yield { type: 'done' };
    return;
  }
  if (!req.scenario_request && isBitcoinDecision(req.query)) {
    const data = await demoBitcoin(opts.signal);
    yield { type: 'text', delta: data.short! };
    yield { type: 'analysis', data };
    yield { type: 'done' };
    return;
  }
  if (req.scenario_request) {
    const data = demoScenarios(req);
    yield { type: 'text', delta: data.explanation };
    yield { type: 'analysis', data };
    yield { type: 'done' };
    return;
  }
  const s = pickScenario(req);
  await sleep(700, opts.signal); // "buscando precedentes"
  // pergunta rápida: só o texto, sem card de análise completa
  const quick = opts.mode === 'pergunta';
  const text = quick ? s.intro.trim() : `${s.intro}Veja os ${s.count} casos mais parecidos abaixo.`;
  for (const word of text.split(/(?<= )/)) {
    await sleep(22 + Math.random() * 40, opts.signal);
    yield { type: 'text', delta: word };
  }
  if (!quick) {
    await sleep(250, opts.signal);
    yield { type: 'analysis', data: buildMockAnalysis(req) };
  }
  yield { type: 'done' };
}

async function analyze(req: AnalyzeRequest, opts: { signal?: AbortSignal } = {}) {
  await sleep(400, opts.signal);
  if (req.scenario_request) return demoScenarios(req);
  if (isPortfolioDecision(req.query)) return portfolioResponse(electionEvidence);
  if (isBitcoinDecision(req.query)) return demoBitcoin(opts.signal);
  return buildMockAnalysis(req);
}

export const mockAgent: AgentService = { mode: 'mock', stream, analyze };
