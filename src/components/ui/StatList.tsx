import type { AnalysisStat } from '@/services/agent';
import { DirArrow, dirColor } from './Move';
import { cx } from '@/lib/format';

const COLS = ['', 'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3'];

export function StatList({ stats, className, size = 'md', stack }: { stats: AnalysisStat[]; className?: string; size?: 'md' | 'lg'; stack?: boolean }) {
  return (
    <dl className={cx('grid gap-px overflow-hidden rounded-card border border-linha bg-linha', !stack && COLS[Math.min(3, stats.length)], className)}>
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col-reverse gap-1 bg-grafite p-4">
          <dt className="text-xs leading-snug text-meta">{s.label}</dt>
          <dd className={cx('flex items-center gap-2 font-mono font-medium tabular-nums', dirColor(s.direction), size === 'lg' ? 'text-3xl' : 'text-xl')}>
            <DirArrow dir={s.direction} className="text-[0.55em]" />
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
