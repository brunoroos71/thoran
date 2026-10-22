import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo, Symbol } from '@/components/ui/Logo';
import { useAuth } from '@/services/authService';
import { useI18n } from '@/i18n';

export function AuthShell({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  const { demo } = useAuth();
  const { t } = useI18n();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div aria-hidden className="relative hidden overflow-hidden bg-grafite lg:block">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
          <Symbol size={300} className="animate-rise" />
        </div>
        <div className="stripes animate-stripes absolute inset-x-0 bottom-0 h-1/3" />
        <p className="absolute bottom-[36%] left-12 text-5xl font-medium leading-tight tracking-tight">
          {t.hero.title1}
          <br />
          {t.hero.title2}
        </p>
      </div>
      <main className="flex flex-col px-4 py-8 sm:px-10">
        <Link to="/" className="self-start" aria-label="Thoran, início">
          <Logo size={26} />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-12">
          <h1 className="text-h2 font-medium">{title}</h1>
          {demo && <p className="font-mono text-xs text-trovao">{t.auth.demoNotice}</p>}
          {children}
          {footer && <div className="text-sm text-nevoa">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
