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
  /** razão social (pj) ou nome completo do responsável (pf) */
  legalName: '',
  /** CNPJ (pj) ou CPF (pf) */
  document: '',
  /** endereço físico completo com CEP (pode ser escritório virtual / endereço comercial) */
  address: '',
  site: 'thoran.com.br',
  contactEmail: '', // ex.: "contato@thoran.com.br"
  privacyEmail: '', // canal do titular de dados; pode ser o mesmo do contato
  /** Opcional: agentes de pequeno porte podem não indicar encarregado (Resolução CD/ANPD nº 2/2022), mas precisam do canal acima. */
  dpoName: '',
};

/** Versão dos documentos legais. Mude ao alterar qualquer texto: novos aceites passam a registrar a versão nova. */
export const LEGAL_VERSION = '1.0';
export const LEGAL_UPDATED = '2026-10-22';

const REQUIRED = ['legalName', 'document', 'address', 'contactEmail', 'privacyEmail'] as const;
export const MISSING_COMPANY_FIELDS = REQUIRED.filter((k) => !COMPANY[k]);
