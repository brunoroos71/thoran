import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '@/lib/format';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  hideLabel?: boolean;
}

export const Field = forwardRef<HTMLInputElement, Props>(({ label, hint, error, hideLabel, className, id, ...rest }, ref) => {
  const auto = useId();
  const fid = id ?? auto;
  const desc = error ? `${fid}-err` : hint ? `${fid}-hint` : undefined;
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <label htmlFor={fid} className={cx('label text-nevoa', hideLabel && 'sr-only')}>
        {label}
      </label>
      <input
        ref={ref}
        id={fid}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={desc}
        className={cx(
          'h-14 w-full rounded-full border bg-grafite px-6 text-base text-texto placeholder:text-meta transition-colors',
          'focus:border-raio focus:outline-none focus-visible:outline-none',
          error ? 'border-baixa' : 'border-linha hover:border-aco',
        )}
        {...rest}
      />
      {error ? (
        <p id={`${fid}-err`} className="flex gap-2 text-sm text-baixa" role="alert">
          <span aria-hidden>✕</span>
          {error}
        </p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="text-sm text-meta">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export function Checkbox({ checked, onChange, children, id, invalid }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; id?: string; invalid?: boolean }) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <div className="flex items-start gap-3">
      <span className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center -m-3">
        <input
          id={cid}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={invalid || undefined}
          className={cx(
            'peer h-5 w-5 cursor-pointer appearance-none rounded-[4px] border bg-grafite transition-colors checked:border-raio checked:bg-raio',
            invalid ? 'border-baixa' : 'border-aco',
          )}
        />
        <svg aria-hidden viewBox="0 0 12 12" className="pointer-events-none absolute h-3 w-3 opacity-0 peer-checked:opacity-100">
          <path d="M2 6.5 5 9l5-6" fill="none" stroke="#0B0D10" strokeWidth="2" />
        </svg>
      </span>
      <label htmlFor={cid} className="text-sm leading-relaxed text-nevoa">
        {children}
      </label>
    </div>
  );
}
