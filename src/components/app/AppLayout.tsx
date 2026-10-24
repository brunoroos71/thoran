import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { env } from '@/lib/env';
import { cx } from '@/lib/format';
import { useAuth } from '@/services/authService';
import { listAnalyses, type StoredAnalysis } from '@/services/historyService';
import { Logo, Symbol } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/Badge';
import { CreditsProvider, useCredits } from '@/services/billing/CreditsProvider';
import { CreditsBadge, InsufficientModal, LowBalanceBanner } from './Credits';

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const h = t.home;
  const { user, signOut } = useAuth();
  const { state } = useCredits();
  const nav = useNavigate();
  const [recent, setRecent] = useState<StoredAnalysis[]>([]);
  const load = useCallback(() => listAnalyses().then((r) => setRecent(r.slice(0, 30))), []);
  useEffect(() => {
    load();
    addEventListener('thoran:history', load);
    return () => removeEventListener('thoran:history', load);
  }, [load]);
  const trial = state?.subscription.status === 'trial' || !state?.subscription.planId;

  const item = ({ isActive }: { isActive: boolean }) => cx('flex min-h-[40px] items-center gap-3 rounded-xl px-3 text-sm transition-colors', isActive ? 'bg-grafite text-texto' : 'text-nevoa hover:bg-grafite/60 hover:text-texto');

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex h-12 items-center px-2">
        <Link to="/app" onClick={onNavigate} aria-label="Thoran">
          <Logo size={22} />
        </Link>
      </div>
      <button
        onClick={() => {
          nav(`/app?nova=${Date.now()}`);
          onNavigate?.();
        }}
        className="flex min-h-[44px] items-center gap-3 rounded-xl border border-linha px-3 text-sm font-medium transition-colors hover:bg-grafite"
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 16 16">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {h.newChat}
      </button>

      <NavLink to="/app/cenarios" onClick={onNavigate} className={item}>Comparar cenários</NavLink>
      <p className="mt-4 px-3 text-xs text-meta">{h.recent}</p>
      <nav aria-label={h.recent} className="-mx-1 flex-1 overflow-y-auto px-1">
        {recent.length === 0 ? (
          <p className="px-3 py-2 text-xs text-meta">{h.noRecent}</p>
        ) : (
          recent.map((r) => (
            <NavLink key={r.id} to={`/app/analise/${r.id}`} onClick={onNavigate} className={item} title={r.question}>
              <span className="truncate">{r.question}</span>
            </NavLink>
          ))
        )}
      </nav>

      <div className="flex flex-col gap-1 border-t border-linha pt-2">
        <NavLink to="/app/alertas" onClick={onNavigate} className={item}>
          {t.app.nav.alerts}
        </NavLink>
        <NavLink to="/app/planos" onClick={onNavigate} className={item}>
          {t.app.nav.plans}
        </NavLink>
        <div className="mt-2 rounded-2xl border border-linha p-3">
          <div className="flex items-center justify-between">
            <CreditsBadge />
            {env.agentMode === 'mock' && <Badge tone="trovao">{t.app.mockBadge}</Badge>}
          </div>
          {trial && (
            <Link to="/app/planos" onClick={onNavigate} className="mt-3 flex min-h-[40px] items-center justify-center rounded-full bg-raio text-sm font-semibold text-carbono hover:bg-texto">
              {h.upgrade}
            </Link>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-2 pt-1">
          <Link to="/app/conta" onClick={onNavigate} className="flex min-h-[40px] min-w-0 items-center gap-2 text-sm text-nevoa hover:text-texto">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-grafite text-xs uppercase text-texto">{user?.email?.[0] ?? '?'}</span>
            <span className="truncate">{user?.email}</span>
          </Link>
          <button onClick={() => signOut().then(() => nav('/'))} className="min-h-[40px] shrink-0 text-xs text-meta hover:text-texto">
            {t.auth.logout}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname, loc.search]);

  return (
    <CreditsProvider>
      <div className="flex h-[100dvh] overflow-hidden">
        <a href="#app-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-raio focus:px-4 focus:py-2 focus:text-carbono">
          {t.common.skipToContent}
        </a>
        <aside className="hidden w-[272px] shrink-0 border-r border-linha bg-[#0d0f13] md:block">
          <Sidebar />
        </aside>

        {/* gaveta no celular */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t.home.menu}>
            <button className="absolute inset-0 bg-carbono/70" aria-label={t.app.credits.close} onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[84%] max-w-[300px] border-r border-linha bg-[#0d0f13]">
              <Sidebar onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between px-3 md:hidden">
            <button onClick={() => setOpen(true)} aria-label={t.home.menu} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-grafite">
              <svg aria-hidden width="20" height="20" viewBox="0 0 20 20">
                <path d="M3 6h14M3 10h14M3 14h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <Link to="/app" aria-label="Thoran">
              <Symbol size={22} />
            </Link>
            <CreditsBadge />
          </header>
          <LowBalanceBanner />
          <main id="app-main" className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <InsufficientModal />
      </div>
    </CreditsProvider>
  );
}

export function PageHead({ title, lead, children }: { title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-linha px-4 pb-6 pt-8 sm:px-8 md:pt-12">
      <div>
        <h1 className="text-4xl font-medium tracking-tight md:text-5xl">{title}</h1>
        {lead && <p className="mt-3 max-w-xl text-nevoa">{lead}</p>}
      </div>
      {children}
    </div>
  );
}
