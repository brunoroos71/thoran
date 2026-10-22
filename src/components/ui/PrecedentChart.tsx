import { useId } from 'react';
import type { AnalysisResponse } from '@/services/agent';
import { cx, fmtMove } from '@/lib/format';

interface Props {
  chart: NonNullable<AnalysisResponse['chart']>;
  label: string;
  dayLabel: string;
  pastLabel: string;
  className?: string;
  height?: number;
}

/**
 * Só o passado: o caminho de cada caso parecido, de antes a depois do evento (marcado em now_index), a partir do
 * fechamento da véspera. Sem vela de "hoje", sem preço de agora e sem projetar os casos para a frente
 * (Regras do agente, N2 e N6). `chart.current` é ignorado.
 */
export function PrecedentChart({ chart, label, dayLabel, pastLabel, className, height = 220 }: Props) {
  const clip = useId();
  const paths = chart.precedents.filter((p) => p.length > 1);
  if (!paths.length) return null;

  const W = 640;
  const H = height;
  const pad = { t: 14, r: 64, b: 14, l: 8 };
  const n = Math.max(...paths.map((p) => p.length));
  const vals = [0, ...paths.flat()];
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const m = (hi - lo) * 0.08 || 1;
  const min = lo - m;
  const max = hi + m;
  const x = (i: number) => pad.l + ((W - pad.l - pad.r) * i) / (n - 1);
  const y = (v: number) => pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b);
  const ticks = [max - (max - min) * 0.08, 0, min + (max - min) * 0.08];
  const fmt = (v: number) => fmtMove(Number(v.toFixed(1)), chart.unit);
  const day = Math.min(Math.max(chart.now_index, 0), n - 1);

  return (
    <figure className={cx('w-full', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="img" aria-label={label}>
        <defs>
          <clipPath id={clip}>
            <rect x={pad.l} y={0} width={W - pad.l - pad.r} height={H} />
          </clipPath>
        </defs>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className={v === 0 ? 'stroke-nevoa/40' : 'stroke-linha'} strokeDasharray={v === 0 ? undefined : '2 5'} />
            <text x={W - pad.r + 8} y={y(v) + 4} className="fill-meta font-mono text-[11px]">
              {fmt(v)}
            </text>
          </g>
        ))}
        <line x1={x(day)} x2={x(day)} y1={pad.t} y2={H - pad.b} className="stroke-raio/60" strokeDasharray="3 3" />
        <text x={x(day) + 6} y={pad.t + 10} className="fill-raio font-mono text-[10px] uppercase tracking-widest">
          {dayLabel}
        </text>
        <g clipPath={`url(#${clip})`}>
          {paths.map((p, k) => (
            <path
              key={k}
              d={p.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')}
              fill="none"
              className="stroke-aco"
              strokeOpacity={0.85}
              strokeWidth={1.25}
            />
          ))}
        </g>
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-meta">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-px w-5 bg-aco" />
          {pastLabel}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-px border-l border-dashed border-raio" />
          {dayLabel}
        </span>
      </figcaption>
    </figure>
  );
}
