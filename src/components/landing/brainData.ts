/**
 * Amostra da base de conhecimento do Thoran (o "Mega Brain"), espelhando as pastas do vault:
 * pessoas, imprensa, dados, política, mercados de previsão, ciência, eventos e a linha do tempo.
 * Só rótulos: serve para desenhar o grafo da landing.
 */
export interface BrainHub {
  id: string;
  label: string;
  /** posição do centro do grupo no mundo 0..1 (x) e 0..1 (y) */
  x: number;
  y: number;
  spread: number;
  nodes: string[];
}

export const BRAIN_CENTER = 'Mega Brain — Trade';

export const BRAIN_HUBS: BrainHub[] = [
  {
    id: 'imprensa',
    label: 'Imprensa',
    x: 0.25,
    y: 0.3,
    spread: 0.13,
    nodes: ['Bloomberg Línea', 'Valor Econômico', 'Folha de S.Paulo', 'O Globo', 'Estadão', 'Reuters', 'CNN Brasil', 'InfoMoney', 'Exame', 'Brazil Journal', 'Money Times', 'The Economist', 'Financial Times', 'The Wall Street Journal', 'Poder360', 'JOTA', 'Agência Brasil', 'CNBC', 'Investing.com', 'Metrópoles', 'Gazeta do Povo', 'NeoFeed', 'Pipeline', 'Broadcast', 'Bloomberg Terminal'],
  },
  {
    id: 'pessoas',
    label: 'Pessoas',
    x: 0.2,
    y: 0.66,
    spread: 0.14,
    nodes: ['Roberto Campos Neto', 'Gabriel Galípolo', 'Fernando Haddad', 'Jerome Powell', 'Luis Stuhlberger', 'Rogério Xavier', 'Mansueto Almeida', 'Armínio Fraga', 'Henrique Meirelles', 'Alexandre Schwartsman', 'Zeina Latif', 'Samuel Pessôa', 'Felipe Salto', 'Marcos Mendes', 'Christine Lagarde', 'Ray Dalio', 'Howard Marks', 'Janet Yellen', 'Paul Tudor Jones', 'Stanley Druckenmiller', 'Ilan Goldfajn', 'Kevin Warsh'],
  },
  {
    id: 'podcasts',
    label: 'Programas e podcasts',
    x: 0.4,
    y: 0.38,
    spread: 0.09,
    nodes: ['Market Makers', 'Stock Pickers', 'Podcast Rio Bravo', 'Café da Manhã', 'O Assunto', 'Odd Lots', 'Macro Musings', 'Thoughts on the Market', 'The Compound', 'Top Traders Unplugged'],
  },
  {
    id: 'dados',
    label: 'Dados e ferramentas',
    x: 0.58,
    y: 0.34,
    spread: 0.11,
    nodes: ['B3 — dados de mercado', 'Banco Central — SGS', 'Focus (Expectativas)', 'IBGE — SIDRA', 'FRED', 'CME FedWatch', 'Tesouro Direto', 'CVM — Dados Abertos', 'Ipeadata', 'Google Trends', 'ANBIMA — ETTJ', 'CFTC — COT', 'TradingView', 'python-bcb', 'yfinance', 'Polymarket API'],
  },
  {
    id: 'politica',
    label: 'Política e eleições',
    x: 0.42,
    y: 0.12,
    spread: 0.1,
    nodes: ['TSE — Resultados', 'Câmara dos Deputados — Dados Abertos', 'Senado Federal', 'Congresso em Foco', 'Datafolha', 'Quaest', 'AtlasIntel', 'Ipespe', 'Agregador de pesquisas', 'Portal da Transparência', 'Diário Oficial da União', 'STF — pautas'],
  },
  {
    id: 'previsao',
    label: 'Mercados de previsão',
    x: 0.6,
    y: 0.7,
    spread: 0.08,
    nodes: ['Polymarket', 'Kalshi', 'PredictIt', 'Metaculus', 'Manifold', 'Betfair Exchange', 'Good Judgment'],
  },
  {
    id: 'ciencia',
    label: 'Ciência e regras',
    x: 0.44,
    y: 0.86,
    spread: 0.11,
    nodes: ['Look-ahead bias', 'Overfitting em backtest', 'Wolfers & Zitzewitz (2004)', 'Event study (MacKinlay 1997)', 'Fama (1970)', 'Shiller (1981)', 'Kahneman & Tversky (1979)', 'Brier score', 'Resolução CVM 20', 'Lei 14.790/2023', 'Mini-índice WIN — especificação', 'Mini-dólar WDO — especificação'],
  },
  {
    id: 'eventos',
    label: 'Eventos',
    x: 0.42,
    y: 0.6,
    spread: 0.08,
    nodes: ['Copom — comunicado e ata', 'Payroll EUA', 'IPCA', 'FOMC', 'PIB trimestral', 'Relatório Focus', 'Leilão do Tesouro', 'Vencimento de opções B3', 'Balanços Petrobras', 'Halving do bitcoin'],
  },
  {
    id: 'produto',
    label: 'Produto',
    x: 0.8,
    y: 0.2,
    spread: 0.07,
    nodes: ['O que a IA pode e não pode', 'Protótipo do agente', 'Checklist de lançamento', 'Como medir acerto', 'Regras de compliance', 'Repertório para trader iniciante'],
  },
  {
    id: 'linha',
    label: 'Linha do tempo 2016–2026',
    x: 0.84,
    y: 0.62,
    spread: 0.1,
    nodes: [
      '2016-08-31 · Impeachment',
      '2017-05-18 · Joesley Day',
      '2018-05-21 · Greve dos caminhoneiros',
      '2018-10-28 · 2º turno 2018',
      '2020-03-09 · Circuit breaker na B3',
      '2020-08-05 · Selic a 2%',
      '2021-03-17 · Copom inicia ciclo de alta',
      '2022-02-24 · Rússia invade a Ucrânia',
      '2022-10-30 · 2º turno 2022',
      '2023-03-10 · Quebra do SVB',
      '2024-01-10 · ETFs de bitcoin aprovados',
      '2024-12-11 · Copom sobe 1 p.p.',
      '2025-04-02 · Tarifas dos EUA',
    ],
  },
];

/** Ligações entre grupos (além de cada nó ligado ao seu grupo). */
export const BRAIN_BRIDGES: [string, string][] = [
  ['eventos', 'linha'],
  ['politica', 'linha'],
  ['dados', 'eventos'],
  ['imprensa', 'pessoas'],
  ['imprensa', 'eventos'],
  ['ciencia', 'previsao'],
  ['previsao', 'politica'],
  ['podcasts', 'pessoas'],
  ['produto', 'ciencia'],
  ['dados', 'previsao'],
];
