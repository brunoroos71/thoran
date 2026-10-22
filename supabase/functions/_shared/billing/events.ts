// Eventos normalizados: cada gateway (Stripe, mock) traduz os seus para este formato.
export type PlanId = 'basic' | 'pro';
export type Cycle = 'mensal' | 'anual';

export type BillingEvent =
  | { type: 'subscription.activated'; userId: string; plan: PlanId; cycle: Cycle; periodStart: string; periodEnd: string; gatewaySubscriptionId: string | null; gatewayCustomerId?: string | null; paymentId: string; amountCents: number; autoRenew: boolean }
  | { type: 'invoice.paid'; userId: string; periodStart: string; periodEnd: string; paymentId: string; amountCents: number } // renovação
  | { type: 'topup.paid'; userId: string; paymentId: string; amountCents: number }
  | { type: 'payment.failed'; userId: string; paymentId: string }
  | { type: 'subscription.cancel_requested'; userId: string } // continua até o fim do período
  | { type: 'subscription.resumed'; userId: string } // desistiu do cancelamento antes do fim do período
  | { type: 'subscription.synced'; userId: string; plan: PlanId; cycle: Cycle; periodStart: string; periodEnd: string } // mudança feita no gateway (ex.: troca de ciclo)
  | { type: 'subscription.ended'; userId: string }; // período acabou (cancelada) ou gateway encerrou
