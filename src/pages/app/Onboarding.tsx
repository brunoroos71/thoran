import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { cx } from '@/lib/format';
import { useAuth } from '@/services/authService';
import { upsertProfile, type Level } from '@/services/profileService';
import type { Market } from '@/services/agent';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';

export default function Onboarding() {
  const { t, locale } = useI18n();
  const o = t.onboarding;
  useTitle(o.title);
  const { user, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);

  const finish = async () => {
    if (!user) return;
    await upsertProfile({ id: user.id, name: user.name ?? null, experience_level: level, markets, locale, onboarded: true });
    await refreshProfile();
    // veio da landing com plano escolhido: leva para concluir a assinatura
    nav(sessionStorage.getItem('thoran.intent.plan') ? '/app/planos' : '/app');
  };

  const option = (on: boolean) =>
    cx('flex min-h-[64px] w-full items-center justify-between gap-4 rounded-card border px-6 py-4 text-left transition-colors', on ? 'border-raio bg-grafite' : 'border-linha hover:border-aco');

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-10">
      <Logo size={26} />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 py-12">
        <div className="flex items-center gap-3">
          <Eyebrow>{o.eyebrow}</Eyebrow>
          <span className="label text-meta">
            {o.step} {step + 1} {o.of} 2
          </span>
        </div>
        <div aria-hidden className="h-px bg-linha">
          <div className="h-px bg-raio transition-[width] duration-500" style={{ width: `${(step + 1) * 50}%` }} />
        </div>
        <h1 className="text-h2 font-medium">{o.title}</h1>

        {step === 0 ? (
          <fieldset key="lvl" className="flex animate-rise flex-col gap-3">
            <legend className="mb-4 text-xl">{o.levelQ}</legend>
            {(Object.keys(o.levels) as Level[]).map((l) => (
              <label key={l} className={option(level === l)}>
                <span>
                  <span className="block text-lg font-medium">{o.levels[l]}</span>
                  <span className="text-sm text-meta">{o.levelHints[l]}</span>
                </span>
                <input type="radio" name="level" aria-label={o.levels[l]} className="h-5 w-5 accent-raio" checked={level === l} onChange={() => setLevel(l)} />
              </label>
            ))}
          </fieldset>
        ) : (
          <fieldset key="mk" className="flex animate-rise flex-col gap-3">
            <legend className="mb-4 text-xl">{o.marketsQ}</legend>
            {(['b3', 'crypto', 'global'] as Market[]).map((m) => (
              <label key={m} className={option(markets.includes(m))}>
                <span className="text-lg font-medium">{o.markets[m]}</span>
                <input
                  type="checkbox"
                  aria-label={o.markets[m]}
                  className="h-5 w-5 accent-raio"
                  checked={markets.includes(m)}
                  onChange={() => setMarkets((x) => (x.includes(m) ? x.filter((i) => i !== m) : [...x, m]))}
                />
              </label>
            ))}
          </fieldset>
        )}

        <div className="flex gap-3">
          {step === 1 && (
            <Button variant="secondary" size="lg" onClick={() => setStep(0)}>
              {t.common.back}
            </Button>
          )}
          {step === 0 ? (
            <Button size="lg" arrow disabled={!level} onClick={() => setStep(1)}>
              {o.next}
            </Button>
          ) : (
            <Button size="lg" arrow disabled={!markets.length} onClick={finish}>
              {o.finish}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
