import { admin } from '../supabase.ts';

/**
 * Gancho de nota fiscal. Toda cobrança confirmada vira uma linha em `invoices` com status
 * 'pendente_emissao'. Quando o emissor for definido [EMISSOR DE NOTA A DEFINIR] (ex.: eNotas,
 * NFE.io, Focus NFe), implemente `issue` e chame-o aqui ou num cron que processa as pendentes.
 */
export async function recordInvoice(userId: string, amountCents: number, description: string, gatewayPaymentId: string) {
  await admin.from('invoices').upsert({ user_id: userId, amount_cents: amountCents, description, gateway_payment_id: gatewayPaymentId }, { onConflict: 'gateway_payment_id', ignoreDuplicates: true });
  // await issue(...)  ← emissor a definir
}
