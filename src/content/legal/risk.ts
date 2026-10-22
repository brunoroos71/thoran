import type { LegalDoc } from './types';

export const risk: LegalDoc = {
  title: 'Aviso de Risco',
  summary: [
    'O Thoran não faz recomendação de investimento. Resultados passados não garantem resultados futuros. Operar no mercado envolve risco de perda.',
    'O Thoran mostra o que aconteceu em casos parecidos. Isso é contexto, não previsão: o mercado pode reagir de forma diferente desta vez.',
    'Mini-índice, mini-dólar e criptoativos são muito voláteis e podem gerar perdas rápidas, inclusive maiores que o valor investido.',
  ],
  sections: [
    {
      id: 'natureza',
      title: '1. O Thoran não é recomendação de investimento',
      blocks: [
        'O Thoran, mantido por {{empresa}}, é uma ferramenta de informação e educação. As análises mostram dados históricos e estatísticas descritivas sobre como ativos se comportaram após eventos parecidos com o que você consultou.',
        'Nenhum conteúdo da Plataforma constitui recomendação, oferta, solicitação, análise de valores mobiliários (Resolução CVM nº 20/2021) ou consultoria de valores mobiliários (Resolução CVM nº 19/2021). O Thoran não avalia seu perfil de investidor (suitability), sua situação financeira nem seus objetivos.',
        'Expressões como “historicamente”, “nos casos parecidos” e “a probabilidade indica” descrevem o passado. Elas não indicam o que você deve fazer.',
      ],
    },
    {
      id: 'passado',
      title: '2. Resultados passados não garantem resultados futuros',
      blocks: [
        'O comportamento do mercado em casos anteriores não se repete necessariamente. Entre os motivos:',
        {
          list: [
            'Amostra pequena: muitos eventos têm poucos precedentes (por exemplo, 8 ou 14 casos), e estatísticas com poucos casos podem enganar.',
            'Mudança de contexto: juros, inflação, política, regulação e tecnologia mudam ao longo do tempo, e um mesmo tipo de notícia pode ter efeito diferente em outro cenário.',
            'Semelhança imperfeita: dois eventos nunca são idênticos; o grau de semelhança é uma estimativa do modelo.',
            'Outros fatores: no mesmo dia podem acontecer outras notícias que pesam mais do que o evento analisado.',
            'Período limitado: a base histórica cobre aproximadamente 10 anos (de 2016 em diante) e pode não incluir situações extremas que só aconteceram antes disso.',
          ],
        },
        'Por isso, toda análise mostra o número de casos e o período usados. Avalie esses números antes de dar peso a qualquer resultado.',
      ],
    },
    {
      id: 'mercados',
      title: '3. Riscos dos mercados cobertos',
      blocks: [
        'Derivativos da B3 (mini-índice WIN, mini-dólar WDO e outros):',
        {
          list: [
            'operam com alavancagem: pequenas variações de preço geram ganhos ou perdas grandes em relação à margem depositada;',
            'exigem margem de garantia e ajustes diários; a corretora pode zerar posições automaticamente se a margem for insuficiente;',
            'as perdas podem superar o valor depositado, deixando o investidor devedor da diferença;',
            'operações de curtíssimo prazo (day trade) são especialmente arriscadas e, segundo estudos sobre o mercado brasileiro, a maioria das pessoas físicas que persiste nelas tem prejuízo.',
          ],
        },
        'Ações e índices: preços variam com resultados das empresas, notícias, fluxo de investidores e eventos macroeconômicos; é possível perder parte ou todo o capital investido.',
        'Criptoativos (bitcoin, ethereum e outros): volatilidade muito alta, negociação 24 horas, menor proteção regulatória (Lei nº 14.478/2022 e regulação em evolução), riscos de custódia, de fraude e de falhas de plataformas e exchanges.',
        'Mercado internacional e câmbio: além do risco do ativo, há variação do dólar e de outras moedas, diferenças de horário e de regras entre países.',
        'Liquidez: em momentos de estresse pode não haver comprador ou vendedor ao preço esperado, gerando derrapagem (slippage) ou impossibilidade de sair da posição.',
      ],
    },
    {
      id: 'tecnologia',
      title: '4. Riscos da tecnologia e dos dados',
      blocks: [
        {
          list: [
            'Inteligência artificial pode errar: as respostas podem conter imprecisões, interpretações equivocadas da notícia ou omissões.',
            'Dados de terceiros: cotações e bases históricas vêm de fontes externas e podem ter atraso, lacunas ou erros. Não use o Thoran como fonte de preços para enviar ordens.',
            'Disponibilidade: a Plataforma pode ficar fora do ar ou lenta em momentos de alta demanda, inclusive durante eventos relevantes do mercado.',
            'Exemplos ilustrativos: conteúdos marcados como “Exemplo ilustrativo, com dados fictícios” não representam dados reais.',
          ],
        },
      ],
    },
    {
      id: 'responsabilidade',
      title: '5. A decisão é sua',
      blocks: [
        'Toda decisão de investir, comprar, vender ou manter ativos é exclusivamente sua, assim como os resultados dessa decisão. Invista apenas recursos que você pode perder sem comprometer sua vida financeira, use ferramentas de controle de risco (como stop) e conheça bem o produto antes de operar.',
        'Se precisar de orientação personalizada, procure um profissional habilitado: analista de valores mobiliários credenciado (CNPI), consultor de valores mobiliários autorizado pela CVM ou assessor de investimento vinculado a uma instituição autorizada. Você pode consultar se um profissional é habilitado no site da CVM.',
      ],
    },
    {
      id: 'independencia',
      title: '6. Independência',
      blocks: [
        'O Thoran é remunerado apenas pelas assinaturas e recargas pagas pelos usuários. Não recebe comissão de corretoras, emissores de ativos ou exchanges pelas análises exibidas e não tem posição a defender em nenhum ativo analisado.',
      ],
    },
    {
      id: 'contato',
      title: '7. Dúvidas',
      blocks: ['Em caso de dúvida sobre este aviso, escreva para {{contato}}.'],
    },
  ],
};
