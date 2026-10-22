import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';

/** Rodapé de uma linha. */
export function Footer() {
  const { t } = useI18n();
  const links: [string, string][] = [
    ['/sobre', t.home.about],
    ['/planos', t.home.plans],
    ['/privacidade', t.footer.privacy],
    ['/termos', t.footer.terms],
    ['/aviso-de-risco', t.footer.risk],
  ];
  return (
    <footer className="px-4 pb-6 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-2 text-center text-xs text-meta">
        <p>{t.home.footer}</p>
        <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-4">
          {links.map(([to, label]) => (
            <Link key={to} to={to} className="inline-flex min-h-[32px] items-center hover:text-texto">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
