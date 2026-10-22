import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '@/lib/format';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  label: string;
  busy?: boolean;
  onStop?: () => void;
  stopLabel?: string;
  /** controles extras à esquerda (tipo de resposta, mercado) */
  tools?: ReactNode;
  /** texto discreto ao lado do botão (ex.: custo em créditos) */
  hint?: ReactNode;
  autoFocus?: boolean;
  size?: 'lg' | 'md';
}

/** Caixa de mensagem estilo ChatGPT/Claude: cresce com o texto, Enter envia, Shift+Enter quebra linha. */
export function Composer({ value, onChange, onSubmit, placeholder, label, busy, onStop, stopLabel, tools, hint, autoFocus, size = 'md' }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);
  useEffect(() => {
    if (autoFocus && matchMedia('(pointer: fine)').matches) ref.current?.focus();
  }, [autoFocus]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) onSubmit();
      }}
      className="rounded-[28px] border border-linha/80 bg-grafite/55 shadow-[0_20px_60px_-30px_rgba(0,0,0,.8)] backdrop-blur-xl transition-colors focus-within:border-aco"
    >
      <label htmlFor="composer" className="sr-only">
        {label}
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (!busy && value.trim()) onSubmit();
          }
        }}
        placeholder={placeholder}
        className={cx('block w-full resize-none bg-transparent px-5 text-texto placeholder:text-meta focus:outline-none focus-visible:outline-none', size === 'lg' ? 'pt-5 text-lg' : 'pt-4 text-base')}
      />
      <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">{tools}</div>
        <div className="flex shrink-0 items-center gap-3">
          {hint && <span className="hidden text-xs text-meta sm:inline">{hint}</span>}
          {busy ? (
            <button type="button" onClick={onStop} aria-label={stopLabel} className="flex h-10 w-10 items-center justify-center rounded-full bg-texto text-carbono">
              <span aria-hidden className="h-3 w-3 rounded-[2px] bg-carbono" />
            </button>
          ) : (
            <button type="submit" disabled={!value.trim()} aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full bg-raio text-carbono transition-colors hover:bg-texto disabled:bg-linha disabled:text-meta">
              <svg aria-hidden width="18" height="18" viewBox="0 0 18 18">
                <path d="M9 15V3M4 8l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

/** Chips de sugestão abaixo da caixa. */
export function Suggestions({ items, onPick }: { items: string[]; onPick: (s: string) => void }) {
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {items.map((s) => (
        <li key={s}>
          <button type="button" onClick={() => onPick(s)} className="rounded-full border border-linha/80 bg-carbono/40 px-4 py-2 text-left text-sm text-nevoa backdrop-blur-md transition-colors hover:border-aco hover:bg-grafite/70 hover:text-texto">
            {s}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Saudação central do estado vazio. */
export function Greeting({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
      {sub && <p className="max-w-xl text-nevoa">{sub}</p>}
    </div>
  );
}
