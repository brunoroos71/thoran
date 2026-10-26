/** Contrato v1, também usado por thoran/src/services/agent/scenario-contract.ts. */
export type ScenarioRequest = {
  currency: 'USD' | 'EUR'
  horizon: 5 | 20 | 60
  objective: 'pay' | 'receive' | 'compare'
}
export type ScenarioResult = {
  version: 1
  status: 'ready' | 'insufficient'
  request: ScenarioRequest
  as_of: string
  source: { name: string; url: string }
  evidence?: {
    from: string; to: string; observations: number; windows: number; excluded_windows: number
    reference_rate: number; amplitude_pct: number; min_pct: number; median_pct: number; max_pct: number
  }
  scenarios: { id: 'A' | 'B'; title: string; change_pct: number; reference_rate: number; impact: string; conditions: string }[]
  conclusion: string
  limitations: string[]
  method: string
}

export function isScenarioRequest(x: unknown): x is ScenarioRequest {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false
  const o = x as Record<string, unknown>
  return Object.keys(o).length === 3 && typeof o.currency === 'string' && ['USD', 'EUR'].includes(o.currency) &&
    [5, 20, 60].includes(o.horizon as number) && typeof o.objective === 'string' && ['pay', 'receive', 'compare'].includes(o.objective)
}

export function scenarioQuestion(r: ScenarioRequest): string {
  const objective = { pay: 'pagar em moeda estrangeira', receive: 'receber em moeda estrangeira', compare: 'comparar risco cambial' }
  return `Cenários ${r.currency}/BRL · ${r.horizon} observações · ${objective[r.objective]}`
}
