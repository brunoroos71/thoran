import type { AnalysisStat } from '@/services/agent';
import { DirArrow, dirColor } from './Move';
import { cx } from '@/lib/format';

const COLS = ['', 'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3'];

export function StatList({ stats, className, size = 'md', stack }: { stats: AnalysisStat[]; className?: string; size?: 'md' | 'lg'; stack?: boolean }) {
  return (
    <dl className={cx('grid gap-px overflow-hidden rounded-card border border-linha bg-linha', !stack && COLS[stats.length === 4 ? 2 : Math.min(3, stats.length)], className)}>
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col-reverse gap-1 bg-grafite p-4">
          <dt className="text-xs leading-snug text-meta">{s.label}</dt>
          {/* valor longo (o do agente traz o caso entre parênteses) não cabe no tamanho de manchete */}
          <dd className={cx('flex items-center gap-2 font-mono font-medium tabular-nums', dirColor(s.direction), s.value.length > 14 ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl')}>
            {s.direction !== 'neutral' && <DirArrow dir={s.direction} className="text-[0.55em]" />}
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
