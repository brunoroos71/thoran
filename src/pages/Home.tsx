import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { track } from '@/lib/analytics';
import { useTitle } from '@/hooks/useTitle';
import { useAuth } from '@/services/authService';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { Composer, Greeting, Suggestions } from '@/components/chat/Composer';
import { AuthGate, PENDING_KEY } from '@/components/chat/AuthGate';

/** A home é o produto: uma caixa de mensagem. Ao enviar, cria a conta e a pergunta segue para o app. */
export default function Home() {
  const { t } = useI18n();
  const h = t.home;
  useTitle();
  const { user, loading } = useAuth();
  const [input, setInput] = useState('');
  const [gate, setGate] = useState(false);

  if (!loading && user) return <Navigate to="/app" replace />;

  const send = (q: string) => {
    const text = q.trim();
    if (!text) return;
    try {
      sessionStorage.setItem(PENDING_KEY, text);
    } catch {
      /* modo privado */
    }
    setInput(text);
    track('waitlist_submit', { via: 'chat_home' });
    setGate(true);
  };

  return (
    <SiteLayout fill>
      <section className="flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-6 sm:px-6">
        <div className="flex w-full max-w-3xl flex-col gap-8">
          <Greeting title={h.greeting} sub={h.sub} />
          <Composer value={input} onChange={setInput} onSubmit={() => send(input)} placeholder={h.placeholder} label={t.app.send} autoFocus size="lg" />
          <Suggestions items={h.suggestions} onPick={send} />
        </div>
      </section>
      {gate && <AuthGate onClose={() => setGate(false)} />}
    </SiteLayout>
  );
}
