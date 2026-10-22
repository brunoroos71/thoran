import { useEffect, useState, type FormEvent } from 'react';
import { PLANS } from '@/config/pricing';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/services/authService';
import { useTitle } from '@/hooks/useTitle';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { AuthShell } from './AuthShell';

function GoogleButton() {
  const { t } = useI18n();
  const { signInWithGoogle } = useAuth();
  const nav = useNavigate();
  return (
    <>
      <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => signInWithGoogle().then(() => nav('/app'))}>
        <svg aria-hidden width="18" height="18" viewBox="0 0 18 18">
          <path fill="currentColor" d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5zM9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.3 0-4.3-1.6-5-3.7H1v2.3A9 9 0 0 0 9 18zM4 10.8a5.4 5.4 0 0 1 0-3.5V5H1a9 9 0 0 0 0 8l3-2.2zM9 3.6c1.3 0 2.5.5 3.4 1.3L15 2.4A9 9 0 0 0 1 5l3 2.3c.7-2.1 2.7-3.7 5-3.7z" />
        </svg>
        {t.auth.google}
      </Button>
      <p className="label flex items-center gap-4 text-meta before:h-px before:flex-1 before:bg-linha after:h-px after:flex-1 after:bg-linha">{t.auth.or}</p>
    </>
  );
}

export function LoginPage() {
  const { t } = useI18n();
  const a = t.auth;
  useTitle(a.loginTitle);
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signIn(email.trim(), password);
      nav(params.get('next') ?? '/app');
    } catch {
      setErr(a.errCredentials);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={a.loginTitle}
      footer={
        <>
          {a.noAccount}{' '}
          <Link to="/cadastro" className="text-texto underline hover:text-raio">
            {a.signupTitle}
          </Link>
        </>
      }
    >
      <GoogleButton />
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <Field label={a.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label={a.password} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required error={err} />
        <Link to="/recuperar-senha" className="inline-flex min-h-[44px] items-center self-start text-sm text-nevoa underline hover:text-raio">
          {a.forgot}
        </Link>
        <Button type="submit" size="lg" disabled={busy} arrow>
          {busy ? t.common.loading : a.submitLogin}
        </Button>
      </form>
    </AuthShell>
  );
}

export function SignupPage() {
  const { t } = useI18n();
  const a = t.auth;
  useTitle(a.signupTitle);
  // plano escolhido na landing (/cadastro?plano=pro&ciclo=anual): guardado para a tela de planos
  const [params] = useSearchParams();
  const intentPlan = params.get('plano') === 'basic' || params.get('plano') === 'pro' ? (params.get('plano') as 'basic' | 'pro') : null;
  const intentCycle = params.get('ciclo') === 'anual' ? 'anual' : 'mensal';
  useEffect(() => {
    if (!intentPlan) return;
    sessionStorage.setItem('thoran.intent.plan', intentPlan);
    sessionStorage.setItem('thoran.intent.cycle', intentCycle);
  }, [intentPlan, intentCycle]);
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setErr(a.passwordHint);
    setBusy(true);
    setErr(null);
    try {
      const r = await signUp(name.trim(), email.trim(), password);
      if (r.needsConfirmation) setSent(true);
      else nav('/app');
    } catch {
      setErr(a.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={a.signupTitle}
      footer={
        <>
          {a.hasAccount}{' '}
          <Link to="/entrar" className="text-texto underline hover:text-raio">
            {a.loginTitle}
          </Link>
        </>
      }
    >
      {intentPlan && (
        <p className="flex items-center justify-between rounded-2xl border border-raio/40 bg-raio/10 px-4 py-3 text-sm">
          <span>
            {PLANS[intentPlan].name} · {intentCycle === 'anual' ? t.pricing.annual : t.pricing.monthly}
          </span>
          <span className="text-raio">{t.pricing.ctaSignup}</span>
        </p>
      )}
      {sent ? (
        <p role="status" className="rounded-card border border-raio/40 bg-grafite p-5">
          {a.checkEmail}
        </p>
      ) : (
        <>
          <GoogleButton />
          <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
            <Field label={a.name} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Field label={a.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field label={a.password} type="password" autoComplete="new-password" hint={a.passwordHint} value={password} onChange={(e) => setPassword(e.target.value)} required error={err} />
            <p className="text-xs leading-relaxed text-meta">
              {t.legalConsent.pre}
              <Link to="/termos" target="_blank" className="underline">{t.legalConsent.terms}</Link>
              {t.legalConsent.and}
              <Link to="/privacidade" target="_blank" className="underline">{t.legalConsent.privacy}</Link>
              {t.legalConsent.mid}
              <Link to="/aviso-de-risco" target="_blank" className="underline">{t.legalConsent.risk}</Link>.
            </p>
            <Button type="submit" size="lg" disabled={busy} arrow>
              {busy ? t.common.loading : a.submitSignup}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export function ResetPage() {
  const { t } = useI18n();
  const a = t.auth;
  useTitle(a.resetTitle);
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <AuthShell title={a.resetTitle} footer={<Link to="/entrar" className="underline">{t.common.back}</Link>}>
      {sent ? (
        <p role="status" className="rounded-card border border-raio/40 bg-grafite p-5">
          {a.resetSent}
        </p>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={async (e) => {
            e.preventDefault();
            await resetPassword(email.trim()).catch(() => undefined);
            setSent(true); // não revela se o e-mail existe
          }}
        >
          <Field label={a.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" size="lg" arrow>
            {a.submitReset}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export function UpdatePasswordPage() {
  const { t } = useI18n();
  const a = t.auth;
  useTitle(a.updatePasswordTitle);
  const { updatePassword } = useAuth();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <AuthShell title={a.updatePasswordTitle}>
      <form
        className="flex flex-col gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (password.length < 8) return setErr(a.passwordHint);
          try {
            await updatePassword(password);
            nav('/app');
          } catch {
            setErr(a.errGeneric);
          }
        }}
      >
        <Field label={a.password} type="password" autoComplete="new-password" hint={a.passwordHint} value={password} onChange={(e) => setPassword(e.target.value)} error={err} />
        <Button type="submit" size="lg" arrow>
          {a.submitUpdate}
        </Button>
      </form>
    </AuthShell>
  );
}
