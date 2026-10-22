/**
 * Preços e créditos (valores em centavos). Espelho do seed da tabela `plans` e de
 * `credit_config` no banco: lá é a fonte da verdade e pode mudar sem deploy;
 * aqui é o fallback para a landing renderizar instantaneamente.
 */
export type PlanId = 'basic' | 'pro';
export type Cycle = 'mensal' | 'anual';

export interface PlanConfig {
  id: PlanId;
  name: string;
  monthlyCents: number;
  annualCents: number;
  creditsPerMonth: number;
  rollover: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  basic: { id: 'basic', name: 'Basic', monthlyCents: 2990, annualCents: 29900, creditsPerMonth: 80, rollover: false },
  pro: { id: 'pro', name: 'Pro', monthlyCents: 4990, annualCents: 49900, creditsPerMonth: 150, rollover: true },
};

export const CREDIT_COST = { pergunta: 1, analise: 5 } as const;
export const TOPUP = { credits: 50, cents: 1990 };
export const TRIAL_CREDITS = 15;
export const LOW_BALANCE = 10;

// Moeda por idioma (en-US em USD no futuro: preencha os preços em USD no banco)
const CURRENCY: Record<string, string> = { 'pt-BR': 'BRL', 'en-US': 'USD' };

export function money(cents: number, locale = 'pt-BR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: CURRENCY[locale] ?? 'BRL' }).format(cents / 100);
}

/** Valor mensal equivalente do plano anual, arredondado ao centavo (299/12 = 24,92). */
export const annualMonthlyCents = (p: PlanConfig) => Math.round(p.annualCents / 12);
