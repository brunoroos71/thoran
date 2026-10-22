# Thoran · site

Landing + lista de espera (fase 1) e área do agente pronta com dados simulados (fase 2).
React 18 + TypeScript + Vite + Tailwind · Supabase (Postgres, Auth, Edge Functions).

## Como o site funciona

- **`/` é o produto:** uma caixa de mensagem, como ChatGPT/Claude. O visitante digita, e no envio aparece o cadastro (Google ou e-mail). A pergunta fica guardada e é respondida assim que a conta existe (15 créditos grátis). Quando os créditos acabam, o modal oferece recarga ou plano.
- **`/app`:** o chat logado, com barra lateral (Nova análise, Recentes, Alertas, Planos, saldo e upgrade).
- **`/planos`:** preços e FAQ. **`/sobre`:** como funciona, o cérebro, o comparativo e as cotações, para quem quer entender antes.
- Para menos atrito, desative "Confirm email" em Supabase › Authentication › Providers › Email; se mantiver, a pergunta continua guardada até a pessoa confirmar e entrar.

## Rodar

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:5173  (produto no ar: cadastro e /app abertos)
npm run dev:waitlist   # http://localhost:5174  (WAITLIST_MODE=true, só lista de espera)
npm run build        # gera dist/ (site estático; publique em Vercel, Netlify, Cloudflare Pages…)
```

Sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` o site roda em **modo demonstração**: a lista de
espera, o login, o histórico e o admin são simulados no navegador (localStorage). Serve para revisar
design e fluxos; para publicar, configure o Supabase.

> Hospedagem: é uma SPA. Configure o fallback de rotas para `index.html` (ex.: `_redirects` com `/* /index.html 200`).

## Variáveis de ambiente

| Variável | Onde | Para quê |
|---|---|---|
| `WAITLIST_MODE` | front | `true`: só landing + lista. `false`: CTAs viram "Criar conta" e `/app` é liberado |
| `AGENT_MODE` | front | `mock`: agente simulado no navegador. `live`: chama `/agent-proxy` |
| `BILLING_MODE` | front | `mock`: assinatura e créditos simulados no navegador. `live`: Supabase + Edge Function `/billing` |
| `BILLING_GATEWAY` | Edge Function | `stripe` ou `mock`. Sem ele, a cobrança fica desligada (o `mock` aprova tudo de graça: só em teste) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Edge Function | chaves do Stripe (nunca no front) |
| `CRON_SECRET` | Edge Function | protege a rotina diária `billing-cron` (sem ele, a rotina recusa toda chamada) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | front | projeto Supabase (chaves públicas) |
| `VITE_ANALYTICS_PIXEL_ID` | front | se preenchido, o banner de cookies LGPD aparece e os eventos só disparam com consentimento |
| `VITE_SITE_URL` | front | URL pública |
| `RESEND_API_KEY`, `EMAIL_FROM` | Edge Function | e-mail de confirmação da lista |
| `IP_SALT` | Edge Function | sal do hash de IP (limite anti-spam) |
| `SITE_URL`, `SITE_ORIGIN` | Edge Function | links no e-mail e CORS |
| `AGENT_API_URL`, `AGENT_API_KEY` | Edge Function | API real do agente (**nunca** no front) |

As flags são lidas no build (Vite). Mudou a flag → gere o build de novo.

## Colocar no ar (checklist)

**Contas que você precisa criar** (são suas; o script não cria conta nenhuma):

| Serviço | Para quê | Custo inicial |
|---|---|---|
| [Supabase](https://supabase.com) | banco, login, Edge Functions | grátis até crescer |
| [Stripe](https://stripe.com/br) | cartão e Pix | por transação |
| [Resend](https://resend.com) | e-mails (confirmação, saldo baixo) | grátis até 3 mil/mês |
| [Vercel](https://vercel.com) | hospedagem do site | grátis |
| Domínio (ex.: Registro.br) | thoran.com.br | anual |

**Atalho (recomendado):** depois de criar as contas na Stripe e no Supabase, com a chave `sk_test_` colada em `.env.production.local` e `npx supabase login` feito, rode:
```bash
bash scripts/setup-backend.sh
```
Ele cria o projeto no Supabase (região São Paulo), busca as chaves, aplica o banco e a configuração de login (sem confirmação de e-mail, Google desligado), cria preços e o webhook na Stripe, publica as funções e o site com `BILLING_MODE=live`. Pode rodar de novo quantas vezes precisar.

**Passo a passo manual**
1. **Supabase:** crie o projeto (região São Paulo) e copie `Project ref`, `URL`, `anon key` e `service_role key` (Settings › API).
2. **Stripe (modo teste):** ative cartão e Pix. Em Developers › Webhooks, crie o endpoint
   `https://<project-ref>.supabase.co/functions/v1/billing-webhook` com os 7 eventos listados em *Stripe: passo a passo* e copie o `whsec_…`.
3. **Resend:** crie a API key e verifique o domínio do remetente (registros DNS).
4. **Preencha** `.env.production.local` a partir de `.env.production.example`.
5. **Rode** (com `vercel login` e `npx supabase login` feitos por você):
   ```bash
   bash scripts/go-live.sh
   ```
   O script aplica as migrações, configura os segredos, publica as 6 Edge Functions, cria os preços no Stripe e publica o site na Vercel.
6. **Ajustes manuais finais:**
   - Supabase › Authentication › URL Configuration: Site URL = seu domínio; Redirect URLs = `/app`, `/app/onboarding`, `/nova-senha`.
   - Supabase › Authentication › Providers › Google: client ID/secret do Google Cloud (OAuth consent screen).
   - Supabase › Authentication › Email Templates: traduza os modelos para português.
   - Agende a rotina diária no SQL Editor (extensões `pg_cron` e `pg_net` ligadas):
     ```sql
     select cron.schedule('thoran-billing', '0 6 * * *', $$
       select net.http_post(
         url := 'https://<project-ref>.supabase.co/functions/v1/billing-cron',
         headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
       ) $$);
     ```
   - Vire admin: `update profiles set is_admin = true where id = (select id from auth.users where email = 'voce@…');`
   - Vercel › Domains: aponte o domínio.
7. **Teste ponta a ponta** com cartão `4242 4242 4242 4242` e um Pix de teste. Quando estiver tudo certo, troque as chaves do Stripe para as de produção e rode o script de novo.
8. **Agente real:** o site já sobe como produto no ar (`WAITLIST_MODE=false`). Para ligar o agente, veja *Ligar o agente real* e troque `AGENT_MODE=live`. Para voltar ao modo lista de espera, use `WAITLIST_MODE=true`.

## Supabase

```bash
supabase link --project-ref <ref>
supabase db push                                   # aplica supabase/migrations
supabase secrets set --env-file supabase/functions/.env
supabase functions deploy waitlist-join admin-waitlist agent-proxy billing billing-webhook billing-cron
```

- **Publicação automática:** `.github/workflows/supabase.yml` roda `db push` e publica as funções a cada merge na
  `main` que mexa em `supabase/`. Precisa do segredo `SUPABASE_ACCESS_TOKEN` no GitHub (instruções no topo do arquivo).
  Migração já aplicada não roda de novo: para mudar o banco, crie um arquivo novo em vez de editar um antigo.
- **Permissões:** toda tabela nova precisa de `grant` explícito para `authenticated`/`anon`, e toda função
  `security definer` precisa de `revoke execute ... from public` (só tirar de `anon` e `authenticated` não basta).
  Modelo em `migrations/20261025000000_agente_real.sql`.
- **Login nas funções:** o projeto assina os logins com as chaves novas (ES256). As funções com login ficam com
  `verify_jwt = false` e conferem o token dentro (`_shared/supabase.ts › userFromRequest`).
- **market-data** não é publicada: busca cotação sem licença (auditoria legal, item 10).

- **Admin:** depois de criar sua conta, rode no SQL editor
  `update profiles set is_admin = true where id = (select id from auth.users where email = 'voce@…');`
  e acesse `/admin/lista` (login em `/entrar`, que existe mesmo com `WAITLIST_MODE=true`).
- **Google:** ative o provedor em Auth › Providers e adicione as URLs de redirect (`/app`, `/app/onboarding`, `/nova-senha`).
- **Segurança:** `waitlist` e `rate_limits` têm RLS sem políticas: só as Edge Functions (service role) escrevem.
  O front nunca grava direto na lista. Usuário não consegue mudar `plan` nem `is_admin` (trigger).

## Estrutura

```
src/
  components/ui/       espelho do design system: Logo, Button, Field, Badge, Move, PrecedentCard, PrecedentChart, StatList, Disclaimer
  components/landing/  seções da landing
  components/layout/   Header, Footer, CookieBanner
  components/app/      AppLayout, Feedback, RequireAuth
  pages/               Landing, Thanks, legal/, admin/, auth/, app/
  services/agent/      types.ts (contrato), mockAgent.ts, liveAgent.ts, index.ts (seleção por AGENT_MODE)
  services/            waitlist, auth, history, feedback, profile, alerts, admin
  i18n/                pt-BR.ts (todas as strings), en-US.ts (fallback para pt-BR)
supabase/
  migrations/          schema completo (waitlist, profiles, analyses, feedback, alerts, agent_calls, créditos, auditoria_agente)
  functions/           waitlist-join, admin-waitlist, agent-proxy, _shared/
```

## Ligar o agente real

O agente roda no mesmo projeto Supabase (Thoran), na função `analyze`. Ela vem do repositório **trade-agent** e é
publicada de lá, não daqui:

```
chat → /agent-proxy (este repo: login, créditos, histórico) → /analyze (trade-agent: resposta montada da base, com fonte em cada número)
```

1. Segredos das funções (uma vez, em Supabase › Edge Functions › Secrets, ou `supabase secrets set`):
   - `AGENT_API_URL=https://<project-ref>.supabase.co/functions/v1`
   - `AGENT_API_KEY=` a mesma chave que a `analyze` tem. Gere com `openssl rand -hex 32` e não cole em chat.
2. `AGENT_MODE=live` no front.

O que a `analyze` devolve (contrato em `src/services/agent/types.ts`): JSON com `explanation` (texto completo, em
Markdown simples), `short` (versão curta de 3 linhas, a que o chat mostra) e `disclaimer`. Quando há casos parecidos no
repertório, vem também o cartão: `precedents` (cada caso, com `unit` `%` ou `p.b.`), `stats` (sempre
`direction: 'neutral'`), `chart` (só o passado: `current` vazio) e `source`. Não manda `relevance` nem `similarity`.

O `/agent-proxy`:
- confere o login e debita antes (1 crédito na pergunta rápida, 5 na análise); se o agente falhar, estorna;
- análise sem caso parecido (recusa ou tema fora do repertório) não tem cartão: devolve os 5 e cobra 1;
- grava `analyses` (a pergunta vai sem o trecho de voto e sem valor em dinheiro) e `agent_calls`; a `analyze` grava
  `auditoria_agente`;
- manda ao chat a versão curta e o cartão; a página da análise mostra o texto completo.

O que o site pode e não pode dizer sobre mercado: `docs/auditoria-legal.md`.

## Planos e créditos

| Plano | Mensal | Anual | Créditos/mês |
|---|---|---|---|
| Basic | R$ 57,90 | R$ 579 | 80 |
| Pro | R$ 97,90 | R$ 979 | 150 (acumula até 300) |

Recarga: 50 créditos por R$ 19,90 · teste grátis: 15 créditos · pergunta rápida = 1 · análise completa = 5.
Valores ficam nas tabelas `plans` e `credit_config` (mudam sem deploy); `src/config/pricing.ts` é só o espelho para a landing.

- **Saldo = soma de `credit_ledger`.** Não existe campo de saldo. Cada lançamento tem um balde: `plano` (expira na renovação conforme o plano) ou `recarga` (não expira com a assinatura ativa; o teste grátis também entra aqui).
- **Débito no servidor:** o `/agent-proxy` chama `consume_credits` (atômico, trava a assinatura, nunca deixa negativo) **antes** do agente e `refund_credits` se o agente falhar. Saldo insuficiente → HTTP 402 → modal de recarga/upgrade no app.
- **Renovação:** `grant_monthly_credits` (idempotente pela referência do pagamento). Basic zera a sobra do plano; Pro mantém até 300. Anual recebe mês a mês pelo `billing-cron`.
- **Gateway:** Stripe (`_shared/billing/stripe.ts`), atrás da interface `gateway.ts`. `BILLING_GATEWAY=mock` aprova tudo na hora (staging sem chaves). Eventos do Stripe são traduzidos em `stripe-map.ts` e aplicados por `handlers.ts`.
- **Falha de pagamento:** `grace_until` = +3 dias com aviso; o cron marca `inadimplente` e o consumo bloqueia.
- **Nota fiscal:** cada cobrança cria uma linha em `invoices` (`pendente_emissao`). [EMISSOR DE NOTA A DEFINIR] em `_shared/billing/invoice.ts`.
- **Rotina diária:** agende `billing-cron` com `Authorization: Bearer $CRON_SECRET` (pg_cron ou Scheduled Functions).
- **Limitação conhecida:** com `AGENT_MODE=mock` e `BILLING_MODE=live`, o chat não debita (o agente simulado não passa pelo proxy).

## Stripe: passo a passo

1. **Conta:** Stripe Brasil com cartão e **Pix** ativados (Settings › Payment methods). Comece em modo teste (`sk_test_…`).
2. **Preços:** crie produtos e preços a partir da tabela `plans`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_… SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/stripe-setup.mjs
   ```
   Cria `thoran_basic` e `thoran_pro`, com preços mensal e anual e `lookup_key` `thoran_<plano>_<ciclo>`. Mudou um preço no banco? Rode de novo: o lookup_key passa para o preço novo, sem deploy. A recarga usa o valor de `credit_config.topup_cents`.
3. **Webhook:** em Developers › Webhooks, aponte para `https://<projeto>.supabase.co/functions/v1/billing-webhook` com os eventos:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   Copie o signing secret (`whsec_…`).
4. **Portal do cliente:** em Settings › Billing › Customer portal, ative a troca de cartão e o histórico de faturas. Deixe **desligadas** as opções de trocar e cancelar plano: isso é feito no app, para as regras de créditos valerem.
5. **Segredos:**
   ```bash
   supabase secrets set BILLING_GATEWAY=stripe STRIPE_SECRET_KEY=sk_test_… STRIPE_WEBHOOK_SECRET=whsec_… SITE_URL=https://thoran.com.br
   ```
6. **Front:** `BILLING_MODE=live` e build.
7. **Teste local:** `stripe listen --forward-to localhost:54321/functions/v1/billing-webhook` e cartão `4242 4242 4242 4242`.

**Como cada coisa funciona no Stripe**
- **Assinatura no cartão:** Checkout (`mode=subscription`). Os créditos entram no `invoice.paid` (`subscription_create`), não no retorno da página.
- **Pix:** o Stripe não tem assinatura recorrente em Pix. Então o Pix vale para a **recarga** e para o **anual pago à vista**, que não renova sozinho (`auto_renew=false`): o cron encerra no fim do período. No mensal, só cartão.
- **Upgrade e troca de ciclo:** valem na hora, com a diferença cobrada pro rata (`always_invoice`). Se o cartão falhar, nada muda.
- **Downgrade:** a próxima fatura já sai no preço novo, e os créditos mudam na renovação.
- **Falha de pagamento:** 3 dias de carência do nosso lado. As novas tentativas de cobrança seguem a configuração de Smart Retries do Stripe, e quando o Stripe desiste chega `customer.subscription.deleted`.
- **Idempotência:** cada evento fica registrado em `billing_events`. Evento repetido é ignorado, e os lançamentos no ledger têm referência única.
- **Teste da tradução de eventos:** `node scripts/test-stripe-map.mts`.

## Cotações reais (landing)

- **Cripto** (BTC, ETH, SOL): API pública da Binance, direto do navegador.
- **B3** (Ibovespa, USD/BRL, PETR4, VALE3) e **EUA** (S&P 500, Nasdaq, DXY): Yahoo Finance.
  Em dev passa pelo proxy do Vite (`/yahoo`); em produção pela Edge Function `market-data`
  (lista fechada de símbolos, cache de 60 s). Sem essa função publicada, esses cards mostram "Cotação indisponível".
- Atualiza a cada 60 s. A API do Yahoo é não oficial: para uso comercial, troque por um provedor licenciado
  (ex.: brapi.dev para B3, Twelve Data/Polygon para EUA) mexendo só em `src/services/marketService.ts`.
- Mini-índice e mini-dólar (WIN/WDO) não têm fonte gratuita; usamos Ibovespa e dólar à vista como referência.

## Compliance (aplicado na interface)

- Nada de "compre"/"venda": vocabulário "historicamente", "nos casos parecidos".
- Toda resposta do agente real abre com o aviso (sou uma IA, posso errar, não é recomendação, a empresa não é
  analista credenciada na APIMEC nem consultora autorizada pela CVM). O campo `disclaimer` traz o aviso e o fecho
  ("Não digo se você deve comprar, quando entrar nem quanto colocar"); sem ele, o front usa o mesmo texto
  (`common.disclaimer`), e o rodapé das páginas públicas repete o aviso.
- Todo card mostra amostra, período e fonte. O gráfico mostra só os casos passados: nada de "hoje" nem projeção.
- Estatística do agente real não tem direção (sem seta): menor e maior reação, mediana e taxa-base. A reação de cada
  caso aparece com seta e sinal, nunca só cor.
- Dados de exemplo e do `mockAgent` levam a marca "Exemplo ilustrativo, com dados fictícios".

## Analytics

Eventos em `window.dataLayer` (compatível com GTM/PostHog/Plausible): `waitlist_view`, `waitlist_submit`,
`waitlist_success`, `waitlist_error`, `cta_click` (com `cta_id`: `header`, `menu`, `hero`, `final`).
