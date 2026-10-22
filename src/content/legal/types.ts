/**
 * Formato dos documentos legais. Os textos usam marcadores que a página troca pelos dados da empresa
 * (src/config/company.ts): {{empresa}}, {{cnpj}}, {{endereco}}, {{contato}}, {{privacidade}}, {{dpo}}, {{site}}.
 */
export type LegalBlock = string | { list: string[] } | { note: string };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  /** Resumo em linguagem simples, no topo. Não substitui o texto completo. */
  summary: string[];
  sections: LegalSection[];
}
