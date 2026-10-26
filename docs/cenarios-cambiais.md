# Comparação de cenários

A rota autenticada `/app/cenarios`, acessível pela barra lateral, compara alta e queda de USD/BRL e EUR/BRL. Permite escolher janelas de 5, 20 ou 60 observações e objetivo de pagar, receber/converter ou comparar exposição. O histórico conserva os dois cenários, a conclusão condicional, as fontes e o método.

O cálculo é feito no repositório `Joaoocfreitas/trade-agent`, com as séries do BCB e um recorte de até dez anos. A tela explicita que os dois choques são hipóteses simétricas de sensibilidade; não são previsões ou probabilidades. Cada objetivo apresenta o risco e a oportunidade perdida na direção oposta. Não recebe valores pessoais.

## Compatibilidade e créditos

O contrato fica em `supabase/functions/_shared/scenario-contract.ts`, reexportado para o frontend. Deve ser mantido igual ao contrato do agente.

- Antes de enviar uma comparação paga, o cliente faz `GET agent-proxy` com autenticação. Exige `scenarios_version: 1`. Um proxy antigo responde erro antes de qualquer POST/debito.
- O proxy valida os parâmetros antes do débito e gera a pergunta canônica. Comparação não aceita modo pergunta rápida.
- Resposta completa custa `consumo_analise`, conforme `credit_config` (atualmente 5 créditos). Os cenários não são confundidos com uma análise sem cartão, que normalmente vira pergunta rápida.
- Evidência insuficiente gera estorno integral. Resposta de agente antigo/incompatível também é estornada e não é salva como análise válida.
- Os créditos exigidos inicialmente são os de uma análise, mesmo que uma resposta insuficiente depois gere estorno.
- O modo mock oferece a demonstração gratuitamente, usando uma fotografia histórica de 22/10/2026. A interface identifica a data e informa que não consulta cotações atuais.

## Publicação e verificação

Publicar o `analyze` do trade-agent e depois o `agent-proxy` deste repositório, antes de usar a funcionalidade no site em modo live. Não há novas tabelas, migrações ou segredos. Não é necessário alterar o modelo usado pelo classificador de perguntas.

```sh
npm ci
npm run build
deno test --allow-read --allow-env supabase/functions/_shared/scenarios_test.ts supabase/functions/agent-proxy/index_test.ts
```

O teste do proxy executa o handler real contra Auth, banco e agente simulados. Confere compatibilidade, validação antes do débito, valor da cobrança, estorno, histórico, descarte da pergunta livre e preservação do comportamento do chat comum. Ele não testa transações reais de produção.

Teste de aceitação: entrar em `/app/cenarios`, comparar USD/20/pagar, mudar para EUR/20/receber e conferir que mudam os números e o efeito para o objetivo; reabrir o resultado pelo histórico. Na demonstração o saldo deve permanecer igual. Em produção, usar uma conta de teste e conferir o débito/estorno no razão de créditos.
