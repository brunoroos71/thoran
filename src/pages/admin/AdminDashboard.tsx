import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTitle } from '@/hooks/useTitle';
import { hasSupabase } from '@/lib/env';
import { cx, fmtDate } from '@/lib/format';
import { money } from '@/config/pricing';
import { accountsCsv, fetchAccounts, fetchDashboard, type AdminAccount, type AdminDashboard as Dash, type DailyPoint } from '@/services/adminService';
import { Logo } from '@/components/ui/Logo';
import { ButtonLink } from '@/components/ui/Button';

type Tab = 'overview' | 'accounts' | 'health';
const n = (v: number) => v.toLocaleString('pt-BR');
const shortDay = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

/** Número em destaque com rótulo (stat tile). */
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-linha bg-grafite/60 p-5">
      <dt className="text-sm text-nevoa">{label}</dt>
      <dd className="text-3xl font-semibold tabular-nums tracking-tight text-texto">{value}</dd>
      {sub && <p className="text-xs text-meta">{sub}</p>}
    </div>
  );
}

/**
 * Barras diárias de uma série só (30 dias), em azul raio.
 * Topo arredondado de 4px apoiado na base, 2px de espaço entre barras, dica ao passar o mouse e tabela alternativa.
 */
function DailyBars({ title, data, value, format }: { title: string; data: DailyPoint[]; value: (p: DailyPoint) => number; format: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const vals = data.map(value);
  const max = Math.max(1, ...vals);
  const total = vals.reduce((a, b) => a + b, 0);
  const H = 160;
  return (
    <figure className="rounded-2xl border border-linha bg-grafite/60 p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-nevoa">{title}</span>
        <span className="whitespace-nowrap text-sm tabular-nums text-texto">{format(total)} em 30 dias</span>
      </figcaption>
      <div className="relative mt-4" onMouseLeave={() => setHover(null)}>
        <div className="flex items-end gap-[2px]" style={{ height: H }} role="img" aria-label={`${title}: ${format(total)} nos últimos 30 dias`}>
          {vals.map((v, i) => (
            <div key={data[i].day} className="flex h-full flex-1 cursor-default items-end" onMouseEnter={() => setHover(i)}>
              <div
                className={cx('w-full rounded-t-[4px] transition-colors', hover === i ? 'bg-texto' : 'bg-raio')}
                style={{ height: v ? Math.max(3, (v / max) * H) : 0 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 h-px bg-linha" />
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-lg border border-linha bg-carbono px-3 py-2 text-xs shadow-xl"
            style={{ left: `${((hover + 0.5) / vals.length) * 100}%`, transform: `translate(${hover > vals.length / 2 ? '-100%' : '0'}, -100%)` }}
          >
            <p className="text-meta">{shortDay(data[hover].day)}</p>
            <p className="tabular-nums text-texto">{format(vals[hover])}</p>
          </div>
        )}
        <div className="mt-2 flex justify-between text-[11px] text-meta">
          <span>{shortDay(data[0].day)}</span>
          <span>{shortDay(data[Math.floor(data.length / 2)].day)}</span>
          <span>hoje</span>
        </div>
      </div>
      <details className="mt-3 text-xs text-meta">
        <summary className="cursor-pointer hover:text-texto">Ver tabela</summary>
        <table className="mt-2 w-full">
          <tbody>
            {data.map((p, i) => (
              <tr key={p.day} className="border-t border-linha">
                <td className="py-1">{shortDay(p.day)}</td>
                <td className="py-1 text-right tabular-nums text-nevoa">{format(vals[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Linha de status: ícone + rótulo, nunca só cor. */
function StatusRow({ label, count, level, hint }: { label: string; count: number; level: 'ok' | 'warn' | 'bad'; hint: string }) {
  const s = count === 0 ? { icon: '✓', cls: 'text-alta', word: 'ok' } : level === 'bad' ? { icon: '✕', cls: 'text-baixa', word: 'atenção' } : { icon: '!', cls: 'text-trovao', word: 'acompanhar' };
  return (
    <li className="flex items-start justify-between gap-4 border-t border-linha py-4 first:border-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-meta">{hint}</p>
      </div>
      <p className={cx('flex shrink-0 items-center gap-2 tabular-nums', s.cls)}>
        <span aria-hidden className="font-mono">{s.icon}</span>
        <span className="text-texto">{n(count)}</span>
        <span className="text-xs">{s.word}</span>
      </p>
    </li>
  );
}

function Overview({ d }: { d: Dash }) {
  const planLabel = (p: string, c: string) => `${p === 'pro' ? 'Pro' : 'Basic'} ${c}`;
  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Receita recorrente (MRR)" value={money(d.subscriptions.mrr_cents)} sub={`${n(d.subscriptions.paying)} assinantes pagantes`} />
        <Stat label="Receita do mês" value={money(d.revenue.month_cents)} sub={`${n(d.revenue.topups_month)} recargas no mês`} />
        <Stat label="Contas criadas" value={n(d.accounts.total)} sub={`${n(d.accounts.today)} hoje · ${n(d.accounts.d7)} em 7 dias`} />
        <Stat label="Conversão teste → pago" value={`${d.subscriptions.conversion.toLocaleString('pt-BR')}%`} sub={`${n(d.subscriptions.trial)} ainda no teste grátis`} />
      </dl>
      <div className="grid gap-4 lg:grid-cols-3">
        <DailyBars title="Contas criadas por dia" data={d.accounts.daily} value={(p) => p.n ?? 0} format={n} />
        <DailyBars title="Receita por dia" data={d.revenue.daily} value={(p) => p.cents ?? 0} format={(v) => money(v)} />
        <DailyBars title="Uso do agente por dia" data={d.usage.daily} value={(p) => p.n ?? 0} format={n} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-linha bg-grafite/60 p-5">
          <h2 className="text-sm text-nevoa">Assinantes por plano</h2>
          {d.subscriptions.by_plan.length === 0 ? (
            <p className="mt-4 text-sm text-meta">Nenhum assinante pagante ainda.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {d.subscriptions.by_plan.map((r) => (
                  <tr key={r.plan + r.cycle} className="border-t border-linha first:border-0">
                    <td className="py-2.5">{planLabel(r.plan, r.cycle)}</td>
                    <td className="py-2.5 text-right tabular-nums">{n(r.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="rounded-2xl border border-linha bg-grafite/60 p-5">
          <h2 className="text-sm text-nevoa">Uso do agente (30 dias)</h2>
          <dl className="mt-3 grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-meta">Análises completas</dt>
            <dd className="text-right tabular-nums">{n(d.usage.analyses_d30)}</dd>
            <dt className="text-meta">Perguntas rápidas</dt>
            <dd className="text-right tabular-nums">{n(d.usage.questions_d30)}</dd>
            <dt className="text-meta">Créditos consumidos</dt>
            <dd className="text-right tabular-nums">{n(d.usage.credits_d30)}</dd>
            <dt className="text-meta">Estornos (agente falhou)</dt>
            <dd className="text-right tabular-nums">{n(d.usage.refunds_d30)}</dd>
            <dt className="text-meta">Usuários ativos (7 dias)</dt>
            <dd className="text-right tabular-nums">{n(d.usage.active_users_d7)}</dd>
          </dl>
        </section>
      </div>
      <p className="text-xs text-meta">
        Receita total registrada: {money(d.revenue.total_cents)} · Atualizado às {new Date(d.generated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Detalhes de cada
        pagamento e reembolso ficam no painel da Stripe.
      </p>
    </div>
  );
}

function Health({ d }: { d: Dash }) {
  const errRate = d.usage.agent_calls_d30 ? Math.round((d.usage.agent_errors_d30 / d.usage.agent_calls_d30) * 1000) / 10 : 0;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-linha bg-grafite/60 p-5">
        <h2 className="text-sm text-nevoa">Cobrança e agente</h2>
        <ul className="mt-2">
          <StatusRow label="Pagamento falhou (em carência)" count={d.health.grace} level="warn" hint="3 dias para regularizar antes de bloquear o consumo." />
          <StatusRow label="Assinaturas inadimplentes" count={d.health.delinquent} level="bad" hint="Consumo bloqueado até o pagamento." />
          <StatusRow label="Cancelamentos agendados" count={d.health.cancel_scheduled} level="warn" hint="Acesso até o fim do período pago." />
          <StatusRow label="Eventos da Stripe com erro" count={d.health.webhook_errors} level="bad" hint="Webhooks que falharam ou não foram processados." />
          <StatusRow label={`Falhas do agente (${errRate}% das chamadas)`} count={d.usage.agent_errors_d30} level="warn" hint={`${n(d.usage.agent_calls_d30)} chamadas nos últimos 30 dias.`} />
        </ul>
      </section>
      <section className="rounded-2xl border border-linha bg-grafite/60 p-5">
        <h2 className="text-sm text-nevoa">Últimos eventos da Stripe</h2>
        {d.health.recent_events.length === 0 ? (
          <p className="mt-4 text-sm text-meta">Nenhum evento ainda.</p>
        ) : (
          <ul className="mt-2 text-sm">
            {d.health.recent_events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 border-t border-linha py-2.5 first:border-0">
                <span className="min-w-0">
                  <span className="block truncate font-mono text-xs">{e.type}</span>
                  <span className="text-xs text-meta">{new Date(e.received_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <span className={cx('shrink-0 text-xs', e.error ? 'text-baixa' : e.processed ? 'text-alta' : 'text-trovao')}>
                  {e.error ? '✕ erro' : e.processed ? '✓ processado' : '! pendente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Accounts() {
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<{ total: number; rows: AdminAccount[] } | null>(null);
  const LIMIT = 50;
  const load = useCallback(() => {
    fetchAccounts(q, offset, LIMIT).then((r) => setData('error' in r ? { total: 0, rows: [] } : r));
  }, [q, offset]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const exportCsv = async () => {
    const all = await fetchAccounts(q, 0, 500);
    if ('error' in all) return;
    const blob = new Blob(['﻿' + accountsCsv(all.rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `thoran-contas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const statusLabel = (r: AdminAccount) =>
    !r.plan ? 'Teste grátis' : r.status === 'inadimplente' ? 'Inadimplente' : r.cancel_at_period_end ? 'Cancelamento agendado' : r.status === 'ativa' ? 'Ativa' : r.status ?? '—';

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="sr-only" htmlFor="busca">
          Buscar por e-mail
        </label>
        <input
          id="busca"
          value={q}
          onChange={(e) => (setQ(e.target.value), setOffset(0))}
          placeholder="Buscar por e-mail"
          className="h-11 w-full max-w-sm rounded-full border border-linha bg-grafite px-5 text-sm placeholder:text-meta focus:border-raio focus:outline-none"
        />
        <div className="flex items-center gap-3 text-sm text-meta">
          {data && <span>{n(data.total)} contas</span>}
          <button onClick={exportCsv} className="min-h-[40px] rounded-full border border-linha px-4 text-texto hover:border-texto">
            Exportar CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-linha">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-grafite text-xs text-meta">
            <tr>
              {['E-mail', 'Cadastro', 'Plano', 'Status', 'Saldo', 'Usados (30d)', 'Pago', 'Último uso'].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!data && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-meta">
                  Carregando…
                </td>
              </tr>
            )}
            {data?.rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-meta">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            )}
            {data?.rows.map((r) => (
              <tr key={r.id} className="border-t border-linha">
                <td className="px-4 py-3">
                  {r.email}
                  {r.is_admin && <span className="ml-2 rounded-full bg-raio/15 px-2 py-0.5 text-[10px] text-raio">admin</span>}
                </td>
                <td className="px-4 py-3 text-nevoa">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-3">{r.plan ? `${r.plan === 'pro' ? 'Pro' : 'Basic'} ${r.cycle}` : '—'}</td>
                <td className="px-4 py-3 text-nevoa">{statusLabel(r)}</td>
                <td className="px-4 py-3 tabular-nums">{n(r.balance)}</td>
                <td className="px-4 py-3 tabular-nums text-nevoa">{n(r.used_d30)}</td>
                <td className="px-4 py-3 tabular-nums">{r.paid_cents ? money(r.paid_cents) : '—'}</td>
                <td className="px-4 py-3 text-nevoa">{r.last_use ? fmtDate(r.last_use) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.total > LIMIT && (
        <div className="flex justify-end gap-2 text-sm">
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="min-h-[40px] rounded-full border border-linha px-4 disabled:opacity-40">
            ← Anteriores
          </button>
          <button disabled={offset + LIMIT >= data.total} onClick={() => setOffset(offset + LIMIT)} className="min-h-[40px] rounded-full border border-linha px-4 disabled:opacity-40">
            Próximas →
          </button>
        </div>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  useTitle('Painel');
  const [tab, setTab] = useState<Tab>('overview');
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState<'auth' | 'forbidden' | 'generic' | null>(null);
  const load = useCallback(() => {
    fetchDashboard().then((r) => ('error' in r ? setErr(r.error) : (setD(r), setErr(null))));
  }, []);
  useEffect(() => {
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, [load]);

  const tabs: [Tab, string][] = [
    ['overview', 'Visão geral'],
    ['accounts', 'Contas'],
    ['health', 'Saúde'],
  ];

  return (
    <div className="min-h-screen bg-carbono">
      <header className="border-b border-linha">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Thoran, início">
            <Logo size={22} />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/admin/lista" className="text-meta hover:text-texto">
              Lista de espera
            </Link>
            <span className="rounded-full bg-raio/15 px-3 py-1 text-xs text-raio">Admin</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-medium tracking-tight">Painel</h1>
          {!hasSupabase && <p className="text-sm text-trovao">Modo demonstração: números fictícios.</p>}
        </div>

        {err ? (
          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-linha bg-grafite p-8">
            <p className="text-lg">{err === 'forbidden' ? 'Esta conta não tem acesso ao painel.' : err === 'auth' ? 'Entre com uma conta de administrador.' : 'Não foi possível carregar o painel.'}</p>
            {err === 'auth' && (
              <ButtonLink to="/entrar?next=/admin" arrow>
                Entrar
              </ButtonLink>
            )}
          </div>
        ) : (
          <>
            <nav aria-label="Seções do painel" className="mt-6 flex gap-1 border-b border-linha">
              {tabs.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  aria-current={tab === k ? 'page' : undefined}
                  className={cx('-mb-px min-h-[44px] border-b-2 px-4 text-sm transition-colors', tab === k ? 'border-raio text-texto' : 'border-transparent text-meta hover:text-texto')}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-6">
              {tab === 'accounts' ? <Accounts /> : !d ? <p className="text-meta">Carregando…</p> : tab === 'overview' ? <Overview d={d} /> : <Health d={d} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
