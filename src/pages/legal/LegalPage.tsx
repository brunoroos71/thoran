import { Fragment, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTitle } from '@/hooks/useTitle';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { COMPANY, LEGAL_UPDATED, LEGAL_VERSION, MISSING_COMPANY_FIELDS, PROVIDER_NAME } from '@/config/company';
import { terms } from '@/content/legal/terms';
import { privacy } from '@/content/legal/privacy';
import { risk } from '@/content/legal/risk';
import type { LegalBlock, LegalDoc } from '@/content/legal/types';

type Kind = 'privacy' | 'terms' | 'risk';
const DOCS: Record<Kind, LegalDoc> = { terms, privacy, risk };
const LINKS: [Kind, string, string][] = [
  ['terms', '/termos', 'Termos de Uso'],
  ['privacy', '/privacidade', 'Privacidade e Cookies'],
  ['risk', '/aviso-de-risco', 'Aviso de Risco'],
];

const pj = COMPANY.type === 'pj';
const FIELDS: Record<string, { value: string; label: string }> = {
  empresa: { value: PROVIDER_NAME, label: pj ? 'razão social' : 'nome completo do responsável' },
  documento: { value: COMPANY.document, label: 'CNPJ' },
  endereco: { value: COMPANY.address, label: 'endereço' },
  contato: { value: COMPANY.contactEmail, label: 'e-mail de contato' },
  privacidade: { value: COMPANY.privacyEmail, label: 'e-mail de privacidade' },
  dpo: { value: COMPANY.dpoName, label: 'nome do encarregado' },
  site: { value: COMPANY.site, label: 'site' },
};

/** Frases que mudam se o Thoran é oferecido por empresa (CNPJ) ou por pessoa física (CPF), e se há encarregado. */
const COMPOSED: Record<string, string> = {
  identificacao: pj
    ? '{{empresa}}, inscrita no CNPJ sob o nº {{documento}}'
    : COMPANY.people.length
      ? COMPANY.people.map((p) => `${p.name} (CPF ${p.document})`).join(COMPANY.people.length > 2 ? ', ' : ' e ').replace(/, ([^,]*)$/, ' e $1') +
        (COMPANY.people.length > 1 ? ', pessoas físicas responsáveis pelo Thoran' : ', pessoa física responsável pelo Thoran')
      : '{{empresa}}, pessoa física responsável pelo Thoran',
  encarregado: COMPANY.dpoName
    ? 'Encarregado pelo tratamento de dados pessoais (DPO): {{dpo}}, contato {{privacidade}}.'
    : 'Canal de atendimento ao titular de dados pessoais: {{privacidade}}. Por se enquadrar como agente de tratamento de pequeno porte, o Thoran não indicou encarregado, conforme a Resolução CD/ANPD nº 2/2022, e responde pelo canal acima.',
};

/** Troca {{campo}} pelos dados da empresa; campo vazio aparece destacado para não passar no lançamento. */
function fill(text: string): React.ReactNode[] {
  return text.split(/(\{\{\w+\}\})/g).flatMap((part, i) => {
    const m = /^\{\{(\w+)\}\}$/.exec(part);
    if (!m) return [<Fragment key={i}>{part}</Fragment>];
    if (COMPOSED[m[1]]) return [<Fragment key={i}>{fill(COMPOSED[m[1]])}</Fragment>];
    const f = FIELDS[m[1]];
    if (f?.value) {
      const isEmail = f.value.includes('@');
      return isEmail ? (
        <a key={i} href={`mailto:${f.value}`} className="text-raio underline underline-offset-2">
          {f.value}
        </a>
      ) : (
        <Fragment key={i}>{f.value}</Fragment>
      );
    }
    return [
      <mark key={i} className="rounded bg-trovao/20 px-1 text-trovao">
        [preencher: {f?.label ?? m[1]}]
      </mark>,
    ];
  });
}

function Block({ b }: { b: LegalBlock }) {
  if (typeof b === 'string') return <p className="leading-relaxed text-nevoa">{fill(b)}</p>;
  if ('list' in b)
    return (
      <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed text-nevoa marker:text-meta">
        {b.list.map((li, i) => (
          <li key={i}>{fill(li)}</li>
        ))}
      </ul>
    );
  return <p className="rounded-2xl border border-trovao/40 bg-trovao/10 p-4 text-sm">{fill(b.note)}</p>;
}

export default function LegalPage({ kind }: { kind: Kind }) {
  const doc = DOCS[kind];
  useTitle(doc.title);
  useEffect(() => {
    if (MISSING_COMPANY_FIELDS.length) console.warn('[legal] Preencha src/config/company.ts:', MISSING_COMPANY_FIELDS.join(', '));
  }, []);
  const updated = new Date(`${LEGAL_UPDATED}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="Documentos legais" className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {LINKS.map(([k, to, label]) => (
              <Link
                key={k}
                to={to}
                aria-current={k === kind ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm transition-colors lg:rounded-xl ${k === kind ? 'bg-grafite text-texto' : 'text-nevoa hover:text-texto'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Nesta página" className="mt-8 hidden lg:block">
            <p className="px-4 text-xs text-meta">Nesta página</p>
            <ol className="mt-2 flex flex-col">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block rounded-lg px-4 py-1.5 text-xs text-meta hover:text-texto">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <p className="text-sm text-meta">
            Versão {LEGAL_VERSION} · Última atualização: {updated}
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">{doc.title}</h1>

          <section aria-labelledby="resumo" className="mt-8 rounded-[24px] border border-linha bg-grafite/60 p-6 backdrop-blur">
            <h2 id="resumo" className="text-sm font-medium text-raio">
              Em resumo
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-texto">
              {doc.summary.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-raio" />
                  <span>{fill(s)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-meta">O resumo ajuda na leitura, mas não substitui o texto completo abaixo.</p>
          </section>

          <div className="mt-12 flex flex-col gap-12">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-xl font-medium tracking-tight md:text-2xl">{s.title}</h2>
                <div className="mt-4 flex flex-col gap-4">
                  {s.blocks.map((b, i) => (
                    <Block key={i} b={b} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </SiteLayout>
  );
}
