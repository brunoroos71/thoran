import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { Logo } from '@/components/ui/Logo';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { fetchWaitlist, toCsv, type WaitlistRow } from '@/services/adminService';

const dayKey = (iso: string) => iso.slice(0, 10);

export default function AdminWaitlist() {
  const { t } = useI18n();
  const a = t.admin;
  useTitle(a.title);
  const [rows, setRows] = useState<WaitlistRow[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [err, setErr] = useState<'auth' | 'forbidden' | 'generic' | null>(null);

  useEffect(() => {
    fetchWaitlist().then((r) => {
      if ('error' in r) setErr(r.error);
      else {
        setRows(r.rows);
        setDemo(r.demo);
      }
    });
  }, []);

  const stats = useMemo(() => {
    if (!rows) return null;
    const today = dayKey(new Date().toISOString());
    const days: { key: string; n: number }[] = [];
    for (let i = 29; i >= 0; i--) days.push({ key: dayKey(new Date(Date.now() - i * 864e5).toISOString()), n: 0 });
    const idx = new Map(days.map((d, i) => [d.key, i]));
    const src = new Map<string, number>();
    const camp = new Map<string, number>();
    for (const r of rows) {
      const i = idx.get(dayKey(r.created_at));
      if (i !== undefined) days[i].n++;
      src.set(r.utm_source ?? a.direct, (src.get(r.utm_source ?? a.direct) ?? 0) + 1);
      camp.set(r.utm_campaign ?? a.direct, (camp.get(r.utm_campaign ?? a.direct) ?? 0) + 1);
    }
    const sort = (m: Map<string, number>) => [...m.entries()].sort((x, y) => y[1] - x[1]);
    return {
      total: rows.length,
      today: days[days.length - 1].key === today ? days[days.length - 1].n : 0,
      last7: days.slice(-7).reduce((s, d) => s + d.n, 0),
      days,
      max: Math.max(1, ...days.map((d) => d.n)),
      sources: sort(src),
      campaigns: sort(camp),
    };
  }, [rows, a.direct]);

  function exportCsv() {
    if (!rows) return;
    const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thoran-waitlist-${dayKey(new Date().toISOString())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-carbono">
      <header className="border-b border-linha">
        <div className="wrap flex h-16 items-center justify-between">
          <Link to="/" aria-label="Thoran, início">
            <Logo size={24} />
          </Link>
          <span className="label text-meta">Admin</span>
        </div>
      </header>
      <main className="wrap py-12">
        <Eyebrow>Admin</Eyebrow>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-h2 font-medium">{a.title}</h1>
          {rows && (
            <Button onClick={exportCsv} variant="secondary">
              {a.export}
            </Button>
          )}
        </div>
        {demo && <p className="mt-4 font-mono text-sm text-trovao">{a.demo}</p>}

        {err && (
          <div className="mt-12 flex flex-col items-start gap-4 rounded-card border border-linha bg-grafite p-8">
            <p className="text-lg">{err === 'forbidden' ? a.denied : err === 'auth' ? a.loginRequired : t.auth.errGeneric}</p>
            {err === 'auth' && (
              <ButtonLink to="/entrar?next=/admin/lista" arrow>
                {t.nav.login}
              </ButtonLink>
            )}
          </div>
        )}
        {!rows && !err && <p className="mt-12 text-meta">{t.common.loading}</p>}

        {stats && (
          <>
            <dl className="mt-10 grid gap-px overflow-hidden rounded-card border border-linha bg-linha sm:grid-cols-3">
              {[
                [a.total, stats.total],
                [a.today, stats.today],
                [a.last7, stats.last7],
              ].map(([l, v]) => (
                <div key={l as string} className="flex flex-col-reverse gap-2 bg-grafite p-6">
                  <dt className="label text-meta">{l}</dt>
                  <dd className="font-mono text-5xl font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            <section className="mt-10 rounded-card border border-linha bg-grafite p-6" aria-labelledby="per-day">
              <h2 id="per-day" className="label text-nevoa">
                {a.perDay} · 30d
              </h2>
              <div className="mt-6 flex h-48 items-end gap-[3px]" role="img" aria-label={`${a.perDay}: ${stats.days.map((d) => `${d.key} ${d.n}`).join(', ')}`}>
                {stats.days.map((d) => (
                  <div key={d.key} className="group relative flex h-full flex-1 items-end">
                    <div className="w-full rounded-t-[2px] bg-raio transition-colors group-hover:bg-texto" style={{ height: `${(d.n / stats.max) * 100}%`, minHeight: d.n ? 2 : 0 }} />
                    <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-carbono px-2 py-1 font-mono text-[11px] group-hover:block">
                      {d.key.slice(5)} · {d.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-meta">
                <span>{stats.days[0].key.slice(5)}</span>
                <span>{stats.days[stats.days.length - 1].key.slice(5)}</span>
              </div>
            </section>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {[
                [a.bySource, stats.sources],
                [a.byCampaign, stats.campaigns],
              ].map(([title, list]) => (
                <section key={title as string} className="rounded-card border border-linha bg-grafite p-6">
                  <h2 className="label text-nevoa">{title as string}</h2>
                  <table className="mt-4 w-full text-left">
                    <tbody>
                      {(list as [string, number][]).map(([k, n]) => (
                        <tr key={k} className="border-t border-linha">
                          <th scope="row" className="py-3 font-normal">
                            {k}
                          </th>
                          <td className="py-3 text-right font-mono tabular-nums text-nevoa">{n}</td>
                          <td className="w-24 py-3 pl-4">
                            <div className="h-1.5 rounded-full bg-raio" style={{ width: `${(n / stats.total) * 100}%` }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
