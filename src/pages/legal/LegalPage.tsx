import { SiteLayout } from '@/components/layout/SiteLayout';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';

type Kind = 'privacy' | 'terms' | 'risk';

// Estrutura dos documentos. O texto final deve vir do jurídico.
const SECTIONS: Record<Kind, string[]> = {
  privacy: [
    'Quem é o controlador dos dados',
    'Quais dados coletamos (e-mail, origem de acesso, data do consentimento)',
    'Para que usamos os dados',
    'Base legal (LGPD, art. 7º)',
    'Com quem compartilhamos (provedores de infraestrutura e e-mail)',
    'Por quanto tempo guardamos',
    'Seus direitos como titular (art. 18 da LGPD)',
    'Cookies e tecnologias de medição',
    'Contato do encarregado (DPO)',
  ],
  terms: [
    'Aceitação dos termos',
    'O que o Thoran é e o que não é',
    'Cadastro e conta',
    'Planos, pagamentos e cancelamento',
    'Uso permitido',
    'Propriedade intelectual',
    'Limitação de responsabilidade',
    'Alterações nos termos',
    'Foro e legislação aplicável',
  ],
  risk: [
    'O Thoran não é recomendação de investimento',
    'Resultados passados não garantem resultados futuros',
    'Riscos de operar no mercado financeiro',
    'Riscos específicos de derivativos (mini-índice, mini-dólar)',
    'Riscos específicos de criptoativos',
    'Limitações dos dados e dos modelos',
    'Responsabilidade pelas decisões',
  ],
};

export default function LegalPage({ kind }: { kind: Kind }) {
  const { t } = useI18n();
  const title = t.legal[kind];
  useTitle(title);
  return (
    <SiteLayout>
      <article className="wrap max-w-4xl pb-24 pt-32 md:pt-40">
        <Eyebrow>{t.legal.updated}</Eyebrow>
        <h1 className="mt-6 text-display font-medium">{title}</h1>
        <p className="mt-8 inline-block rounded-card border border-trovao/50 px-4 py-2 font-mono text-sm text-trovao">{t.common.legalPlaceholder}</p>
        {kind === 'risk' && <p className="mt-8 text-xl leading-relaxed text-texto">{t.common.disclaimer}</p>}
        <ol className="mt-12 flex flex-col gap-10">
          {SECTIONS[kind].map((s, i) => (
            <li key={s} className="border-t border-linha pt-6">
              <h2 className="text-2xl font-medium tracking-tight">
                <span className="label mr-3 text-meta">{String(i + 1).padStart(2, '0')}</span>
                {s}
              </h2>
              <p className="mt-4 leading-relaxed text-nevoa">
                {t.common.legalPlaceholder} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.
              </p>
            </li>
          ))}
        </ol>
      </article>
    </SiteLayout>
  );
}
