import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import ptBR, { type Dict } from './pt-BR';
import enUS from './en-US';

export type Locale = 'pt-BR' | 'en-US';
export const LOCALES: Locale[] = ['pt-BR', 'en-US'];

function merge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== 'object' || Array.isArray(base)) return (over as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over)) out[k] = merge((base as Record<string, unknown>)[k], v);
  return out as T;
}

const dicts: Record<Locale, Dict> = { 'pt-BR': ptBR, 'en-US': merge(ptBR, enUS) };

interface I18nValue {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
}

const I18nCtx = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // pt-BR primeiro; en-US entra quando a tradução estiver completa.
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const value = useMemo(() => ({ locale, t: dicts[locale], setLocale }), [locale]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const v = useContext(I18nCtx);
  if (!v) throw new Error('useI18n fora do I18nProvider');
  return v;
}
