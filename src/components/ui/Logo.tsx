import { cx } from '@/lib/format';

// Brand design A2: vértices na grade 64. Recorte do símbolo: x 8–56, y 8–58.
export const SYMBOL_POINTS = '8,8 56,8 56,18 40,18 34,30 44,30 24,58 28,40 20,40 26,18 8,18';

type Tone = 'dark' | 'light' | 'mono-light' | 'mono-dark';
const TONES: Record<Tone, { symbol: string; word: string }> = {
  dark: { symbol: 'fill-raio', word: 'text-texto' }, // padrão: fundo escuro
  light: { symbol: 'fill-raio-claro', word: 'text-carbono' },
  'mono-light': { symbol: 'fill-texto', word: 'text-texto' },
  'mono-dark': { symbol: 'fill-carbono', word: 'text-carbono' },
};

export function Symbol({ size = 32, tone = 'dark', className, title }: { size?: number; tone?: Tone; className?: string; title?: string }) {
  return (
    <svg
      viewBox="8 8 48 50"
      width={(size * 48) / 50}
      height={size}
      className={cx(TONES[tone].symbol, className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <polygon points={SYMBOL_POINTS} />
    </svg>
  );
}

/** Wordmark: Space Grotesk 600, caixa alta, 0.08em. */
export function Wordmark({ height = 16, tone = 'dark', className }: { height?: number; tone?: Tone; className?: string }) {
  // altura de versal ≈ 0.7em na Space Grotesk
  return (
    <span className={cx('font-brand font-semibold uppercase tracking-brand leading-none', TONES[tone].word, className)} style={{ fontSize: height / 0.7 }}>
      Thoran
    </span>
  );
}

/** Lockup horizontal (principal) e vertical. Versal = 50% do símbolo; espaço = 1X (20% do símbolo). */
export function Logo({ size = 32, tone = 'dark', variant = 'horizontal', className }: { size?: number; tone?: Tone; variant?: 'horizontal' | 'vertical'; className?: string }) {
  const x = size * 0.2;
  return (
    <span
      className={cx('inline-flex items-center', variant === 'vertical' && 'flex-col', className)}
      style={{ gap: x }}
      aria-label="Thoran"
      role="img"
    >
      <Symbol size={size} tone={tone} />
      <Wordmark height={size / 2} tone={tone} />
    </span>
  );
}
