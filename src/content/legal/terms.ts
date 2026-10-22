import { CREDIT_COST, LOW_BALANCE, PLANS, TOPUP, TRIAL_CREDITS, money } from '@/config/pricing';
import type { LegalDoc } from './types';

const b = PLANS.basic;
const p = PLANS.pro;

export const terms: LegalDoc = {
  title: 'Termos de Uso',
  summary: [
    'O Thoran é uma ferramenta de informação: mostra como o mercado reagiu a notícias parecidas no passado. Não é recomendação de investimento, e a decisão é sempre sua.',
    `Você paga pelo uso em créditos. Todo cadastro ganha ${TRIAL_CREDITS} créditos grátis, sem cartão.`,
    'Pode cancelar quando quiser, sem multa. O acesso continua até o fim do período pago.',
    'Na primeira contratação, você tem 7 dias para desistir e receber o valor de volta (direito de arrependimento).',
  ],
  sections: [
    {
      id: 'aceitacao',
      title: '1. Quem somos e aceitação',
      blocks: [
        'Estes Termos de Uso regulam o acesso e o uso do Thoran, disponível em {{site}} e nos aplicativos e serviços relacionados (a “Plataforma”), oferecido por {{empresa}}, inscrita no CNPJ sob o nº {{cnpj}}, com sede em {{endereco}} (“Thoran”, “nós”).',
        'Ao criar uma conta, contratar um plano ou usar a Plataforma, você (“Usuário”) declara que leu, entendeu e concorda com estes Termos, com a Política de Privacidade e com o Aviso de Risco, que fazem parte deste documento. Se não concordar, não use a Plataforma.',
      ],
    },
    {
      id: 'servico',
      title: '2. O que o Thoran faz (e o que não faz)',
      blocks: [
        'O Thoran é um agente de inteligência artificial que cruza notícias e eventos com uma base histórica de aproximadamente 10 anos (de 2016 em diante) e apresenta, em linguagem simples, como o mercado reagiu em casos parecidos: quantidade de precedentes, período analisado, movimento dos ativos e explicações de contexto.',
        'O Thoran NÃO:',
        {
          list: [
            'faz recomendação, indicação ou análise de valores mobiliários nos termos da Resolução CVM nº 20/2021, nem consultoria de valores mobiliários nos termos da Resolução CVM nº 19/2021;',
            'diz o que comprar, vender ou manter, nem indica momento de entrada ou saída;',
            'é corretora, distribuidora, banco, exchange ou gestora; não recebe, guarda nem movimenta dinheiro ou ativos do Usuário e não executa ordens;',
            'garante resultado, rentabilidade ou acerto de qualquer cenário.',
          ],
        },
        'As informações têm caráter exclusivamente informativo e educacional. Resultados passados não garantem resultados futuros. Antes de investir, avalie seu perfil e, se necessário, procure um profissional habilitado pela CVM.',
      ],
    },
    {
      id: 'conta',
      title: '3. Cadastro e conta',
      blocks: [
        {
          list: [
            'Para usar a Plataforma é preciso ter 18 anos ou mais e plena capacidade civil.',
            'O cadastro pode ser feito com e-mail e senha ou com uma conta Google. Você se compromete a informar dados verdadeiros e mantê-los atualizados.',
            'A conta é pessoal e intransferível. Você é responsável por manter sua senha em sigilo e por toda atividade feita na sua conta. Avise-nos imediatamente em {{contato}} se suspeitar de uso indevido.',
            'É permitida uma única conta gratuita por pessoa. Criar contas em série para obter créditos de teste repetidamente é proibido.',
          ],
        },
      ],
    },
    {
      id: 'creditos',
      title: '4. Créditos, teste grátis e consumo',
      blocks: [
        'O uso do agente é medido em créditos:',
        {
          list: [
            `Pergunta rápida no chat: ${CREDIT_COST.pergunta} crédito.`,
            `Análise completa de precedentes: ${CREDIT_COST.analise} créditos.`,
            `Teste grátis: ${TRIAL_CREDITS} créditos no primeiro cadastro, uma única vez, sem necessidade de cartão.`,
          ],
        },
        'O débito acontece antes da execução da análise. Se o agente falhar e não entregar a resposta, os créditos são estornados automaticamente.',
        'Quando o saldo não é suficiente, a ação é bloqueada e oferecemos recarga ou mudança de plano. O saldo nunca fica negativo.',
        `Avisamos no aplicativo e por e-mail quando restarem ${LOW_BALANCE} créditos.`,
        'Créditos não têm valor monetário, não rendem juros, não podem ser sacados, convertidos em dinheiro, vendidos nem transferidos para outra conta. Os valores de consumo de cada ação podem ser alterados conforme a seção 9.',
      ],
    },
    {
      id: 'planos',
      title: '5. Planos, preços e pagamento',
      blocks: [
        'Planos disponíveis na data destes Termos:',
        {
          list: [
            `${b.name}: ${money(b.monthlyCents)} por mês ou ${money(b.annualCents)} por ano, com ${b.creditsPerMonth} créditos por mês.`,
            `${p.name}: ${money(p.monthlyCents)} por mês ou ${money(p.annualCents)} por ano, com ${p.creditsPerMonth} créditos por mês.`,
            `Recarga avulsa: ${TOPUP.credits} créditos por ${money(TOPUP.cents)}, disponível para assinantes com plano ativo.`,
          ],
        },
        'Os preços incluem os tributos aplicáveis e são exibidos em reais (R$). Os valores vigentes são sempre os informados na página de planos no momento da contratação.',
        'Os pagamentos são processados pela Stripe, empresa especializada em pagamentos. O Thoran não tem acesso nem armazena os dados completos do seu cartão. Aceitamos cartão de crédito para planos mensais e anuais, e Pix para a recarga avulsa e para o plano anual pago à vista.',
        'O plano anual pago com Pix não renova automaticamente; avisamos antes do fim do período. Os demais planos renovam automaticamente ao fim de cada período, com cobrança no mesmo meio de pagamento, até que você cancele.',
        'A nota fiscal é emitida em nome do titular da conta, com os dados informados no cadastro.',
      ],
    },
    {
      id: 'renovacao',
      title: '6. Renovação e regras dos créditos de cada plano',
      blocks: [
        {
          list: [
            `${b.name}: a cada renovação mensal, os créditos do plano não usados expiram e você recebe ${b.creditsPerMonth} créditos novos.`,
            `${p.name}: a cada renovação mensal, os créditos do plano não usados acumulam por até 1 mês, com saldo máximo de 300 créditos do plano após a renovação, e você recebe ${p.creditsPerMonth} créditos novos.`,
            'Planos anuais recebem os créditos mês a mês, e não tudo de uma vez.',
            'Créditos de recarga não expiram enquanto sua assinatura estiver ativa. O consumo usa primeiro os créditos do plano e depois os de recarga.',
            'Os créditos do teste grátis seguem a mesma regra dos créditos de recarga.',
          ],
        },
      ],
    },
    {
      id: 'mudanca-plano',
      title: '7. Mudança de plano e cancelamento',
      blocks: [
        {
          list: [
            'Upgrade (por exemplo, do Basic para o Pro): vale na hora. Cobramos a diferença proporcional ao período restante e liberamos a diferença de créditos do mês.',
            'Downgrade: vale a partir da próxima renovação; até lá, você mantém o plano atual.',
            'Troca entre mensal e anual: aplicada conforme informado na tela no momento da troca, com cálculo proporcional quando cabível.',
            'Cancelamento: pode ser feito a qualquer momento na página de planos, sem multa nem fidelidade. O acesso e os créditos continuam disponíveis até o fim do período já pago; depois disso, todos os créditos restantes, inclusive os de recarga, expiram.',
          ],
        },
      ],
    },
    {
      id: 'arrependimento',
      title: '8. Direito de arrependimento e reembolsos',
      blocks: [
        'Conforme o art. 49 do Código de Defesa do Consumidor, você pode desistir da primeira contratação de um plano ou de uma recarga em até 7 (sete) dias corridos, contados da data do pagamento, solicitando pelo e-mail {{contato}}. Nesse caso, devolvemos integralmente o valor pago, pelo mesmo meio de pagamento, e os créditos correspondentes são cancelados.',
        'Fora do prazo de arrependimento, os valores pagos por períodos iniciados e por recargas não são reembolsados, exceto em caso de falha do serviço atribuível ao Thoran ou quando a lei determinar.',
        'Falha de pagamento: se uma cobrança recorrente não for aprovada, você terá 3 dias de carência, com aviso, para regularizar. Após esse prazo, a assinatura fica inadimplente e o consumo de créditos é bloqueado até a regularização.',
      ],
    },
    {
      id: 'alteracoes-precos',
      title: '9. Alteração de preços e de regras de consumo',
      blocks: [
        'Podemos alterar preços, quantidade de créditos por plano e custo das ações. Para assinantes ativos, avisaremos com pelo menos 30 dias de antecedência por e-mail e no aplicativo. As mudanças valem a partir da renovação seguinte ao fim desse prazo, e você pode cancelar antes, sem custo, se não concordar.',
      ],
    },
    {
      id: 'uso-aceitavel',
      title: '10. Uso permitido',
      blocks: [
        'Você se compromete a não:',
        {
          list: [
            'usar a Plataforma para fins ilegais, fraudulentos ou que violem direitos de terceiros;',
            'extrair dados em massa (scraping), usar robôs, scripts ou meios automatizados para acessar o agente, salvo integração autorizada por escrito;',
            'copiar, revender, sublicenciar ou redistribuir as análises como serviço próprio ou como recomendação de investimento a terceiros;',
            'tentar acessar áreas restritas, contornar limites de créditos, explorar falhas de segurança ou fazer engenharia reversa da Plataforma;',
            'compartilhar a conta ou criar contas falsas;',
            'enviar conteúdo ofensivo, discriminatório ou que tente manipular o funcionamento do agente.',
          ],
        },
        'O descumprimento pode levar à suspensão ou ao encerramento da conta, sem prejuízo das medidas legais cabíveis. Em caso de encerramento por violação, créditos não utilizados não são reembolsados.',
      ],
    },
    {
      id: 'ia',
      title: '11. Inteligência artificial, dados e limitações',
      blocks: [
        {
          list: [
            'As respostas são geradas por modelos de inteligência artificial e podem conter erros, imprecisões ou omissões. Confira as informações relevantes antes de tomar qualquer decisão.',
            'A base histórica tem cobertura limitada (aproximadamente 10 anos) e o número de casos parecidos pode ser pequeno. Toda análise mostra a amostra e o período usados, para você avaliar a solidez do resultado.',
            'Cotações e dados de mercado exibidos podem vir de fontes de terceiros e ter atraso. Não use a Plataforma como fonte de preços para operar.',
            'Exemplos marcados como “Exemplo ilustrativo, com dados fictícios” servem apenas para demonstrar o funcionamento.',
          ],
        },
      ],
    },
    {
      id: 'propriedade',
      title: '12. Propriedade intelectual',
      blocks: [
        'A Plataforma, a marca Thoran, o símbolo, o software, a base de conhecimento, os textos e o design pertencem ao Thoran ou a seus licenciantes e são protegidos por lei. Estes Termos concedem a você uma licença pessoal, limitada, não exclusiva e intransferível para uso da Plataforma.',
        'As perguntas que você envia continuam sendo suas. Você nos autoriza a processá-las para prestar o serviço e, de forma anonimizada e agregada, para melhorar a Plataforma, conforme a Política de Privacidade. As análises geradas podem ser usadas por você para fins pessoais.',
      ],
    },
    {
      id: 'responsabilidade',
      title: '13. Responsabilidades',
      blocks: [
        'Você é o único responsável por suas decisões de investimento e pelos resultados delas. O Thoran não responde por perdas, lucros cessantes ou danos decorrentes de decisões tomadas com base nas informações da Plataforma.',
        'Empregamos esforços razoáveis para manter a Plataforma disponível e segura, mas ela pode ficar indisponível por manutenção, falhas técnicas, de fornecedores ou de internet. Em caso de indisponibilidade que impeça o uso dos créditos, eles serão estornados quando debitados indevidamente.',
        'Nada nestes Termos exclui ou limita direitos garantidos ao consumidor pelo Código de Defesa do Consumidor.',
      ],
    },
    {
      id: 'encerramento',
      title: '14. Suspensão e encerramento',
      blocks: [
        'Você pode encerrar sua conta a qualquer momento, cancelando a assinatura e pedindo a exclusão em {{privacidade}}. Podemos suspender ou encerrar contas que violem estes Termos, que apresentem indícios de fraude ou por determinação legal, informando o motivo sempre que possível.',
      ],
    },
    {
      id: 'mudancas',
      title: '15. Alterações destes Termos',
      blocks: [
        'Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail e no aplicativo com antecedência razoável. A versão e a data de atualização aparecem no topo desta página. Continuar usando a Plataforma após a vigência das mudanças significa concordar com elas.',
      ],
    },
    {
      id: 'lei-foro',
      title: '16. Lei aplicável e foro',
      blocks: [
        'Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do consumidor para resolver qualquer controvérsia, nos termos do Código de Defesa do Consumidor.',
      ],
    },
    {
      id: 'contato',
      title: '17. Contato',
      blocks: ['Dúvidas, solicitações e reclamações: {{contato}}. Assuntos de dados pessoais: {{privacidade}}.'],
    },
  ],
};
