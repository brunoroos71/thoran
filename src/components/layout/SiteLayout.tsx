import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { AuroraBackground } from '@/components/fx/AuroraBackground';

export function SiteLayout({ children, fill }: { children: ReactNode; fill?: boolean }) {
  const { t } = useI18n();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col">
      <AuroraBackground />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-raio focus:px-5 focus:py-3 focus:text-carbono">
        {t.common.skipToContent}
      </a>
      <Header />
      <main id="conteudo" className={fill ? 'flex flex-1 flex-col' : 'flex-1'}>
        {children}
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
