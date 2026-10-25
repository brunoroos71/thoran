# Bitcoin: resposta numérica no chat

A pergunta «quero comprar bitcoin amanha, compensa?» abre a comparação por prazo (1, 7, 30 e 90 dias). O texto inclui uma conclusão condicionada ao prazo; o cartão mostra P10/P90 em uma escala de US$ 1.000, média, mediana, extremos, frequência, comparativo sem filtro, duas metades do período e todos os casos com datas. Em 30/90 dias compara compra única a quatro parcelas semanais. A interface preserva a análise no histórico.

O módulo compartilhado `supabase/functions/_shared/bitcoin.ts` deve permanecer idêntico a `trade-agent/supabase/functions/_shared/agente/bitcoin.ts`. As contas são feitas pelo motor Python do agente, não pelo modelo de linguagem. Métodos e critérios completos estão em `trade-agent/docs/bitcoin-decisao.md`.

A fonte comercial ainda está pendente. Não existe histórico real de Bitcoin neste repositório. A demonstração privada recebe o JSON do CLI de pesquisa em `public/bitcoin-research.json` (ignorado pelo Git), com escopo `research_only` e data fixa visíveis. Sem esse arquivo, explica a indisponibilidade. Não cobra créditos simulados. Não enviar `public/bitcoin-research.json` ou um `dist/` que o contenha para hospedagem pública. O diretório `dist/` é ignorado pelo Git.

Produção: publicar o agente, o proxy e o site compatíveis. O cliente consulta o GET autenticado do proxy (`bitcoin_version=1`) antes do POST. O proxy exige resposta compatível e rejeita estudo de pesquisa no caminho público. `no_charge=true` sinaliza ausência de base e estorno integral. O agente só entrega números quando há autorização comercial registrada, estudo válido e atualização para a data da análise. A autorização deve cobrir os dados e derivados exibidos pelo produto. Não há migração de banco.

Escopo inicial: perguntas diretas de compra à vista de BTC, incluindo a pergunta informada. Eventos políticos, impostos, alavancagem, comparação com outros ativos e demais temas continuam no fluxo anterior. O reconhecimento é explícito; não interpreta qualquer pergunta livre como estudo de preço. Não executa operações financeiras.

Verificação local: build TypeScript/Vite, testes Deno do proxy com Auth/banco/agente simulados, pergunta original, troca de prazo, lista de casos, histórico e saldo sem alteração. A fixture real de pesquisa permanece exclusivamente local.
