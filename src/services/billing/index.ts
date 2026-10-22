import { env, hasSupabase } from '@/lib/env';
import { mockBilling } from './mockBilling';
import { liveBilling } from './liveBilling';
import type { BillingService } from './types';

/** Ponto único de troca: BILLING_MODE=mock | live (live exige Supabase). */
export const billingService: BillingService = env.billingMode === 'live' && hasSupabase ? liveBilling : mockBilling;

export * from './types';
