import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { cx, fmtYear } from '@/lib/format';
import type { AnalysisResponse } from '@/services/agent';
import { IllustrativeTag, RelevanceBadge } from './Badge';
import { PrecedentChart } from './PrecedentChart';
import { StatList } from './StatList';
import { Disclaimer } from './Disclaimer';

interface Props {
  data: AnalysisResponse;
  illustrative?: boolean;
  href?: string;
  compact?: boolean;
  className?: string;
  showDisclaimer?: boolean;
}

/** Card de precedente: evento + amostra/período (obrigatórios) + métricas + gráfico. */
export function PrecedentCard({ data, illustrative, href, compact, className, showDisclaimer = true }: Props) {
  const { t } = useI18n();
  const p = t.precedent;
  return (
    <article className={cx('flex flex-col gap-5 rounded-card border border-linha bg-grafite p-5 sm:p-6', className)}>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label text-meta">{p.eventLabel}</p>
          <RelevanceBadge level={data.event.relevance} label={p.relevance[data.event.relevance]} />
        </div>
        <h3 className="text-xl font-medium leading-tight tracking-tight text-texto sm:text-2xl">{data.event.title}</h3>
        <p className="font-mono text-xs text-nevoa">
          <span className="text-raio">{data.precedents.count}</span> {p.precedentsFound} · {t.common.period}{' '}
          {fmtYear(data.precedents.period.from)}–{fmtYear(data.precedents.period.to)}
        </p>
      </header>
      <StatList stats={compact ? data.stats.slice(0, 2) : data.stats} />
      <PrecedentChart chart={data.chart} label={p.chartLabel} nowLabel={p.now} todayLabel={p.today} pastLabel={p.pastCases} height={compact ? 180 : 220} />
      {illustrative && <IllustrativeTag text={t.common.illustrative} />}
      {href && (
        <Link to={href} className="label group inline-flex min-h-[44px] items-center gap-2 self-start text-raio hover:text-texto">
          {p.seeFull} <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      )}
      {showDisclaimer && <Disclaimer text={data.disclaimer} />}
    </article>
  );
}
