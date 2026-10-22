import type { LegalDoc } from './types';

export const privacy: LegalDoc = {
  title: 'Política de Privacidade e Cookies',
  summary: [
    'Coletamos só o necessário para sua conta funcionar, para cobrar e para responder às suas perguntas.',
    'Não vendemos seus dados. Compartilhamos apenas com fornecedores que fazem o serviço funcionar (hospedagem, banco de dados, pagamentos, e-mail e IA).',
    'Os dados do seu cartão ficam com a Stripe; nós não vemos nem guardamos o número.',
    'Você pode acessar, corrigir, exportar ou apagar seus dados quando quiser, pelo e-mail {{privacidade}}.',
  ],
  sections: [
    {
      id: 'controlador',
      title: '1. Quem é responsável pelos seus dados',
      blocks: [
        'Esta Política explica como o Thoran, oferecido por {{identificacao}}, com endereço em {{endereco}} (“Thoran”, “nós”), trata dados pessoais de quem usa o site {{site}} e a Plataforma Thoran, nos termos da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018, “LGPD”) e do Marco Civil da Internet (Lei nº 12.965/2014).',
        'O Thoran é o controlador dos dados pessoais descritos aqui. {{encarregado}}',
      ],
    },
    {
      id: 'dados',
      title: '2. Quais dados coletamos',
      blocks: [
        'Dados que você nos fornece:',
        {
          list: [
            'Cadastro: e-mail, senha (guardada apenas de forma criptografada, sem que tenhamos acesso a ela) e, se você entrar com Google, nome, e-mail e foto do perfil fornecidos pelo Google.',
            'Perfil: nível de experiência, mercados de interesse e idioma, se você informar.',
            'Uso do agente: perguntas e notícias que você envia, análises geradas, alertas criados, avaliações (“útil” / “não útil”) e comentários.',
            'Lista de espera e comunicações: e-mail e registro do seu consentimento, quando aplicável.',
            'Atendimento: o conteúdo das mensagens que você nos envia.',
          ],
        },
        'Dados de pagamento:',
        {
          list: [
            'Os dados do cartão e do Pix são coletados e processados diretamente pela Stripe. Recebemos apenas o identificador do cliente, o status da assinatura, os valores, as datas e os últimos dígitos e a bandeira do cartão, quando informados pela Stripe.',
            'Histórico de assinatura e de créditos: plano, ciclo, renovações, recargas, consumo e estornos.',
          ],
        },
        'Dados coletados automaticamente:',
        {
          list: [
            'Registros de acesso (data, hora e endereço IP), mantidos conforme o Marco Civil da Internet.',
            'Endereço IP transformado em código irreversível (hash), usado apenas para limitar tentativas abusivas no formulário de cadastro e na lista de espera.',
            'Origem do acesso (parâmetros UTM e página de referência), quando você chega por um link de campanha.',
            'Informações técnicas do navegador e do dispositivo, e eventos de uso do site (por exemplo, visualizações e cliques em botões), conforme a seção 9.',
          ],
        },
        'Não coletamos dados pessoais sensíveis (como origem racial, saúde, religião ou biometria) e pedimos que você não os inclua nas perguntas.',
      ],
    },
    {
      id: 'finalidades',
      title: '3. Para que usamos e com qual base legal',
      blocks: [
        {
          list: [
            'Criar e manter sua conta, autenticar seu acesso e responder às suas perguntas — execução de contrato (art. 7º, V, da LGPD).',
            'Processar pagamentos, controlar créditos, emitir notas fiscais e cumprir obrigações fiscais e contábeis — execução de contrato e cumprimento de obrigação legal (art. 7º, II e V).',
            'Enviar e-mails transacionais (confirmação de cadastro, recuperação de senha, aviso de saldo baixo, falha de pagamento, mudanças nos termos) — execução de contrato.',
            'Prevenir fraudes e abusos, proteger a segurança da Plataforma e manter registros de acesso — legítimo interesse e cumprimento de obrigação legal (art. 7º, II e IX; art. 15 do Marco Civil).',
            'Medir o uso do site e melhorar o produto, inclusive a qualidade das respostas do agente, com dados agregados ou anonimizados sempre que possível — legítimo interesse (art. 7º, IX).',
            'Enviar novidades e comunicações de marketing — consentimento (art. 7º, I), que você pode retirar a qualquer momento.',
            'Exercer direitos em processos judiciais, administrativos ou arbitrais — exercício regular de direitos (art. 7º, VI).',
          ],
        },
      ],
    },
    {
      id: 'ia',
      title: '4. Inteligência artificial e suas perguntas',
      blocks: [
        'Para gerar as respostas, suas perguntas são processadas por modelos de inteligência artificial, que podem ser operados por fornecedores especializados contratados pelo Thoran. Enviamos a esses fornecedores apenas o necessário para gerar a resposta (o texto da pergunta e parâmetros como mercado e idioma), sem seu nome ou e-mail.',
        'Não usamos suas perguntas para identificar você perante terceiros, nem para decisões automatizadas que produzam efeitos jurídicos sobre você. Podemos usar perguntas e avaliações, de forma anonimizada e agregada, para melhorar o Thoran.',
      ],
    },
    {
      id: 'compartilhamento',
      title: '5. Com quem compartilhamos',
      blocks: [
        'Não vendemos nem alugamos dados pessoais. Compartilhamos apenas com operadores que prestam serviços ao Thoran, sob contrato e com obrigação de confidencialidade e segurança:',
        {
          list: [
            'Supabase — banco de dados, autenticação e funções do servidor.',
            'Vercel — hospedagem do site.',
            'Stripe — processamento de pagamentos com cartão e Pix.',
            'Resend — envio de e-mails transacionais.',
            'Google — login com conta Google, quando você escolhe essa opção.',
            'Fornecedores de modelos de inteligência artificial — processamento das perguntas, conforme a seção 4.',
            'Emissor de notas fiscais e contabilidade — para cumprimento de obrigações fiscais.',
          ],
        },
        'Também podemos compartilhar dados quando exigido por lei, por ordem judicial ou por autoridade competente, ou em caso de reorganização societária, mantendo as proteções desta Política.',
      ],
    },
    {
      id: 'transferencia',
      title: '6. Transferência internacional',
      blocks: [
        'Alguns dos fornecedores acima podem armazenar ou processar dados em servidores fora do Brasil, como nos Estados Unidos. Nesses casos, a transferência ocorre com base no art. 33 da LGPD, mediante cláusulas contratuais e garantias de proteção compatíveis com a lei brasileira, e apenas para as finalidades descritas nesta Política.',
      ],
    },
    {
      id: 'retencao',
      title: '7. Por quanto tempo guardamos',
      blocks: [
        {
          list: [
            'Dados de conta, perguntas, análises e alertas: enquanto sua conta estiver ativa. Após o pedido de exclusão, apagamos ou anonimizamos em até 30 dias, salvo o que precisar ser mantido pelos motivos abaixo.',
            'Registros de pagamentos, notas fiscais e histórico de créditos: pelo prazo exigido pela legislação fiscal e tributária (em regra, 5 anos).',
            'Registros de acesso (IP, data e hora): 6 meses, conforme o art. 15 do Marco Civil da Internet.',
            'Lista de espera e comunicações de marketing: até você retirar o consentimento ou pedir a exclusão.',
            'Dados necessários para exercício de direitos em processos: pelo prazo prescricional aplicável.',
          ],
        },
      ],
    },
    {
      id: 'direitos',
      title: '8. Seus direitos',
      blocks: [
        'Nos termos do art. 18 da LGPD, você pode, a qualquer momento:',
        {
          list: [
            'confirmar se tratamos seus dados e acessá-los;',
            'corrigir dados incompletos, inexatos ou desatualizados;',
            'pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;',
            'pedir a portabilidade dos dados a outro fornecedor;',
            'pedir a eliminação dos dados tratados com base no consentimento e revogar o consentimento;',
            'saber com quem compartilhamos seus dados;',
            'opor-se a tratamentos baseados em legítimo interesse, quando cabível.',
          ],
        },
        'Para exercer qualquer direito, escreva para {{privacidade}}. Responderemos em até 15 dias. Para sua segurança, podemos pedir a confirmação da sua identidade. Você também pode corrigir parte dos dados diretamente na página “Conta” e cancelar comunicações de marketing pelo link presente nos e-mails.',
        'Se entender que seus direitos não foram atendidos, você pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).',
      ],
    },
    {
      id: 'cookies',
      title: '9. Cookies e tecnologias semelhantes',
      blocks: [
        'Usamos cookies e armazenamento local do navegador (localStorage e sessionStorage) para:',
        {
          list: [
            'Necessários: manter você conectado, guardar a pergunta feita antes do cadastro, lembrar o consentimento de cookies e proteger contra abusos. Sem eles a Plataforma não funciona; por isso não dependem de consentimento.',
            'Medição: registrar eventos de uso (como visualização da página, envio do formulário e cliques em botões) para entender e melhorar o site.',
            'Marketing: pixels de anúncios, quando houver. Só são ativados depois do seu consentimento no aviso de cookies, e você pode recusar com a mesma facilidade.',
          ],
        },
        'Você pode apagar ou bloquear cookies nas configurações do seu navegador. Bloquear os necessários pode impedir o login.',
      ],
    },
    {
      id: 'seguranca',
      title: '10. Segurança',
      blocks: [
        'Adotamos medidas técnicas e administrativas para proteger os dados, como conexão criptografada (HTTPS), senhas armazenadas com criptografia, controle de acesso por usuário no banco de dados, segredos de sistemas mantidos fora do código do site e registros de auditoria das chamadas ao agente e dos pagamentos. Nenhum sistema é totalmente imune a falhas; em caso de incidente de segurança que possa gerar risco relevante, comunicaremos os titulares afetados e a ANPD, conforme a lei.',
      ],
    },
    {
      id: 'menores',
      title: '11. Menores de idade',
      blocks: [
        'A Plataforma é destinada a maiores de 18 anos. Não coletamos intencionalmente dados de crianças ou adolescentes. Se identificarmos uma conta de menor, ela será encerrada e os dados excluídos.',
      ],
    },
    {
      id: 'alteracoes',
      title: '12. Alterações desta Política',
      blocks: [
        'Podemos atualizar esta Política. Mudanças relevantes serão comunicadas por e-mail ou no aplicativo. A versão e a data da última atualização aparecem no topo desta página.',
      ],
    },
    {
      id: 'contato',
      title: '13. Contato',
      blocks: ['{{encarregado}} Demais assuntos: {{contato}}. Endereço: {{endereco}}.'],
    },
  ],
};
