/**
 * CONTRATO COM A API DO AGENTE (POST /analyze).
 * Não altere sem combinar com quem constrói a API real. Ver README › "Contrato do agente".
 * O agente real (função analyze, repositório trade-agent) não manda relevância nem semelhança, e o gráfico dele é só
 * do passado; por isso esses campos são opcionais.
 */
import type { BitcoinStudy } from './bitcoin';
import type { ScenarioRequest, ScenarioResult } from './scenario-contract';
export type Market = 'b3' | 'crypto' | 'global';
export type Relevance = 'baixa' | 'media' | 'atencao';
export type Direction = 'down' | 'up' | 'neutral';

export interface AnalyzeRequest {
  query: string;
  market: Market | null;
  locale: 'pt-BR' | 'en-US';
  scenario_request?: ScenarioRequest;
}

export interface PrecedentItem {
  date: string; // ISO 8601
  title: string;
  similarity?: number; // 0..1 (o agente real não mede semelhança)
  asset: string;
  move_pct: number; // na unidade de `unit`
  unit?: string; // '%' (padrão) ou 'p.b.' (juros, em pontos-base)
  window: string; // "1h", "pregão da reação"...
}

export interface AnalysisStat {
  label: string;
  value: string;
  direction: Direction;
}

export interface AnalysisResponse {
  id: string;
  event: { title: string; detected_at: string; relevance?: Relevance };
  precedents: {
    count: number;
    period: { from: string; to: string };
    items: PrecedentItem[];
  };
  stats: AnalysisStat[];
  /** Só o passado: o caminho de cada caso, com o evento em now_index. `current` fica vazio no agente real. */
  chart?: {
    unit: string;
    now_index: number;
    current: number[];
    precedents: number[][];
  };
  explanation: string; // Markdown simples: **título**, listas, links
  short?: string; // a versão curta (3 linhas), a que o chat mostra
  source?: string; // de onde vêm os números do cartão
  disclaimer?: string; // o front exibe o aviso padrão se vier vazio
  bitcoin_study?: BitcoinStudy;
  bitcoin_version?: number;
  portfolio_version?: number;
  scenarios?: ScenarioResult;
}

/** Pedaços do streaming: texto aos poucos e, ao final, um ou mais objetos de análise. */
export type AgentChunk =
  | { type: 'text'; delta: string }
  | { type: 'analysis'; data: AnalysisResponse }
  | { type: 'done' };

export type AgentErrorCode = 'offline' | 'credits' | 'blocked' | 'unauthorized' | 'generic';

export class AgentError extends Error {
  constructor(public code: AgentErrorCode, message?: string, public balance?: number) {
    super(message ?? code);
  }
}

/** Fora do contrato da API do agente: só o /agent-proxy usa, para saber quanto debitar. */
export type AgentCallMode = 'pergunta' | 'analise';
export interface StreamOptions {
  signal?: AbortSignal;
  mode?: AgentCallMode;
}

/** Interface única. mockAgent e liveAgent implementam exatamente isto. */
export interface AgentService {
  readonly mode: 'mock' | 'live';
  stream(req: AnalyzeRequest, opts?: StreamOptions): AsyncGenerator<AgentChunk>;
  analyze(req: AnalyzeRequest, opts?: { signal?: AbortSignal }): Promise<AnalysisResponse>;
}
