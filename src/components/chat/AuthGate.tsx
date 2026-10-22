import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { env } from '@/lib/env';
import { track } from '@/lib/analytics';
import { useAuth } from '@/services/authService';
import { Field } from '@/components/ui/Field';
import { Symbol } from '@/components/ui/Logo';
import { WaitlistForm } from '@/components/landing/WaitlistForm';

export const PENDING_KEY = 'thoran.pending';

/**
 * Modal que aparece quando um visitante envia a primeira mensagem.
 * A pergunta fica guardada e é enviada sozinha assim que a conta é criada.
 */
export function AuthGate({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const h = t.home;
  const a = t.auth;
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const done = () => {
    track('waitlist_success', { via: 'chat_gate', mode });
    nav('/app');
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'signup' && password.length < 8) return setErr(a.passwordHint);
    setBusy(true);
    setErr(null);
    try {
      if (mode === 'signup') {
        const r = await signUp('', email.trim(), password);
        if (r.needsConfirmation) return setConfirm(true);
      } else await signIn(email.trim(), password);
      done();
    } catch {
      setErr(mode === 'login' ? a.errCredentials : a.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-carbono/80 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="gate-title" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="relative w-full max-w-md rounded-[28px] border border-linha bg-grafite p-6 shadow-2xl sm:p-8">
        <button onClick={onClose} aria-label={t.app.credits.close} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-meta hover:text-texto">
          ✕
        </button>
        <Symbol size={28} />
        <h2 id="gate-title" className="mt-5 text-2xl font-medium tracking-tight">
          {env.waitlistMode ? t.nav.ctaWaitlist : h.gateTitle}
        </h2>
        <p className="mt-2 text-sm text-nevoa">{env.waitlistMode ? h.gateWaitlist : h.gateSub}</p>

        {env.waitlistMode ? (
          <div className="mt-6">
            <WaitlistForm id="gate" />
          </div>
        ) : confirm ? (
          <p role="status" className="mt-6 rounded-2xl border border-raio/40 bg-raio/10 p-4 text-sm">
            {h.gateConfirm}
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => signInWithGoogle().then(done)}
              className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-texto font-semibold text-carbono transition-colors hover:bg-raio"
            >
              <svg aria-hidden width="18" height="18" viewBox="0 0 18 18">
                <path fill="currentColor" d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5zM9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.3 0-4.3-1.6-5-3.7H1v2.3A9 9 0 0 0 9 18zM4 10.8a5.4 5.4 0 0 1 0-3.5V5H1a9 9 0 0 0 0 8l3-2.2zM9 3.6c1.3 0 2.5.5 3.4 1.3L15 2.4A9 9 0 0 0 1 5l3 2.3c.7-2.1 2.7-3.7 5-3.7z" />
              </svg>
              {a.google}
            </button>
            <p className="my-5 flex items-center gap-4 text-xs text-meta before:h-px before:flex-1 before:bg-linha after:h-px after:flex-1 after:bg-linha">{a.or}</p>
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
              <Field label={a.email} hideLabel placeholder={a.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Field
                label={a.password}
                hideLabel
                placeholder={mode === 'signup' ? `${a.password} (${a.passwordHint.toLowerCase()})` : a.password}
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                error={err}
              />
              <button type="submit" disabled={busy} className="min-h-[52px] rounded-full bg-raio font-semibold text-carbono transition-colors hover:bg-texto disabled:opacity-60">
                {busy ? t.common.loading : mode === 'signup' ? h.gateSubmit : h.gateLogin}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-nevoa">
              {mode === 'signup' ? h.gateHasAccount : h.gateNoAccount}{' '}
              <button type="button" onClick={() => (setMode(mode === 'signup' ? 'login' : 'signup'), setErr(null))} className="min-h-[32px] text-texto underline underline-offset-2 hover:text-raio">
                {mode === 'signup' ? a.loginTitle : a.signupTitle}
              </button>
            </p>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-meta">
              {t.legalConsent.pre}
              <a href="/termos" target="_blank" className="underline hover:text-texto">{t.legalConsent.terms}</a>
              {t.legalConsent.and}
              <a href="/privacidade" target="_blank" className="underline hover:text-texto">{t.legalConsent.privacy}</a>
              {t.legalConsent.mid}
              <a href="/aviso-de-risco" target="_blank" className="underline hover:text-texto">{t.legalConsent.risk}</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
