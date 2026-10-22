// E-mail de confirmação da lista. Tokens do brand design: carbono, grafite, raio, texto.
// Tabelas + estilos inline para compatibilidade com clientes de e-mail.
const SYMBOL_URL = `${Deno.env.get('SITE_URL') ?? 'https://thoran.com.br'}/apple-touch-icon.png`;

export function waitlistEmail() {
  const subject = 'Você está na lista do Thoran';
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${subject}</title></head>
<body style="margin:0;background:#0B0D10;color:#EEF1F4;font-family:'Space Grotesk',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0D10"><tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
    <tr><td style="padding-bottom:32px">
      <img src="${SYMBOL_URL}" width="40" height="40" alt="" style="vertical-align:middle;border-radius:8px">
      <span style="vertical-align:middle;margin-left:10px;font-weight:600;letter-spacing:.08em;font-size:18px;color:#EEF1F4">THORAN</span>
    </td></tr>
    <tr><td style="font-family:'JetBrains Mono',Menlo,monospace;font-size:12px;letter-spacing:.14em;color:#7DD8FF;text-transform:uppercase;padding-bottom:16px">Lista de espera · confirmado</td></tr>
    <tr><td style="font-size:40px;line-height:1.05;font-weight:500;letter-spacing:-.02em;padding-bottom:20px">Você está na lista.</td></tr>
    <tr><td style="font-size:17px;line-height:1.6;color:#C8CFD7;padding-bottom:28px">
      Obrigado por entrar. O Thoran cruza a notícia de hoje com 20 anos de casos parecidos e mostra como o mercado reagiu.
      Assim que liberarmos os primeiros acessos, você recebe um e-mail aqui.
    </td></tr>
    <tr><td style="background:#14171C;border:1px solid #2E3740;border-radius:6px;padding:20px;font-size:15px;line-height:1.6;color:#C8CFD7">
      <span style="color:#7DD8FF">→</span> Veja o raio antes do trovão.
    </td></tr>
    <tr><td style="padding-top:32px;border-top:1px solid #2E3740;margin-top:32px;font-size:12px;line-height:1.6;color:#7A8797">
      <br>O Thoran não faz recomendação de investimento. Resultados passados não garantem resultados futuros. Operar no mercado envolve risco de perda.<br><br>
      Você recebeu este e-mail porque se inscreveu em thoran.com.br. Para sair da lista, responda a este e-mail.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
  const text = 'Você está na lista do Thoran. Avisaremos por e-mail assim que liberarmos os primeiros acessos.\n\nO Thoran não faz recomendação de investimento.';
  return { subject, html, text };
}
