import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n, LOCALES, type Locale } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { cx } from '@/lib/format';
import { useAuth } from '@/services/authService';
import { upsertProfile, type Level } from '@/services/profileService';
import type { Market } from '@/services/agent';
import { PageHead } from '@/components/app/AppLayout';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function Account() {
  const { t } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  useTitle(t.app.accountTitle);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<Level>('iniciante');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [lang, setLang] = useState<Locale>('pt-BR');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? user?.name ?? '');
    setLevel(profile.experience_level ?? 'iniciante');
    setMarkets(profile.markets ?? []);
    setLang(profile.locale ?? 'pt-BR');
  }, [profile, user]);

  const chip = (on: boolean) =>
    cx('min-h-[44px] rounded-full border px-5 text-sm transition-colors', on ? 'border-raio bg-raio text-carbono' : 'border-linha text-nevoa hover:text-texto');

  return (
    <>
      <PageHead title={t.app.accountTitle} />
      <form
        className="flex max-w-2xl flex-col gap-8 px-4 py-8 sm:px-8"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!user) return;
          await upsertProfile({ id: user.id, name, experience_level: level, markets, locale: lang });
          await refreshProfile();
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        }}
      >
        <Field label={t.auth.name} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <Field label={t.auth.email} value={user?.email ?? ''} readOnly disabled />
        <fieldset>
          <legend className="label mb-3 text-nevoa">{t.onboarding.levelQ}</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(t.onboarding.levels) as Level[]).map((l) => (
              <button type="button" key={l} aria-pressed={level === l} className={chip(level === l)} onClick={() => setLevel(l)}>
                {t.onboarding.levels[l]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label mb-3 text-nevoa">{t.onboarding.marketsQ}</legend>
          <div className="flex flex-wrap gap-2">
            {(['b3', 'crypto', 'global'] as Market[]).map((m) => (
              <button
                type="button"
                key={m}
                aria-pressed={markets.includes(m)}
                className={chip(markets.includes(m))}
                onClick={() => setMarkets((x) => (x.includes(m) ? x.filter((i) => i !== m) : [...x, m]))}
              >
                {t.onboarding.markets[m]}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-2">
          <label htmlFor="lang" className="label text-nevoa">
            {t.app.language}
          </label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as Locale)} className="h-14 rounded-full border border-linha bg-grafite px-6 focus:border-raio focus:outline-none">
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <Link to="/app/planos" className="inline-flex min-h-[44px] items-center text-nevoa underline-offset-2 hover:text-raio hover:underline">
          {t.app.plan} →
        </Link>
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg">
            {t.app.save}
          </Button>
          <span role="status" className="text-sm text-alta">
            {saved && `✓ ${t.app.saved}`}
          </span>
        </div>
      </form>
    </>
  );
}
