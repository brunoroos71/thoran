import { Link, NavLink } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { env } from '@/lib/env';
import { trackCta } from '@/lib/analytics';
import { cx } from '@/lib/format';
import { useAuth } from '@/services/authService';
import { Logo } from '@/components/ui/Logo';

/** Cabeçalho mínimo, como em produtos de IA: marca à esquerda, entrar/começar à direita. */
export function Header() {
  const { t } = useI18n();
  const { user } = useAuth();
  const link = ({ isActive }: { isActive: boolean }) => cx('hidden h-10 items-center rounded-full px-4 text-sm transition-colors sm:inline-flex', isActive ? 'text-texto' : 'text-nevoa hover:text-texto');
  return (
    // pílula suspensa: afastada das bordas, translúcida e com contorno fino
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-5 md:pt-4">
      <div className="glass hairline mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 rounded-full border border-linha pl-4 pr-2 sm:pl-5 md:h-[68px] md:pl-7">
        <Link to="/" className="flex min-h-[44px] items-center" aria-label="Thoran, início">
          <Logo size={24} />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          <NavLink to="/sobre" className={link}>
            {t.home.about}
          </NavLink>
          <NavLink to="/planos" className={link}>
            {t.home.plans}
          </NavLink>
          {user ? (
            <Link to="/app" className="ml-2 inline-flex h-12 items-center rounded-full bg-raio px-6 text-sm font-semibold text-carbono hover:bg-texto">
              {t.app.nav.chat}
            </Link>
          ) : (
            <>
              <Link to="/entrar" className="inline-flex h-10 items-center whitespace-nowrap rounded-full px-3 text-sm text-nevoa hover:text-texto sm:px-4">
                {t.nav.login}
              </Link>
              {!env.waitlistMode && (
                <Link to="/cadastro" onClick={() => trackCta('header')} className="group inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-raio px-4 text-sm font-semibold text-carbono transition-colors hover:bg-texto sm:h-12 sm:pl-6 sm:pr-5">
                  {t.nav.ctaSignup}
                  <svg aria-hidden width="13" height="13" viewBox="0 0 14 14" className="hidden transition-transform sm:block duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <path d="M3 11 11 3M5 3h6v6" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
