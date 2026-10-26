import { isScenarioRequest, type ScenarioRequest } from './scenario-contract.ts';
export { isScenarioRequest, scenarioQuestion } from './scenario-contract.ts';

/** Um agente antigo não pode transformar silenciosamente a comparação em uma resposta comum paga. */
export function matchesScenarioResponse(value: unknown, request: ScenarioRequest): boolean {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  if (s.version !== 1 || !isScenarioRequest(s.request)) return false;
  if (s.request.currency !== request.currency || s.request.horizon !== request.horizon || s.request.objective !== request.objective) return false;
  const source = s.source as Record<string, unknown> | undefined;
  if (typeof s.conclusion !== 'string' || typeof s.method !== 'string' || typeof s.as_of !== 'string' ||
    !source || typeof source.name !== 'string' || typeof source.url !== 'string' || !source.url.startsWith('https://') ||
    !Array.isArray(s.limitations) || !s.limitations.every(l => typeof l === 'string') || !Array.isArray(s.scenarios)) return false;
  if (s.status === 'insufficient') return s.scenarios.length === 0;
  if (s.status !== 'ready' || s.scenarios.length !== 2 || !s.evidence || typeof s.evidence !== 'object') return false;
  const e = s.evidence as Record<string, unknown>;
  if (typeof e.from !== 'string' || typeof e.to !== 'string' ||
    !['observations', 'windows', 'excluded_windows', 'reference_rate', 'amplitude_pct', 'min_pct', 'median_pct', 'max_pct'].every(k => typeof e[k] === 'number' && Number.isFinite(e[k]))) return false;
  return s.scenarios.every((row, i) => row && row.id === (i === 0 ? 'A' : 'B') &&
    typeof row.title === 'string' && typeof row.impact === 'string' && typeof row.conditions === 'string' &&
    typeof row.change_pct === 'number' && Number.isFinite(row.change_pct) &&
    typeof row.reference_rate === 'number' && Number.isFinite(row.reference_rate));
}
