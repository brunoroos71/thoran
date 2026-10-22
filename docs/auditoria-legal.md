# Auditoria legal do site contra as "Regras do agente"

Feita em 22/10/2026 por agentes de IA que leram o site inteiro (textos, páginas, componentes, Edge Functions e a migração inicial) contra a nota *Regras do agente — o que a IA pode e não pode dizer* (códigos P, N, D e M). **Não é parecer jurídico:** serve para levar ao advogado de mercado de capitais junto com a nota e um lote de telas.

Arquivos e linhas são os de antes deste PR. Os códigos entre colchetes são os da nota. Ex.: M1 = não fazer alerta de operação; N2 = não dizer para onde o preço vai; D3 = aviso de IA e de não credenciada em toda resposta.

## Resumo

- **Resolvidos neste PR:** 5 itens (gráfico, aviso, recusa, alerta de risco do agente, etiqueta do mock).
- **Em parte:** 4.
- **Pendentes:** 25. A maioria é texto do site e decisão de produto ou de posicionamento (Alertas, slogan, planos, onboarding, landing), que fica com quem decide o produto.
- **Antes de abrir para o público:** os itens de gravidade alta que seguem pendentes, os textos jurídicos (item 13) revisados por advogado e `BILLING_MODE=live` só depois disso.

## Gravidade alta

### 1. [M1] `src/pages/app/Alerts.tsx:20`

**Hoje:** Tela Alertas: 'Escolha eventos e ativos para acompanhar. As notificações chegam em breve.' com placeholder 'Ex.: Copom, payroll, WIN, BTC' (pt-BR.ts:467-474); item do Pro 'Alertas de eventos e ativos acompanhados' (pt-BR.ts:298); link na barra lateral (AppLayout.tsx:64-66); rota /app/alertas (App.tsx:75); tabela alerts (migrations/20261022000000_init.sql:123-130)

**O que fazer:** Remover a página, a rota, o item do menu, a tabela alerts e o item 'Alertas de eventos e ativos acompanhados' do Pro. Se quiserem algo recorrente, trocar por conteúdo igual para todos e sem ativo nem hora, sobre eventos que já aconteceram. Exemplo: 'Toda segunda: o que o repertório tem sobre os eventos da semana passada, com fonte'. Nunca 'evento chegando'.

**Situação:** Pendente.

### 2. [N2, N6, D8] `src/components/ui/PrecedentChart.tsx:45`

**Hoje:** 'Hoje em velas até "agora"; depois, o leque do que aconteceu nos precedentes.' / 'cada precedente continua a partir do preço de agora' (linhas 45-61); toCandles inventa velas com gerador pseudoaleatório, inclusive 14 velas de 'pregão antes do evento' (linhas 20-43); legenda 'Hoje vs. precedentes (WIN, % desde o anúncio)' e marcador 'agora' (pt-BR.ts:188-189)

**O que fazer:** Tirar a série 'current', o marcador 'agora' e a sobreposição a partir do preço de hoje. Trocar por um gráfico só do passado: um ponto por caso (data, variação no pregão da reação), com mínimo, mediana e máximo marcados e uma faixa da taxa-base (dias sem o evento). Nunca gerar vela sintética. Legenda: 'Ibovespa no pregão seguinte a cada caso (fonte: B3)', sem WIN.

**Situação:** **Resolvido neste PR.** O gráfico mostra só o caminho de cada caso passado, sem vela de "hoje" e sem projeção.

### 3. [N3, M2] `src/services/agent/mockAgent.ts:57`

**Hoje:** { label: 'casos com queda na primeira hora', value: `${countBy(m, (x) => x < 0)} de ${m.length}`, direction: 'down' } (também linhas 83 'casos com alta do WDO em 1h', 108 'casos com queda em 24h', 130); HowItWorks.tsx:86 '10 de 14 casos com queda em 1h'; pt-BR.ts:179 'o Thoran mostra em quantos casos o ativo subiu ou caiu'; pt-BR.ts:214 'Quantas vezes subiu, quantas caiu'; History.tsx:33-51 mostra o 1º stat com seta como resumo de cada análise

**O que fazer:** Proibir no contrato e na interface o stat 'N de M com alta/queda' como destaque. Mostrar a distribuição inteira, sempre nesta ordem: N, mínimo, mediana, máximo, casos no sentido contrário e taxa-base. Exemplo: 'Nas 14 reuniões com surpresa, o Ibovespa variou de −2,1% a +1,4% no pregão seguinte, mediana −0,3%; em 4 andou no sentido contrário; em dias sem Copom a variação típica foi ±0,9%'. No Histórico, listar só pergunta, data e N, sem seta.

**Situação:** Pendente. Só aparece em modo mock (demonstração).

### 4. [N2, N3, D1] `src/services/agent/mockAgent.ts:53`

**Hoje:** 'Historicamente, nesses casos, o mini-índice tendeu a cair na primeira hora após o anúncio' (53); 'o dólar contra o real tendeu a subir na primeira hora' (79); 'o mini-dólar subiu na maior parte das vezes' (81); 'o BTC tendeu a cair no dia seguinte' (104); 'a queda no dia seguinte foi mais comum [...] a probabilidade aqui é menos concentrada' (106)

**O que fazer:** Reescrever o mock no formato do exemplo 1 da nota: '(avisos) Fato: nas [N] reuniões com surpresa, o Ibovespa variou de [mín] a [máx] no pregão seguinte, mediana [x]; em [k] andou no sentido contrário. Taxa-base: [y]. Interpretação: [...]. Limitação: amostra de [N]; rentabilidade passada não indica rentabilidade futura. Fontes: BCB, B3.' Apagar 'tendeu', 'mais comum', 'maior parte das vezes' e 'probabilidade'. Melhor ainda: o modo mock passar a usar as respostas reais da base.json do trade-agent.

**Situação:** Pendente. Só aparece em modo mock (demonstração).

### 5. [D3, D2] `src/i18n/pt-BR.ts:13`

**Hoje:** disclaimer: 'O Thoran não faz recomendação de investimento. Resultados passados não garantem resultados futuros. Operar no mercado envolve risco de perda.' (13-14; repetido em mockAgent.ts:9-10, agent-proxy/index.ts:11-12, home.footer pt-BR.ts:140; exibido por Disclaimer.tsx:10 e Chat.tsx:236)

**O que fazer:** Usar em todos os lugares o AVISO do trade-agent (trade-agent/supabase/functions/perguntar/agente/texto.ts:4): 'Sou uma IA e posso errar. Isto não é recomendação de investimento: a empresa não é analista credenciada nem consultora autorizada pela CVM. Rentabilidade passada não indica rentabilidade futura.' Pôr no topo de cada resposta do chat, não só no rodapé, e manter o rodapé.

**Situação:** **Resolvido neste PR.** O aviso padrão do site e o do proxy são o AVISO + FECHO do agente; o agente real já abre toda resposta com ele.

### 6. [M9] `src/i18n/pt-BR.ts:294`

**Hoje:** Pro: 'Para quem acompanha o mercado todo pregão.' (294); '150 créditos por mês (até 30 análises completas, uma por pregão com folga)' (296); unidade cobrada 'Análise completa de precedentes' 5 créditos (307); exemplos sobre WIN, WDO, PETR4 e BTC (pt-BR.ts:135-138, 253-255, 444-446)

**O que fazer:** Tirar 'todo pregão' e 'uma por pregão'. Tagline do Pro: 'Para quem quer estudar mais casos e mais eventos'. Trocar os exemplos de contrato (WIN, WDO, PETR4) por agregados históricos (Ibovespa, dólar, DI), seguindo a nota: 'quanto mais agregado e histórico, mais perto do item 8'. Levar o modelo de cobrança por consulta ao advogado antes de abrir a venda.

**Situação:** Pendente.

### 7. [M6, N2] `index.html:18`

**Hoje:** og:description 'Mais previsibilidade para operar: veja como o mercado costuma reagir a cada notícia' (18); description 'Saiba como o mercado costuma reagir a cada notícia antes de operar.' (7); brain.lead 'transforma o histórico em previsibilidade para a sua próxima operação' (pt-BR.ts:171, exibido em Brain.tsx:19); hero.lead 'te dá mais previsibilidade no mini-índice' (pt-BR.ts:44, hoje sem uso)

**O que fazer:** Trocar por: 'Veja o que já aconteceu no mercado em eventos parecidos, com fonte, amostra e os casos que foram para o outro lado.' Tirar 'antes de operar', 'próxima operação' e 'previsibilidade' de todo o site, da og:description e do hero.lead.

**Situação:** Pendente.

### 8. [M6, D6] `src/i18n/pt-BR.ts:4`

**Hoje:** 'Thoran · Veja o raio antes do trovão' (meta.title 4, footer.tagline 354; index.html:6 e 17; título de toda página em useTitle.ts:5; AuthShell.tsx:17-21; texto da imagem public/og.png)

**O que fazer:** Decisão de posicionamento dos fundadores, com o risco registrado: manter a marca e trocar a tagline por algo do passado. Exemplos: 'O que o mercado já fez, com fonte.' ou 'Memória de mercado, sem palpite.' Refazer a og.png.

**Situação:** Pendente.

### 9. [M6, D6] `src/i18n/pt-BR.ts:324`

**Hoje:** q: 'Preciso ser trader experiente?' a: 'Não. O Thoran foi pensado para quem está começando: toda análise vem com uma explicação em linguagem simples.'

**O que fazer:** Resposta nova: 'O Thoran explica em linguagem simples, mas não ensina a operar nem diz o que fazer. Mini-índice e mini-dólar são derivativos alavancados: a perda pode passar do que você depositou. Num estudo da FGV com quem começou no day trade de mini-índice, 97% dos que persistiram mais de 300 dias perderam dinheiro.'

**Situação:** Pendente.

### 10. [Termos de uso de API, CDC art. 37, N6] `supabase/functions/market-data/index.ts:17`

**Hoje:** fetch(`https://query1.finance.yahoo.com/v8/finance/chart/...`, { headers: { 'User-Agent': 'Mozilla/5.0' } }) (17-19); rótulo 'Ao vivo' (pt-BR.ts:245; Markets.tsx:29-36); fonte 'Cotações reais · Binance e Yahoo Finance · B3 e EUA podem ter atraso de até 15 min' (pt-BR.ts:246; Markets.tsx:112); README.md:194 'A API do Yahoo é não oficial: para uso comercial, troque'

**O que fazer:** Desligar a função market-data e a seção Mercados até haver fornecedor licenciado com contrato que permita exibir no site. Se voltar, não usar 'Ao vivo': escrever 'Fechamento de [data], fonte: [fornecedor licenciado]' e mostrar só o fechamento do dia anterior, sem velas intradiárias. Nunca falsificar o User-Agent.

**Situação:** **Em parte.** A Action deste PR não publica a market-data. A função e a seção Mercados continuam no código.

### 11. [M7, D8] `src/i18n/pt-BR.ts:208`

**Hoje:** 'Busca em 10 anos de B3, cripto e mercado internacional os eventos mais próximos do de hoje' (208); exemplos de payroll, Fed, ETF de bitcoin e S&P (121-128, 136-138, 254-255, 445-446); janelas '1h' e 'primeira hora' (mockAgent.ts:41, 53); FAQ 'De bases históricas de notícias e de preços de mercado' (344-345); brain.lead 'o Thoran percorre essas conexões, encontra os casos parecidos' (171)

**O que fazer:** Anunciar só o que a base tem e guardar os dados: 'As 86 reuniões do Copom desde 2016 comparadas com o Focus, as eleições de 2018, 2022 e 2026 e [N] eventos políticos e fiscais, com a reação do Ibovespa e do dólar no pregão seguinte. Fontes: BCB, B3, TSE.' Tirar payroll, Fed, ETF, S&P, cripto como cobertura de eventos, 'primeira hora' e 'percorre conexões' até a base ter esses dados.

**Situação:** Pendente.

### 12. [D1, D8] `src/services/agent/types.ts:24`

**Hoje:** interface AnalysisStat { label; value; direction: Direction } e AnalysisResponse { event, precedents{count, period, items}, stats, chart, explanation, disclaimer? } (24-47); página da análise com 'Métricas' primeiro e 'Por que isso importa' (Analysis.tsx:58-77; pt-BR.ts:543); tabela sem coluna de fonte (Analysis.tsx:87)

**O que fazer:** Mudar o contrato: tirar 'direction' dos stats e acrescentar sources[{nome,url,data}] por número, method{criterio,janela}, distribution{n,min,mediana,max,contrarios}, base_rate, limitations[] e interpretation. Na página: seções 'Fato', 'Interpretação' e 'Limitações' (no lugar de 'Por que isso importa'), uma coluna 'Fonte' na tabela, e 'Semelhança' trocada pelo critério em texto.

**Situação:** **Em parte.** Com o agente real, os stats vêm sem direção (setas neutras), o cartão traz a fonte, e relevância, semelhança e gráfico viraram opcionais. A distribuição completa, os casos contrários e as limitações estão no texto do agente, não em campos próprios.

### 13. [CDC arts. 31 e 46; LGPD arts. 9º e 41; D4; D5] `src/pages/legal/LegalPage.tsx:61`

**Hoje:** '[TEXTO JURÍDICO A REVISAR] Lorem ipsum dolor sit amet...' em todas as seções de Privacidade, Termos e Aviso de risco (52, 61-63; pt-BR.ts:15), enquanto o checkout Stripe e o cadastro estão ativos

**O que fazer:** Não ligar BILLING_MODE=live nem abrir cadastro sem os três textos finais revisados por advogado. O Aviso de risco tem de trazer, no mínimo: o texto de D4 (alavancagem, margem, ajuste diário, perda maior que o depositado, taxa-base FGV de 97%), o de D5 (cripto à vista em regra não é valor mobiliário, sem proteção da CVM, corretoras reguladas pelo Banco Central com autorização em curso até 30/10/2026) e o D3.

**Situação:** Pendente.

### 14. [D4, D5] `src/pages/app/Chat.tsx:207`

**Hoje:** Resposta do chat sobre mini-índice, mini-dólar ou bitcoin (sugestões em pt-BR.ts:135-138 e 444-446) sem nenhum alerta de derivativo ou de cripto; o único aviso é o Disclaimer genérico (Chat.tsx:236)

**O que fazer:** Quando a pergunta ou o mercado for B3/derivativo, mostrar acima da resposta o RISCO_DERIVATIVO do trade-agent (texto.ts:7): 'Em mini-índice, mini-dólar e DI futuro a posição é alavancada: a margem é só garantia, o ajuste diário debita ou credita a conta a cada pregão, e a perda pode passar do que você depositou.' Para cripto, o bloco equivalente de D5. Boa prática da nota: uma etapa curta de educação de risco antes do primeiro conteúdo de derivativos.

**Situação:** **Resolvido neste PR, pelo agente.** A resposta do agente real traz o alerta de derivativo (D4) quando a pergunta é de mini-índice, mini-dólar ou DI, e o de cripto (D5) quando é de cripto ou o seletor está em Cripto.

### 15. [D7, M10] `supabase/functions/agent-proxy/index.ts:121`

**Hoje:** if (kind === 'consumo_analise' && !gotAnalysis) { await refund(); push(sse('error', { code: 'offline', refunded: true })); } — e no front errText 'O Thoran está fora do ar agora' (Chat.tsx:121-122; pt-BR.ts:460); mock GENERIC com match /.*/ responde qualquer pergunta com análise de WIN (mockAgent.ts:115-133, 146-151)

**O que fazer:** Criar no contrato um tipo de resposta 'recusa' (e 'sem_repertorio'), de primeira classe: mostrar o texto RECUSA do trade-agent (texto.ts:5), não tratar como falha e não cobrar crédito, ou cobrar 1. No mock, pôr antes do GENERIC um detector dos 15 pedidos da bateria adversarial que devolva a recusa padrão.

**Situação:** **Resolvido neste PR.** Recusa e "sem caso parecido" chegam como resposta normal (texto, sem cartão) e a análise sem cartão cobra 1 crédito, como pergunta.

## Gravidade média

### 16. [M1, D6, N6] `src/i18n/pt-BR.ts:186`

**Hoje:** relevance: { baixa: 'Relevância baixa', media: 'Relevância média', atencao: 'Atenção' } (186); 'Evento detectado' (185) e data/hora de detecção (Analysis.tsx:47-53); mock com relevance 'atencao' para Copom e BTC (mockAgent.ts:39, 92); mockup 'Detectado às 18:32', 'Monitorando', 'Atenção 1', 'Thoran analisando… agora' (pt-BR.ts:66-83)

**O que fazer:** Remover o campo relevance do contrato e da interface, e trocar 'Evento detectado' por 'Evento consultado' com a data do evento passado, não a hora atual. Apagar as chaves do mockup.

**Situação:** **Em parte.** O selo de relevância some quando o agente não manda (o real nunca manda) e "Evento detectado" virou "Casos parecidos no repertório". O mock ainda manda relevância.

### 17. [N5] `src/i18n/pt-BR.ts:423`

**Hoje:** onboarding: 'Conta pra gente como você opera.' / 'Qual seu nível de experiência?' / 'Opero com alguma frequência.' / 'Opero há anos, todo dia.' (423-430; Onboarding.tsx:49-61; Account.tsx:50-59; coluna experience_level em init.sql:31 e 37); FAQ 'conte em duas perguntas como você opera' (349)

**O que fazer:** Remover a pergunta de nível e a coluna experience_level. Manter só a escolha de mercados, com o texto: 'Quais mercados você quer ver nos exemplos? Isso só muda as sugestões; a resposta é igual para qualquer pessoa.' Título: 'Antes de começar'. Tirar 'como você opera' do FAQ.

**Situação:** Pendente.

### 18. [N8] `src/components/landing/brainData.ts:60`

**Hoje:** hub 'Mercados de previsão': ['Polymarket', 'Kalshi', 'PredictIt', 'Metaculus', 'Manifold', 'Betfair Exchange', 'Good Judgment'] (60-66); 'Polymarket API', 'yfinance', 'TradingView' em Dados e ferramentas (49); contagem 'Mercados de previsão 7' exibida em Brain.tsx:36-38

**O que fazer:** Apagar o hub 'Mercados de previsão' e os nós 'Polymarket API', 'yfinance' e 'TradingView' antes de 25/10. No grafo, deixar só fontes que a base.json realmente cita (BCB, B3, IBGE, TSE, Focus, CVM), com a contagem real.

**Situação:** Pendente.

### 19. [M7; Código Civil art. 18; CDC art. 37] `src/components/landing/brainData.ts:33`

**Hoje:** hub 'Pessoas': ['Roberto Campos Neto', 'Gabriel Galípolo', 'Fernando Haddad', 'Jerome Powell', 'Luis Stuhlberger', 'Ray Dalio', ...] (33); hub 'Imprensa' com Bloomberg, Valor, Folha, Reuters, 'Bloomberg Terminal', 'Broadcast' (25); BrainGraph.tsx:62-70 cria 1,6 nó sem título por nó real 'para a densidade do vault'; legenda 'Amostra da base de conhecimento do Thoran' (pt-BR.ts:173)

**O que fazer:** Tirar o hub Pessoas e as marcas de imprensa que não são fonte citada na base. Remover a geração de nós sem título (BrainGraph.tsx:62-70). Na legenda, pôr o número verificável: '[N] fontes citadas no repertório, [M] eventos, 86 reuniões do Copom'.

**Situação:** Pendente.

### 20. [M6, N1, N2, D6] `src/i18n/pt-BR.ts:218`

**Hoje:** compare: eyebrow 'Grupo de sinais × Thoran', title 'Pare de operar no palpite.', linhas 'Transparência: Sem histórico de acertos', 'Ritmo: Contexto antes da decisão', 'Quem decide: Você' (218-231; Compare.tsx); how.title 'Da manchete à decisão em segundos.' (196); how.steps 'Você vê a tendência e decide.' (213)

**O que fazer:** Tirar a seção Compare ou trocá-la por 'O que o Thoran faz e o que não faz': faz repertório com fonte, amostra e casos contrários; não diz comprar, vender, quando, quanto, nem para onde vai. Título de Como funciona: 'Da pergunta ao caso histórico, com fonte.' Passo 3: 'Você vê todos os casos, inclusive os que foram para o outro lado.'

**Situação:** Pendente.

### 21. [M7, CDC art. 37] `src/i18n/pt-BR.ts:278`

**Hoje:** recommended: 'Mais escolhido' (selo no Pro em Pricing.tsx:68 e Plans.tsx:171)

**O que fazer:** Trocar por 'Mais créditos' ou tirar o selo.

**Situação:** Pendente.

### 22. [D6, M9] `src/i18n/pt-BR.ts:489`

**Hoje:** low: 'Restam {n} créditos. Faça uma recarga ou mude de plano para não parar no meio do pregão.' (exibido em Credits.tsx:34)

**O que fazer:** 'Restam {n} créditos. Você pode fazer uma recarga ou mudar de plano quando quiser.'

**Situação:** Pendente.

### 23. [M9, N6, N7, LGPD art. 9º] `src/services/marketService.ts:39`

**Hoje:** PETR4 e VALE3 com cotação e variação (39-40) na seção Mercados, com CTA 'Pergunte ao Thoran →' em cada cartão (Markets.tsx:72-81); fonte 'Binance' nomeada (pt-BR.ts:246); o navegador do visitante chama api.binance.com direto (marketService.ts:56-60)

**O que fazer:** Remover PETR4, VALE3 e os ativos de cripto da vitrine (ver o achado do market-data). Se a seção ficar, mostrar só índices agregados com fonte licenciada, buscados pelo servidor, e citar a fonte na política de privacidade.

**Situação:** Pendente.

### 24. [N2, M9 (Res. CVM 20, art. 1º)] `src/i18n/pt-BR.ts:151`

**Hoje:** 'Nova análise' (151), 'por análise completa' (279), 'Análise completa de precedentes' (307), botão 'Analisar' (491), 'Abrir análise completa' (464), rota /app/analise/:id (App.tsx:73)

**O que fazer:** Renomear a unidade para 'Consulta ao repertório' ou 'Estudo de caso'. O botão 'Analisar' vira 'Ver casos', 'Nova análise' vira 'Nova consulta', e a rota passa a /app/consulta/:id.

**Situação:** Pendente.

### 25. [CDC art. 49; Decreto 7.962/2013 art. 5º] `src/i18n/pt-BR.ts:333`

**Hoje:** FAQ 'Posso cancelar?' → 'Sim, a qualquer momento e sem fidelidade. O acesso continua até o fim do período que você já pagou.' (333); 'Cancele quando quiser. Sem fidelidade.' (313); cancelConfirm 'Você mantém o acesso até o fim do período pago.' (521); anual de R$ 299 pago à vista (329)

**O que fazer:** Acrescentar: 'Nos primeiros 7 dias depois de assinar ou comprar créditos, você pode desistir e recebe o valor de volta (CDC, art. 49). Depois disso, o acesso continua até o fim do período pago.' Implementar o reembolso no portal ou no suporte.

**Situação:** Pendente.

### 26. [CDC art. 46; D4 (boa prática); LGPD art. 9º] `src/pages/auth/AuthPages.tsx:150`

**Hoje:** Cadastro só com links soltos 'Termos de uso · Privacidade · Aviso de risco' acima do botão 'Criar conta' (150-162); o mesmo no modal da home (AuthGate.tsx:109-111), sem aceite nem ciência de risco

**O que fazer:** Pôr uma caixa de seleção obrigatória: 'Li e aceito os Termos de uso e o Aviso de risco. Entendo que o Thoran é uma IA que mostra casos passados, não faz recomendação, e que derivativos podem dar perda maior que o valor depositado.' Gravar a data do aceite e a versão dos termos no perfil.

**Situação:** Pendente.

### 27. [N9, LGPD arts. 9º, 11 e 15] `supabase/functions/agent-proxy/index.ts:80`

**Hoje:** await admin.from('analyses').upsert({ id, user_id, question: query, response }) (80); tabela analyses.question sem prazo (init.sql:76-82); política lista só 'e-mail, origem de acesso, data do consentimento' (LegalPage.tsx:12)

**O que fazer:** Antes de gravar a pergunta, mascarar valores em dinheiro e termos de voto ou partido, ou guardar só o hash e o roteamento. Definir prazo de guarda (ex.: 12 meses) e listar na política todos os dados realmente tratados, com base legal e operadores (Supabase, Stripe, Resend).

**Situação:** **Em parte.** O histórico guarda a pergunta sem o trecho de voto e sem valor em dinheiro (o agente manda a versão mascarada). Falta definir o prazo de guarda e escrever isso na política.

### 28. [M7, CDC art. 37] `supabase/functions/_shared/emailTemplate.ts:18`

**Hoje:** 'O Thoran cruza a notícia de hoje com 20 anos de casos parecidos e mostra como o mercado reagiu.'

**O que fazer:** 'Obrigado por entrar. O Thoran mostra o que aconteceu no mercado em eventos parecidos desde 2016, com fonte e amostra.' Incluir no rodapé o aviso D3 completo.

**Situação:** Pendente.

### 29. [D8, M7, CDC art. 37] `src/pages/app/Chat.tsx:207`

**Hoje:** Em modo mock, o texto da resposta ('Encontrei casos em que o Copom...') aparece sem marca de fictício; a etiqueta 'Exemplo ilustrativo' só vem no card (215), e na 'Pergunta rápida' não há card. AGENT_MODE e BILLING_MODE padrão 'mock' e independentes (env.ts:6-7)

**O que fazer:** Em modo mock, prefixar todo texto com 'Exemplo fictício: ' e mostrar o selo também nas respostas sem card. Impedir o build ou a inicialização com BILLING_MODE=live e AGENT_MODE=mock.

**Situação:** **Resolvido neste PR.** Em modo mock, toda resposta do chat mostra a etiqueta "Exemplo ilustrativo", não só o cartão.

### 30. [N3, N4, M6, M7] `src/i18n/pt-BR.ts:53`

**Hoje:** Cópia não exibida hoje, mas pronta no dicionário: mockup 'PETR4: alta em 7 de 10', 'WDO: alta em 15 de 22 casos', 'SPX: alta em 9 de 13 casos', 'o mini-índice caiu na primeira hora em 10 deles', 'Monitorando', 'Alertas' (53-95); stats '100% das análises mostram amostra e período' (99); problem 'você entra atrasado, sai no susto' (164); pillars 'Probabilidade: em quantos casos o mercado subiu, caiu' (238); finalCta 'Chega de operar no escuro. Saiba o que o histórico diz antes da sua próxima operação.' (264-266); hero.lead (44)

**O que fazer:** Apagar do pt-BR.ts as seções mockup, stats, problem, pillars e finalCta, e o hero.lead. Se a landing voltar, escrever do zero no formato da nota.

**Situação:** Pendente.

## Gravidade baixa

### 31. [D3, CDC art. 31] `src/i18n/pt-BR.ts:321`

**Hoje:** 'No Brasil, recomendação de investimento exige analista credenciado na CVM.' (321); footer.legal 'Não é consultoria, análise ou recomendação de investimento nos termos da Resolução CVM nº 20/2021' (360-361), não exibido (Footer.tsx:17 usa só home.footer)

**O que fazer:** FAQ: 'Não. Recomendação e análise de valores mobiliários exigem analista credenciado na APIMEC (Res. CVM 20); orientação individual exige consultor autorizado pela CVM (Res. CVM 19). O Thoran não é nenhum dos dois: é uma IA que mostra o que aconteceu em casos parecidos, e pode errar.' Exibir no Footer o texto legal corrigido.

**Situação:** Pendente.

### 32. [N7, M7, CDC art. 37] `src/i18n/pt-BR.ts:10`

**Hoje:** ticker: '$THRN' (10) e '$THRN' ao lado da marca em public/og.png

**O que fazer:** Tirar '$THRN' da og.png e do dicionário.

**Situação:** Pendente.

### 33. [LGPD art. 8º §4] `src/i18n/pt-BR.ts:105`

**Hoje:** consentPre: 'Concordo em receber comunicações do Thoran e li a política de privacidade' (105; uma só caixa em WaitlistForm.tsx:140-167)

**O que fazer:** 'Quero receber e-mails do Thoran sobre a abertura e novidades do produto. Posso sair quando quiser.' Mantém a caixa e põe abaixo, sem caixa: 'Veja como usamos seus dados na política de privacidade.'

**Situação:** Pendente.

### 34. [LGPD arts. 18 e 8º §5] `src/pages/app/Account.tsx:91`

**Hoje:** Tela Conta só com Salvar; não há 'Excluir conta' nem 'Baixar meus dados'; consentimento de cookies gravado sem opção de rever (analytics.ts:20-26; CookieBanner.tsx:10)

**O que fazer:** Na tela Conta, acrescentar 'Excluir minha conta e meus dados' e 'Baixar meus dados (JSON)'. No rodapé, pôr o link 'Preferências de cookies', que reabre o banner.

**Situação:** Pendente.
