import { useMemo } from 'react';
import type { AnalysisResponse } from '@/services/agent';
import type { Candle } from '@/services/marketService';
import { cx } from '@/lib/format';
import { CandleChart } from './CandleChart';

interface Props {
  chart: AnalysisResponse['chart'];
  label: string;
  nowLabel: string;
  todayLabel: string;
  pastLabel: string;
  className?: string;
  height?: number;
}

const SUB = 3; // velas por ponto da série
const LEAD = 14; // velas antes do anúncio

/** Converte a série "current" do contrato em velas (determinístico, para não piscar). */
function toCandles(series: number[]): Candle[] {
  const out: Candle[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  // pregão antes do evento: oscilação lateral em torno de zero, para dar contexto
  let p = 0;
  for (let i = 0; i < LEAD; i++) {
    const o = p;
    const c = i === LEAD - 1 ? 0 : (rnd() - 0.5) * 0.16;
    out.push({ t: -100 + i, o, c, h: Math.max(o, c) + rnd() * 0.05, l: Math.min(o, c) - rnd() * 0.05 });
    p = c;
  }
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1];
    const b = series[i];
    for (let k = 0; k < SUB; k++) {
      const o = a + ((b - a) * k) / SUB + (k ? (rnd() - 0.5) * 0.06 : 0);
      const c = k === SUB - 1 ? b : a + ((b - a) * (k + 1)) / SUB + (rnd() - 0.5) * 0.08;
      out.push({ t: i * 10 + k, o, c, h: Math.max(o, c) + rnd() * 0.06, l: Math.min(o, c) - rnd() * 0.06 });
    }
  }
  return out;
}

/** Hoje em velas até "agora"; depois, o leque do que aconteceu nos precedentes. */
export function PrecedentChart({ chart, label, nowLabel, todayLabel, pastLabel, className, height = 220 }: Props) {
  const candles = useMemo(() => toCandles(chart.current.slice(0, chart.now_index + 1)), [chart]);
  const last = candles[candles.length - 1]?.c ?? 0;
  const tailLen = Math.max(...chart.precedents.map((p) => p.length)) - chart.now_index - 1;
  // cada precedente continua a partir do preço de agora, com o mesmo formato de movimento
  const overlays = chart.precedents.map((p) => {
    const base = p[chart.now_index] ?? 0;
    const tail = p.slice(chart.now_index).map((v) => last + (v - base));
    const stretched: number[] = [];
    tail.forEach((v, i) => {
      if (i === 0) return stretched.push(v);
      const prev = tail[i - 1];
      for (let k = 1; k <= SUB; k++) stretched.push(prev + ((v - prev) * k) / SUB);
    });
    return { values: stretched, startSlot: candles.length - 1, className: 'stroke-aco', width: 1.25 };
  });
  const fmt = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}${chart.unit}`;

  return (
    <div className={cx('w-full', className)}>
      <CandleChart candles={candles} extraSlots={tailLen * SUB} overlays={overlays} nowLabel={nowLabel} height={height} label={label} format={fmt} />
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-meta">
        <span className="flex items-center gap-2">
          <span aria-hidden className="inline-flex gap-0.5">
            <span className="h-3 w-1.5 border border-alta" />
            <span className="h-3 w-1.5 bg-baixa" />
          </span>
          {todayLabel}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-px w-5 bg-aco" />
          {pastLabel}
        </span>
      </p>
    </div>
  );
}
