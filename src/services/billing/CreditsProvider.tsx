import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { billingService } from './index';
import { CreditError, type BillingState, type ConsumeKind } from './types';

interface CreditsValue {
  state: BillingState | null;
  refresh(): Promise<void>;
  /** Abre o modal de saldo insuficiente. */
  askTopup(cost: number): void;
  modal: { cost: number } | null;
  closeModal(): void;
  /**
   * Executa uma ação paga. No mock, debita aqui e estorna se falhar (simulando o servidor).
   * No live, o /agent-proxy debita; aqui só checamos o saldo antes, para não chamar à toa.
   */
  charge<T>(kind: ConsumeKind, ref: string, run: () => Promise<T>): Promise<T>;
}

const Ctx = createContext<CreditsValue | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BillingState | null>(null);
  const [modal, setModal] = useState<{ cost: number } | null>(null);
  const refresh = useCallback(async () => setState(await billingService.getState()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const charge = useCallback(
    async <T,>(kind: ConsumeKind, ref: string, run: () => Promise<T>) => {
      const s = state ?? (await billingService.getState());
      const cost = kind === 'consumo_analise' ? s.costs.analise : s.costs.pergunta;
      if (s.balance < cost) {
        setModal({ cost });
        throw new CreditError('credits', s.balance);
      }
      if (billingService.consume) {
        try {
          await billingService.consume(kind, ref);
        } catch (e) {
          if (e instanceof CreditError && e.code === 'credits') setModal({ cost });
          await refresh();
          throw e;
        }
        await refresh();
        try {
          return await run();
        } catch (e) {
          await billingService.refund?.(ref);
          await refresh();
          throw e;
        }
      }
      try {
        return await run();
      } finally {
        await refresh();
      }
    },
    [state, refresh],
  );

  const value = useMemo(() => ({ state, refresh, modal, askTopup: (cost: number) => setModal({ cost }), closeModal: () => setModal(null), charge }), [state, refresh, modal, charge]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCredits() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCredits fora do CreditsProvider');
  return v;
}
