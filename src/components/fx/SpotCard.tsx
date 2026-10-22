import type { HTMLAttributes, PointerEvent } from 'react';
import { cx } from '@/lib/format';

/** Card .spot: borda e fundo acendem sob o cursor. */
export function SpotCard({ className, as: Tag = 'div', onPointerMove, ...rest }: HTMLAttributes<HTMLElement> & { as?: 'div' | 'li' | 'article' }) {
  const move = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
    onPointerMove?.(e);
  };
  return <Tag className={cx('spot', className)} onPointerMove={move} {...rest} />;
}
