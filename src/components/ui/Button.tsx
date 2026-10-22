import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cx } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse';
type Size = 'md' | 'lg' | 'xl';

const base =
  'group relative inline-flex items-center justify-center gap-3 overflow-hidden font-semibold tracking-tight transition-[transform,background-color,color,border-color] duration-300 ease-out active:scale-[.98] disabled:pointer-events-none disabled:opacity-60 min-h-[44px] rounded-full';
const variants: Record<Variant, string> = {
  primary: 'bg-raio text-carbono hover:bg-texto',
  secondary: 'border border-linha text-texto hover:border-texto hover:bg-texto hover:text-carbono',
  ghost: 'text-texto hover:text-raio',
  inverse: 'bg-carbono text-texto hover:bg-grafite',
};
const sizes: Record<Size, string> = {
  md: 'px-5 text-sm',
  lg: 'px-7 h-14 text-base',
  xl: 'px-9 h-16 text-lg',
};

export const btnClass = (v: Variant = 'primary', s: Size = 'md', extra?: string) => cx(base, variants[v], sizes[s], extra);

function Arrow() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" className="transition-transform duration-300 group-hover:translate-x-1">
      <path d="M2 9h13M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

interface Common {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Common & ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ variant, size, arrow, className, children, ...rest }, ref) => (
    <button ref={ref} className={btnClass(variant, size, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  ),
);

export function ButtonLink({ variant, size, arrow, className, children, ...rest }: Common & LinkProps) {
  return (
    <Link className={btnClass(variant, size, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}
