import { useI18n } from '@/i18n';
import { cx } from '@/lib/format';
import type { Cycle } from '@/config/pricing';

/** Seletor Mensal / Anual (pílula com indicador deslizante). */
export function CycleToggle({ value, onChange }: { value: Cycle; onChange: (c: Cycle) => void }) {
  const { t } = useI18n();
  const opts: [Cycle, string][] = [
    ['mensal', t.pricing.monthly],
    ['anual', t.pricing.annual],
  ];
  return (
    <div role="radiogroup" aria-label={`${t.pricing.monthly} / ${t.pricing.annual}`} className="relative inline-grid grid-cols-2 rounded-full border border-linha bg-grafite p-1">
      <span aria-hidden className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-texto transition-transform duration-300 ease-[cubic-bezier(.2,.7,.1,1)]" style={{ transform: value === 'anual' ? 'translateX(100%)' : 'none' }} />
      {opts.map(([c, label]) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          onClick={() => onChange(c)}
          className={cx('relative z-10 flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors', value === c ? 'text-carbono' : 'text-nevoa hover:text-texto')}
        >
          {label}
          {c === 'anual' && <span className={cx('rounded-full px-2 py-0.5 text-[11px]', value === c ? 'bg-carbono text-raio' : 'bg-raio/15 text-raio')}>{t.pricing.twoFree}</span>}
        </button>
      ))}
    </div>
  );
}
