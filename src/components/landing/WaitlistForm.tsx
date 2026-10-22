import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { track } from '@/lib/analytics';
import { captureAttribution } from '@/lib/utm';
import { cx } from '@/lib/format';
import { joinWaitlist, EMAIL_RE, type WaitlistError } from '@/services/waitlistService';

type State = 'idle' | 'error' | 'submitting' | 'success';

/** Estados: vazio → erro | enviando → confirmado. Tom "raio" para o bloco de CTA final. */
export function WaitlistForm({ id, tone = 'dark', redirect = true }: { id: string; tone?: 'dark' | 'raio'; redirect?: boolean }) {
  const { t, locale } = useI18n();
  const f = t.form;
  const nav = useNavigate();
  const uid = useId();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<WaitlistError | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const seen = useRef(false);

  useEffect(() => {
    const el = formRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !seen.current) {
        seen.current = true;
        track('waitlist_view', { form_id: id });
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  const msg: Record<WaitlistError, string> = {
    invalid: f.errInvalid,
    duplicate: f.errDuplicate,
    consent: f.errConsent,
    rate: f.errRate,
    generic: f.errGeneric,
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    track('waitlist_submit', { form_id: id });
    const local: WaitlistError | null = !EMAIL_RE.test(email.trim()) ? 'invalid' : !consent ? 'consent' : null;
    if (local) {
      setError(local);
      setState('error');
      track('waitlist_error', { form_id: id, reason: local });
      return;
    }
    setState('submitting');
    setError(null);
    const res = await joinWaitlist({ email, consent, website, locale, ...captureAttribution() });
    if (res.ok) {
      setState('success');
      track('waitlist_success', { form_id: id });
      if (redirect) setTimeout(() => nav('/obrigado'), 900);
    } else {
      setError(res.error);
      setState('error');
      track('waitlist_error', { form_id: id, reason: res.error });
    }
  }

  const onRaio = tone === 'raio';

  if (state === 'success')
    return (
      <div role="status" aria-live="polite" className={cx('flex items-start gap-4 rounded-card border p-5', onRaio ? 'border-carbono/30' : 'border-raio/40 bg-grafite')}>
        <span aria-hidden className={cx('mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono', onRaio ? 'bg-carbono text-raio' : 'bg-raio text-carbono')}>
          ✓
        </span>
        <div>
          <p className={cx('text-lg font-semibold', onRaio ? 'text-carbono' : 'text-texto')}>{f.successTitle}</p>
          <p className={cx('text-sm', onRaio ? 'text-carbono' : 'text-nevoa')}>{f.successBody}</p>
        </div>
      </div>
    );

  const emailErr = error === 'invalid' || error === 'duplicate' || error === 'rate' || error === 'generic';
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex w-full max-w-xl flex-col gap-4" aria-describedby={`${uid}-note`}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`${uid}-email`} className="sr-only">
          {f.emailLabel}
        </label>
        <input
          id={`${uid}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={f.emailPlaceholder}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === 'error') setState('idle');
          }}
          aria-invalid={emailErr || undefined}
          aria-describedby={error ? `${uid}-err` : undefined}
          className={cx(
            'h-14 w-full min-w-0 shrink-0 rounded-full border px-6 sm:w-auto sm:flex-1 text-base transition-colors focus:outline-none',
            onRaio ? 'bg-carbono text-texto placeholder:text-meta' : 'bg-grafite text-texto placeholder:text-meta',
            emailErr ? 'border-baixa' : onRaio ? 'border-carbono/40 focus:border-carbono' : 'border-linha hover:border-aco focus:border-raio',
          )}
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className={cx(
            'group inline-flex h-14 items-center justify-center gap-3 rounded-full px-8 text-base font-semibold transition-colors disabled:cursor-wait',
            onRaio ? 'bg-carbono text-texto hover:bg-grafite' : 'bg-raio text-carbono hover:bg-texto',
          )}
        >
          {state === 'submitting' ? (
            <>
              <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              {f.submitting}
            </>
          ) : (
            <>
              {f.submit}
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </>
          )}
        </button>
      </div>

      {/* Honeypot: fora da tela, ignorado por leitores de tela */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>{f.honeypot}</label>
        <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="flex items-start gap-3">
        <span className="relative -m-3 flex h-11 w-11 shrink-0 items-center justify-center">
          <input
            id={`${uid}-consent`}
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (error === 'consent') setState('idle');
            }}
            aria-invalid={error === 'consent' || undefined}
            className={cx(
              'peer h-5 w-5 cursor-pointer appearance-none rounded-[4px] border transition-colors',
              onRaio ? 'bg-transparent checked:bg-carbono' : 'bg-grafite checked:border-raio checked:bg-raio',
              error === 'consent' ? 'border-baixa' : onRaio ? 'border-carbono' : 'border-aco',
            )}
          />
          <svg aria-hidden viewBox="0 0 12 12" className="pointer-events-none absolute h-3 w-3 opacity-0 peer-checked:opacity-100">
            <path d="M2 6.5 5 9l5-6" fill="none" stroke={onRaio ? '#7DD8FF' : '#0B0D10'} strokeWidth="2" />
          </svg>
        </span>
        <label htmlFor={`${uid}-consent`} className={cx('text-sm leading-relaxed', onRaio ? 'text-carbono' : 'text-nevoa')}>
          {f.consentPre}
          <Link to="/privacidade" className={cx('underline underline-offset-2', onRaio ? 'text-carbono' : 'text-texto hover:text-raio')}>
            {f.consentLink}
          </Link>
          {f.consentPost}
        </label>
      </div>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {state === 'error' && error && (
          <p id={`${uid}-err`} role="alert" className={cx('flex gap-2 text-sm font-medium', onRaio ? 'text-carbono' : error === 'duplicate' ? 'text-trovao' : 'text-baixa')}>
            <span aria-hidden>{error === 'duplicate' ? '!' : '✕'}</span>
            {msg[error]}
          </p>
        )}
      </div>
      <p id={`${uid}-note`} className={cx('label -mt-3 text-[10px]', onRaio ? 'text-carbono/80' : 'text-meta')}>
        {f.note}
      </p>
    </form>
  );
}
