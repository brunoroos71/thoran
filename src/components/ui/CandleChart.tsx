import { useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { cx } from '@/lib/format';
import type { Candle } from '@/services/marketService';

export interface Overlay {
  /** valores por posição (x = índice de slot, começando em startSlot) */
  values: number[];
  startSlot: number;
  className: string;
  width?: number;
  dash?: string;
}

interface Props {
  candles: Candle[];
  /** slots vazios à direita (para projeções/precedentes) */
  extraSlots?: number;
  overlays?: Overlay[];
  /** linha vertical "agora" após o último candle */
  nowLabel?: string;
  height?: number;
  label: string;
  format?: (v: number) => string;
  formatTime?: (t: number) => string;
  axis?: boolean;
  className?: string;
}

/**
 * Gráfico de velas em SVG. Alta = vela vazada (contorno), baixa = vela cheia:
 * a direção se lê pela forma, não só pela cor. Passe o mouse para ver OHLC.
 */
export function CandleChart({ candles, extraSlots = 0, overlays = [], nowLabel, height = 220, label, format = (v) => v.toFixed(2), formatTime, axis = true, className }: Props) {
  const clip = useId();
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = height;
  const pad = { t: 14, r: axis ? 64 : 8, b: 14, l: 8 };
  const slots = candles.length + extraSlots;

  const { min, max } = useMemo(() => {
    const vals = [...candles.flatMap((c) => [c.h, c.l]), ...overlays.flatMap((o) => o.values)];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const m = (hi - lo) * 0.08 || 1;
    return { min: lo - m, max: hi + m };
  }, [candles, overlays]);

  const sw = (W - pad.l - pad.r) / slots;
  const x = (i: number) => pad.l + sw * (i + 0.5);
  const y = (v: number) => pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b);
  const ticks = [max - (max - min) * 0.08, (max + min) / 2, min + (max - min) * 0.08];
  const bw = Math.max(1.5, sw * 0.62);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.floor((px - pad.l) / sw);
    setHover(i >= 0 && i < candles.length ? i : null);
  };

  const hc = hover != null ? candles[hover] : null;
  const last = candles[candles.length - 1];

  return (
    <figure className={cx('relative w-full', className)}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none select-none" role="img" aria-label={label} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          <clipPath id={clip}>
            <rect x={pad.l} y={0} width={W - pad.l - pad.r} height={H} />
          </clipPath>
        </defs>
        {axis &&
          ticks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="stroke-linha" strokeDasharray="2 5" />
              <text x={W - pad.r + 8} y={y(v) + 4} className="fill-meta font-mono text-[11px]">
                {format(v)}
              </text>
            </g>
          ))}
        <g clipPath={`url(#${clip})`}>
          {candles.map((c, i) => {
            const up = c.c >= c.o;
            const top = y(Math.max(c.o, c.c));
            const h = Math.max(1, Math.abs(y(c.o) - y(c.c)));
            return (
              <g key={c.t} className={up ? 'text-alta' : 'text-baixa'} opacity={hover == null || hover === i ? 1 : 0.55}>
                <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke="currentColor" strokeWidth={1} />
                <rect x={x(i) - bw / 2} y={top} width={bw} height={h} rx={0.5} fill={up ? '#0B0D10' : 'currentColor'} stroke="currentColor" strokeWidth={1} />
              </g>
            );
          })}
          {overlays.map((o, k) => (
            <path
              key={k}
              d={o.values.map((v, i) => `${i ? 'L' : 'M'}${x(o.startSlot + i).toFixed(1)},${y(v).toFixed(1)}`).join('')}
              fill="none"
              className={o.className}
              strokeWidth={o.width ?? 1.25}
              strokeDasharray={o.dash}
            />
          ))}
        </g>
        {/* preço atual */}
        {axis && last && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={y(last.c)} y2={y(last.c)} className="stroke-raio/50" strokeDasharray="1 3" />
            <rect x={W - pad.r + 2} y={y(last.c) - 9} width={pad.r - 4} height={18} rx={4} className="fill-raio" />
            <text x={W - pad.r + 8} y={y(last.c) + 4} className="fill-carbono font-mono text-[11px] font-medium">
              {format(last.c)}
            </text>
          </g>
        )}
        {nowLabel && (
          <g>
            <line x1={x(candles.length - 0.5)} x2={x(candles.length - 0.5)} y1={pad.t} y2={H - pad.b} className="stroke-trovao" strokeDasharray="3 3" />
            <text x={x(candles.length - 0.5) + 6} y={pad.t + 10} className="fill-trovao font-mono text-[10px] uppercase tracking-widest">
              {nowLabel}
            </text>
          </g>
        )}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} className="stroke-nevoa/40" />}
      </svg>
      {hc && (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-lg border border-linha bg-carbono/95 px-3 py-2 font-mono text-[11px] leading-relaxed shadow-xl"
          style={{ left: `${(x(hover!) / W) * 100}%`, transform: `translateX(${hover! > candles.length / 2 ? '-110%' : '10%'})` }}
        >
          {formatTime && <p className="text-meta">{formatTime(hc.t)}</p>}
          <p className="text-nevoa">
            A {format(hc.o)} · F <span className={hc.c >= hc.o ? 'text-alta' : 'text-baixa'}>{hc.c >= hc.o ? '▲' : '▼'} {format(hc.c)}</span>
          </p>
          <p className="text-meta">
            Máx {format(hc.h)} · Mín {format(hc.l)}
          </p>
        </div>
      )}
    </figure>
  );
}
