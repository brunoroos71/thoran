/**
 * Quem oferece o Thoran. Aparece nos Termos, na Política de Privacidade e no Aviso de Risco.
 * O Decreto 7.962/2013 (comércio eletrônico) exige identificar o fornecedor: nome, CNPJ ou CPF,
 * endereço físico e um canal eletrônico de contato.
 *
 * Campo obrigatório vazio aparece destacado em amarelo nas páginas legais e gera aviso no console.
 */
export const COMPANY = {
  brand: 'Thoran',
  /** 'pj' = empresa com CNPJ · 'pf' = pessoa física com CPF (enquanto não houver empresa aberta) */
  type: 'pf' as 'pj' | 'pf',
  /** pj: razão social e CNPJ. pf: deixe em branco e preencha `people`. */
  legalName: '',
  document: '',
  /** pf: responsáveis pelo Thoran (nome completo e CPF) */
  people: [
    { name: 'Bruno Roos', document: '023.899.530-50' },
    { name: 'João Freitas', document: '606.085.243-28' },
  ] as { name: string; document: string }[],
  /** endereço físico completo com CEP (pode ser escritório virtual / endereço comercial) */
  address: 'Avenida Brigadeiro Luís Antônio, 5083, São Paulo – SP, CEP 01402-002',
  site: 'thoran.com.br',
  contactEmail: 'yybuk09@gmail.com',
  privacyEmail: 'yybuk09@gmail.com', // canal do titular de dados; pode ser o mesmo do contato
  /** Opcional: agentes de pequeno porte podem não indicar encarregado (Resolução CD/ANPD nº 2/2022), mas precisam do canal acima. */
  dpoName: '',
};

/** Versão dos documentos legais. Mude ao alterar qualquer texto: novos aceites passam a registrar a versão nova. */
export const LEGAL_VERSION = '1.1'; // 1.1: novos preços dos planos
export const LEGAL_UPDATED = '2026-10-22';

/** Nome de quem oferece o Thoran: razão social (pj) ou os responsáveis (pf), ex.: "Bruno Roos e João Freitas". */
export const PROVIDER_NAME =
  COMPANY.type === 'pj' ? COMPANY.legalName : COMPANY.people.map((p) => p.name).join(COMPANY.people.length > 2 ? ', ' : ' e ').replace(/, ([^,]*)$/, ' e $1');

const REQUIRED = ['address', 'contactEmail', 'privacyEmail', ...(COMPANY.type === 'pj' ? (['legalName', 'document'] as const) : [])] as const;
export const MISSING_COMPANY_FIELDS: string[] = [
  ...REQUIRED.filter((k) => !COMPANY[k]),
  ...(COMPANY.type === 'pf' && !COMPANY.people.some((p) => p.name && p.document) ? ['people'] : []),
];
