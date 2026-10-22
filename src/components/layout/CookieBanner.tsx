import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { getConsent, needsCookieBanner, setConsent } from '@/lib/analytics';
import { btnClass } from '@/components/ui/Button';

/** Só aparece quando há pixel de marketing configurado (VITE_ANALYTICS_PIXEL_ID). */
export function CookieBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(() => needsCookieBanner() && getConsent() === null);
  if (!visible) return null;
  const choose = (v: 'granted' | 'denied') => {
    setConsent(v);
    setVisible(false);
  };
  return (
    <div role="region" aria-label="Cookies" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-2xl flex-col gap-4 rounded-card border border-linha bg-grafite p-5 sm:flex-row sm:items-center">
      <p className="flex-1 text-sm text-nevoa">
        {t.cookies.text}{' '}
        <Link to="/privacidade" className="text-texto underline">
          {t.cookies.more}
        </Link>
      </p>
      <div className="flex gap-2">
        {/* Recusar tem o mesmo peso visual que aceitar (LGPD) */}
        <button className={btnClass('secondary')} onClick={() => choose('denied')}>
          {t.cookies.decline}
        </button>
        <button className={btnClass('primary')} onClick={() => choose('granted')}>
          {t.cookies.accept}
        </button>
      </div>
    </div>
  );
}
