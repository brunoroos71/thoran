import { cx, fmtMove } from '@/lib/format';
import type { Direction } from '@/services/agent';

/** Alta/baixa SEMPRE com seta + sinal, nunca só pela cor. */
export function DirArrow({ dir, className }: { dir: Direction; className?: string }) {
  const label = dir === 'up' ? 'alta' : dir === 'down' ? 'queda' : 'estável';
  return (
    <span className={cx('inline-block font-mono', className)} aria-label={label} role="img">
      {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '■'}
    </span>
  );
}

export const dirColor = (d: Direction) => (d === 'up' ? 'text-alta' : d === 'down' ? 'text-baixa' : 'text-nevoa');
export const dirOf = (v: number): Direction => (v > 0 ? 'up' : v < 0 ? 'down' : 'neutral');

export function Move({ value, unit, className }: { value: number; unit?: string; className?: string }) {
  const d = dirOf(value);
  return (
    <span className={cx('inline-flex items-center gap-1.5 font-mono tabular-nums', dirColor(d), className)}>
      <DirArrow dir={d} className="text-[0.7em]" />
      {fmtMove(value, unit)}
    </span>
  );
}
