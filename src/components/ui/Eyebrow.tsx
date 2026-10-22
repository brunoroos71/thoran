import type { ReactNode } from 'react';
import { cx } from '@/lib/format';

/** Rótulo mono em raio, como "A1 · SISTEMA DE LOGO". */
export function Eyebrow({ children, className, tone = 'raio' }: { children: ReactNode; className?: string; tone?: 'raio' | 'meta' }) {
  return <p className={cx('label', tone === 'raio' ? 'text-raio' : 'text-meta', className)}>{children}</p>;
}
