/**
 * Dados da empresa usados nos Termos, na Política de Privacidade e no Aviso de Risco.
 * PREENCHA TUDO antes do lançamento. Campo vazio aparece destacado em amarelo nas
 * páginas legais e gera um aviso no console, para não passar despercebido.
 */
export const COMPANY = {
  brand: 'Thoran',
  legalName: '', // razão social, ex.: "Thoran Tecnologia Ltda."
  cnpj: '', // ex.: "00.000.000/0001-00"
  address: '', // endereço completo da sede, com CEP
  site: 'thoran.com.br',
  contactEmail: '', // ex.: "contato@thoran.com.br"
  privacyEmail: '', // canal do titular/encarregado, ex.: "privacidade@thoran.com.br"
  dpoName: '', // nome do encarregado pelo tratamento de dados (DPO) — pessoa física ou empresa
};

/** Versão dos documentos legais. Mude ao alterar qualquer texto: novos aceites passam a registrar a versão nova. */
export const LEGAL_VERSION = '1.0';
export const LEGAL_UPDATED = '2026-10-22';

export const MISSING_COMPANY_FIELDS = (Object.keys(COMPANY) as (keyof typeof COMPANY)[]).filter((k) => !COMPANY[k]);
