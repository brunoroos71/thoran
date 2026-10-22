import type { ReactNode } from 'react';
import { cx } from '@/lib/format';
import type { Relevance } from '@/services/agent';

export function Badge({ children, tone = 'line', className }: { children: ReactNode; tone?: 'line' | 'trovao' | 'raio'; className?: string }) {
  const tones = {
    line: 'border-linha text-nevoa',
    trovao: 'border-trovao/50 text-trovao',
    raio: 'border-raio/40 text-raio',
  };
  return <span className={cx('label inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]', tones[tone], className)}>{children}</span>;
}

export function RelevanceBadge({ level, label }: { level: Relevance; label: string }) {
  const tone = level === 'atencao' ? 'trovao' : level === 'media' ? 'raio' : 'line';
  return (
    <Badge tone={tone}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

/** Marca obrigatória para dados de exemplo. */
export function IllustrativeTag({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cx('label flex items-center gap-2 text-[10px] text-meta', className)}>
      <span aria-hidden className="inline-block h-2 w-2 stripes" />
      {text}
    </p>
  );
}
