import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { fmtDate, fmtYear } from '@/lib/format';
import { listAnalyses, type StoredAnalysis } from '@/services/historyService';
import { PageHead } from '@/components/app/AppLayout';
import { RelevanceBadge } from '@/components/ui/Badge';
import { DirArrow, dirColor } from '@/components/ui/Move';

export default function History() {
  const { t, locale } = useI18n();
  useTitle(t.app.historyTitle);
  const [rows, setRows] = useState<StoredAnalysis[] | null>(null);
  useEffect(() => {
    listAnalyses().then(setRows);
  }, []);
  return (
    <>
      <PageHead title={t.app.historyTitle} />
      <div className="px-4 py-6 sm:px-8">
        {!rows && <p className="text-meta">{t.common.loading}</p>}
        {rows?.length === 0 && (
          <p className="text-nevoa">
            {t.app.historyEmpty}{' '}
            <Link to="/app" className="text-raio underline">
              {t.app.nav.chat}
            </Link>
          </p>
        )}
        <ul className="flex flex-col">
          {rows?.map((r) => {
            const s = r.response.stats[0];
            return (
              <li key={r.id}>
                <Link to={`/app/analise/${r.id}`} className="group grid gap-2 border-b border-linha py-5 transition-colors hover:bg-grafite md:grid-cols-12 md:items-center md:gap-6 md:px-4">
                  <span className="font-mono text-xs text-meta md:col-span-2">{fmtDate(r.created_at, locale)}</span>
                  <span className="md:col-span-6">
                    <span className="block text-lg font-medium group-hover:text-raio">{r.response.event.title}</span>
                    <span className="block truncate text-sm text-meta">“{r.question}”</span>
                  </span>
                  <span className="font-mono text-xs text-nevoa md:col-span-2">
                    {r.response.precedents.count} {t.common.cases} · {fmtYear(r.response.precedents.period.from)}–{fmtYear(r.response.precedents.period.to)}
                  </span>
                  <span className="flex items-center gap-3 md:col-span-2 md:justify-end">
                    {s && (
                      <span className={`font-mono text-sm ${dirColor(s.direction)}`}>
                        <DirArrow dir={s.direction} className="mr-1 text-[0.7em]" />
                        {s.value}
                      </span>
                    )}
                    <RelevanceBadge level={r.response.event.relevance} label={t.precedent.relevance[r.response.event.relevance]} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
