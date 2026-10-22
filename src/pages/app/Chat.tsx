import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { cx } from '@/lib/format';
import { agentService, AgentError, type AgentCallMode, type AgentErrorCode, type AnalysisResponse, type Market } from '@/services/agent';
import { CreditError } from '@/services/billing';
import { useCredits } from '@/services/billing/CreditsProvider';
import { saveAnalysis } from '@/services/historyService';
import { PrecedentCard } from '@/components/ui/PrecedentCard';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { RichText } from '@/components/ui/RichText';
import { IllustrativeTag } from '@/components/ui/Badge';
import { Symbol } from '@/components/ui/Logo';
import { Feedback } from '@/components/app/Feedback';
import { Composer, Greeting, Suggestions } from '@/components/chat/Composer';
import { PENDING_KEY } from '@/components/chat/AuthGate';

interface Msg {
  id: string;
  role: 'user' | 'agent';
  text: string;
  query?: string;
  market?: Market | null;
  mode?: AgentCallMode;
  analyses: AnalysisResponse[];
  status: 'streaming' | 'done' | 'error';
  error?: AgentErrorCode;
}

const uid = () => Math.random().toString(36).slice(2);
// O agente real já abre a resposta com o aviso (D2/D3) e fecha com o fecho; aí o rodapé repetiria o mesmo texto.
const hasNotice = (text: string) => text.includes('não é recomendação de investimento');

export default function Chat() {
  const { t, locale } = useI18n();
  const c = t.app;
  useTitle(c.chatTitle);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [market, setMarket] = useState<Market | null>(null);
  const [mode, setMode] = useState<AgentCallMode>('analise');
  const { state: credits, charge, askTopup } = useCredits();
  const cost = mode === 'analise' ? credits?.costs.analise ?? 5 : credits?.costs.pergunta ?? 1;
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = msgs.some((m) => m.status === 'streaming');
  const mock = agentService.mode === 'mock';

  const [params] = useSearchParams();
  const nova = params.get('nova');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs]);
  useEffect(() => () => abort.current?.abort(), []);
  // "Nova análise" na barra lateral: limpa a conversa
  useEffect(() => {
    if (!nova) return;
    abort.current?.abort();
    setMsgs([]);
    setInput('');
  }, [nova]);

  const patch = (id: string, f: (m: Msg) => Msg) => setMsgs((all) => all.map((m) => (m.id === id ? f(m) : m)));

  async function run(agentId: string, query: string, mk: Market | null, md: AgentCallMode) {
    abort.current = new AbortController();
    const signal = abort.current.signal;
    const kind = md === 'analise' ? 'consumo_analise' : 'consumo_pergunta';
    try {
      // créditos: debita antes, estorna se o agente falhar (no live, isso acontece no /agent-proxy)
      await charge(kind, `chat_${agentId}`, async () => {
        for await (const chunk of agentService.stream({ query, market: mk, locale }, { signal, mode: md })) {
          if (chunk.type === 'text') patch(agentId, (m) => ({ ...m, text: m.text + chunk.delta }));
          else if (chunk.type === 'analysis') {
            patch(agentId, (m) => ({ ...m, analyses: [...m.analyses, chunk.data] }));
            saveAnalysis(query, chunk.data);
          }
        }
      });
      patch(agentId, (m) => ({ ...m, status: 'done' }));
    } catch (e) {
      if ((e as Error).name === 'AbortError') return patch(agentId, (m) => ({ ...m, status: 'done' }));
      const code: AgentErrorCode = e instanceof CreditError ? e.code : e instanceof AgentError ? e.code : 'generic';
      if (e instanceof AgentError && e.code === 'credits') askTopup(cost);
      patch(agentId, (m) => ({ ...m, status: 'error', error: code }));
    }
  }

  function send(query: string) {
    const q = query.trim();
    if (!q || busy) return;
    const agentId = uid();
    setMsgs((all) => [
      ...all,
      { id: uid(), role: 'user', text: q, analyses: [], status: 'done' },
      { id: agentId, role: 'agent', text: '', query: q, market, mode, analyses: [], status: 'streaming' },
    ]);
    setInput('');
    run(agentId, q, market, mode);
  }

  // pergunta feita na home antes do cadastro: envia sozinha assim que o app abre
  const sentPending = useRef(false);
  useEffect(() => {
    if (sentPending.current || !credits) return;
    let q: string | null = null;
    try {
      q = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
    sentPending.current = true;
    if (q) send(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credits]);

  function retry(m: Msg) {
    patch(m.id, (x) => ({ ...x, text: '', analyses: [], status: 'streaming', error: undefined }));
    run(m.id, m.query!, m.market ?? null, m.mode ?? 'analise');
  }

  const errText = (code?: AgentErrorCode) =>
    code === 'offline' ? c.errOffline : code === 'credits' ? c.errLimit : code === 'blocked' ? c.credits.blocked : c.errGeneric;

  const tools = (
    <>
      <div role="radiogroup" aria-label={c.credits.modeLabel} className="inline-flex rounded-full bg-carbono p-0.5">
        {(['analise', 'pergunta'] as const).map((md) => (
          <button
            key={md}
            type="button"
            role="radio"
            aria-checked={mode === md}
            onClick={() => setMode(md)}
            className={cx('min-h-[32px] rounded-full px-3 text-xs transition-colors', mode === md ? 'bg-grafite font-medium text-texto ring-1 ring-linha' : 'text-meta hover:text-texto')}
          >
            {md === 'analise' ? c.credits.full : c.credits.quick}
          </button>
        ))}
      </div>
      <label className="sr-only" htmlFor="market">
        {c.marketLabel}
      </label>
      <select
        id="market"
        value={market ?? ''}
        onChange={(e) => setMarket((e.target.value || null) as Market | null)}
        className="min-h-[32px] rounded-full border-0 bg-carbono px-3 text-xs text-nevoa focus:outline-none focus-visible:ring-1 focus-visible:ring-raio"
      >
        <option value="">{c.marketAny}</option>
        {(['b3', 'crypto', 'global'] as const).map((mk) => (
          <option key={mk} value={mk}>
            {t.onboarding.markets[mk]}
          </option>
        ))}
      </select>
    </>
  );
  const composer = (
    <Composer
      value={input}
      onChange={setInput}
      onSubmit={() => send(input)}
      placeholder={t.home.placeholder}
      label={c.send}
      busy={busy}
      onStop={() => abort.current?.abort()}
      stopLabel={c.stop}
      tools={tools}
      hint={`${cost} ${cost === 1 ? t.pricing.credit : t.pricing.credits}`}
      autoFocus
      size={msgs.length ? 'md' : 'lg'}
    />
  );

  if (msgs.length === 0)
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="flex w-full max-w-3xl flex-col gap-8">
          <Greeting title={t.home.greeting} />
          {composer}
          <Suggestions items={t.home.suggestions} onPick={send} />
        </div>
      </div>
    );

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 px-4 pb-6 pt-6 sm:px-6 md:pt-10">
        <ol className="mx-auto flex max-w-3xl flex-col gap-8" aria-live="polite">
          {msgs.map((m) =>
            m.role === 'user' ? (
              <li key={m.id} className="max-w-[85%] self-end rounded-3xl bg-grafite px-5 py-3">
                {m.text}
              </li>
            ) : (
              <li key={m.id} className="flex gap-4" aria-busy={m.status === 'streaming'}>
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-linha">
                  <Symbol size={14} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-5">
                  {m.status === 'streaming' && !m.text && (
                    <p className="flex items-center gap-3 text-sm text-nevoa">
                      <span aria-hidden className="h-3 w-3 animate-spin rounded-full border-2 border-raio border-r-transparent" />
                      {c.thinking}
                    </p>
                  )}
                  {m.text && (
                    <RichText text={m.text}>
                      {m.status === 'streaming' && <span aria-hidden className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-blink bg-raio" />}
                    </RichText>
                  )}
                  {mock && m.text && m.status === 'done' && <IllustrativeTag text={t.common.illustrative} />}
                  {m.analyses
                    .filter((a) => a.precedents.count > 0)
                    .map((a) => (
                      <div key={a.id} className="animate-rise">
                        <PrecedentCard data={a} illustrative={mock} href={`/app/analise/${a.id}`} showDisclaimer={false} className="rounded-3xl" />
                      </div>
                    ))}
                  {m.status === 'error' && (
                    <div role="alert" className="flex flex-col items-start gap-4 rounded-3xl border border-baixa/50 bg-grafite p-5">
                      <p className="flex gap-2">
                        <span aria-hidden className="font-mono text-baixa">!</span>
                        {errText(m.error)}
                      </p>
                      {m.error === 'credits' || m.error === 'blocked' ? (
                        <Link to="/app/planos" className="inline-flex min-h-[44px] items-center rounded-full bg-raio px-5 text-sm font-semibold text-carbono">
                          {c.seePlans}
                        </Link>
                      ) : (
                        <button onClick={() => retry(m)} className="min-h-[44px] rounded-full border border-linha px-5 text-sm hover:border-texto">
                          {t.common.tryAgain}
                        </button>
                      )}
                    </div>
                  )}
                  {m.status === 'done' && m.analyses[0] && <Feedback analysisId={m.analyses[0].id} />}
                  {m.status !== 'streaming' && !hasNotice(m.text) && <Disclaimer text={m.analyses[0]?.disclaimer} className="border-0 pt-0" />}
                </div>
              </li>
            ),
          )}
        </ol>
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-0 bg-gradient-to-t from-carbono via-carbono to-transparent px-4 pb-4 pt-6 sm:px-6">
        <div className="mx-auto max-w-3xl">{composer}</div>
      </div>
    </div>
  );
}
