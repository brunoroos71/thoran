-- Thoran · agente real e permissões
-- 1) Apaga o protótipo de teste do agente (tabelas em português, do repositório trade-agent): o site substitui.
-- 2) auditoria_agente: o que o agente registrou de cada resposta (regra M10 das "Regras do agente").
-- 3) Permissões explícitas. Toda função nasce executável por PUBLIC, então o revoke só de anon/authenticated da
--    migração de créditos não tirava o acesso: qualquer pessoa logada podia chamar grant_monthly_credits e se dar
--    créditos. E as tabelas não dependem mais do acesso automático do Supabase (que projetos novos não dão).
-- 4) analyses só de leitura pelo front: quem grava a resposta do agente é o /agent-proxy.
-- 5) Perfil, assinatura e teste grátis para quem criou a conta antes destes gatilhos.

-- ───────────── 1) Protótipo ─────────────
drop trigger if exists ao_criar_usuario on auth.users;
drop function if exists public.criar_perfil();
drop function if exists public.aceitar_termos();
drop function if exists public.minha_cota();
drop function if exists public.reservar_pergunta(uuid);
drop table if exists public.auditoria, public.perguntas, public.perfis, public.planos cascade;

-- ───────────── 2) Auditoria do agente ─────────────
-- Gravada pela função analyze (do trade-agent) com a chave secreta. Não tem user_id: a ligação com a pessoa é o
-- analise_id em analyses, que some quando a conta é apagada; a auditoria fica (M10).
create table public.auditoria_agente (
  analise_id text primary key,                 -- o id que o agente devolve (analyses.id)
  pergunta   text not null,                    -- sem o trecho de voto e sem valor em dinheiro
  modo       text not null,                    -- 'sem IA' ou 'IA (modelo) + palavras-chave'
  roteador   jsonb not null,                   -- a leitura da pergunta, sem candidato quando a pessoa contou o voto
  violacoes  jsonb not null default '[]',      -- o que o filtro de saída barrou
  ia         jsonb,
  uso        jsonb,                            -- tokens da IA
  criada_em  timestamptz not null default now()
);
create index auditoria_agente_criada_idx on public.auditoria_agente (criada_em desc);
alter table public.auditoria_agente enable row level security;  -- sem políticas: só a service role

-- ───────────── 3) Permissões ─────────────
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

grant select on public.plans, public.credit_config to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.analyses, public.subscriptions, public.credit_ledger, public.invoices to authenticated;
grant select, insert, update on public.feedback to authenticated;
grant select, insert, delete on public.alerts to authenticated;

revoke execute on function
  public.cfg(text),
  public.credit_balance(uuid),
  public.bucket_balance(uuid, text),
  public.my_credits(),
  public.consume_credits(uuid, public.ledger_kind, text),
  public.refund_credits(uuid, text),
  public.grant_monthly_credits(uuid, text),
  public.expire_canceled(uuid),
  public.handle_new_user(),
  public.protect_profile_fields()
from public, anon, authenticated;
grant execute on function
  public.cfg(text),
  public.credit_balance(uuid),
  public.bucket_balance(uuid, text),
  public.my_credits(),
  public.consume_credits(uuid, public.ledger_kind, text),
  public.refund_credits(uuid, text),
  public.grant_monthly_credits(uuid, text),
  public.expire_canceled(uuid)
to service_role;
grant execute on function public.my_credits() to authenticated;  -- saldo da própria conta (usa auth.uid())

-- ───────────── 4) analyses ─────────────
drop policy if exists "analyses: criar as próprias" on public.analyses;
drop policy if exists "analyses: upsert as próprias" on public.analyses;

-- ───────────── 5) Contas que já existiam ─────────────
insert into public.profiles (id, name)
  select id, raw_user_meta_data->>'name' from auth.users
  on conflict (id) do nothing;
insert into public.subscriptions (user_id, status)
  select id, 'trial' from auth.users
  on conflict (user_id) do nothing;
insert into public.credit_ledger (user_id, amount, kind, bucket, reference)
  select id, public.cfg('trial_credits'), 'trial', 'recarga', 'signup' from auth.users
  on conflict do nothing;
