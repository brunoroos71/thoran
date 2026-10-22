import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { fmtDate, fmtYear } from '@/lib/format';
import { agentService } from '@/services/agent';
import { getAnalysis, type StoredAnalysis } from '@/services/historyService';
import { RelevanceBadge, IllustrativeTag } from '@/components/ui/Badge';
import { PrecedentChart } from '@/components/ui/PrecedentChart';
import { StatList } from '@/components/ui/StatList';
import { Move } from '@/components/ui/Move';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Feedback } from '@/components/app/Feedback';

export default function Analysis() {
  const { id = '' } = useParams();
  const { t, locale } = useI18n();
  const a = t.app.analysis;
  const [row, setRow] = useState<StoredAnalysis | null | undefined>(undefined);
  useTitle(row?.response.event.title);

  useEffect(() => {
    getAnalysis(id).then(setRow);
  }, [id]);

  if (row === undefined) return <p className="p-8 text-meta">{t.common.loading}</p>;
  if (!row)
    return (
      <div className="p-8">
        <p>{a.notFound}</p>
        <Link to="/app/historico" className="mt-4 inline-block text-raio underline">
          {t.app.historyTitle}
        </Link>
      </div>
    );

  const r = row.response;
  const mock = agentService.mode === 'mock';
  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-8 md:py-12">
      <Link to="/app/historico" className="label inline-flex min-h-[44px] items-center gap-2 text-meta hover:text-texto">
        ← {t.common.back}
      </Link>
      <header className="mt-6 flex flex-col gap-4 border-b border-linha pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="label text-raio">{a.event}</p>
          <RelevanceBadge level={r.event.relevance} label={t.precedent.relevance[r.event.relevance]} />
        </div>
        <h1 className="text-display font-medium">{r.event.title}</h1>
        <p className="text-nevoa">“{row.question}”</p>
        <p className="font-mono text-sm text-nevoa">
          {t.common.sample}: <span className="text-raio">{r.precedents.count}</span> {t.common.cases} · {t.common.period}: {fmtYear(r.precedents.period.from)}–
          {fmtYear(r.precedents.period.to)} · {fmtDate(r.event.detected_at, locale)}
        </p>
        {mock && <IllustrativeTag text={t.common.illustrative} />}
      </header>

      <section className="mt-10" aria-labelledby="metrics">
        <h2 id="metrics" className="label text-nevoa">
          {a.metrics}
        </h2>
        <StatList stats={r.stats} size="lg" className="mt-4" />
      </section>

      <section className="mt-10 rounded-card border border-linha bg-grafite p-6" aria-labelledby="chart">
        <h2 id="chart" className="label text-nevoa">
          {a.chart}
        </h2>
        <PrecedentChart className="mt-6" chart={r.chart} label={t.precedent.chartLabel} nowLabel={t.precedent.now} todayLabel={t.precedent.today} pastLabel={t.precedent.pastCases} height={300} />
      </section>

      <section className="mt-10" aria-labelledby="why">
        <h2 id="why" className="label text-nevoa">
          {a.why}
        </h2>
        <p className="mt-4 max-w-3xl text-xl leading-relaxed">{r.explanation}</p>
      </section>

      <section className="mt-10" aria-labelledby="prec">
        <h2 id="prec" className="label text-nevoa">
          {a.precedents} ({r.precedents.count})
        </h2>
        <div className="mt-4 overflow-x-auto rounded-card border border-linha">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-grafite">
              <tr>
                {[a.date, a.title, a.asset, a.window, a.move, a.similarity].map((h) => (
                  <th key={h} scope="col" className="label px-4 py-3 font-normal text-meta">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.precedents.items.map((p, i) => (
                <tr key={i} className="border-t border-linha">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-nevoa">{fmtDate(p.date, locale)}</td>
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3 font-mono">{p.asset}</td>
                  <td className="px-4 py-3 font-mono text-nevoa">{p.window}</td>
                  <td className="px-4 py-3">
                    <Move value={p.move_pct} />
                  </td>
                  <td className="px-4 py-3 font-mono text-nevoa">{Math.round(p.similarity * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-6">
        <Feedback analysisId={r.id} />
        <Disclaimer text={r.disclaimer} />
      </div>
    </article>
  );
}
