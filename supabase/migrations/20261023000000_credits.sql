-- Thoran · planos, assinaturas e créditos
-- Regra de ouro: o saldo é SEMPRE a soma de credit_ledger. Não existe campo de saldo editável.

-- ───────────── Configuração (muda sem deploy) ─────────────
create table public.plans (
  id               text primary key,               -- 'basic' | 'pro'
  name             text not null,
  monthly_cents    integer not null,
  annual_cents     integer not null,
  credits_per_month integer not null,
  allows_rollover  boolean not null default false,  -- Pro acumula 1 mês de sobra
  rollover_cap     integer,                         -- teto do saldo de plano após renovar (Pro: 300)
  currency         text not null default 'BRL',
  active           boolean not null default true
);
alter table public.plans enable row level security;
create policy "plans: leitura pública" on public.plans for select using (active);

insert into public.plans (id, name, monthly_cents, annual_cents, credits_per_month, allows_rollover, rollover_cap) values
  ('basic', 'Basic', 2990, 29900, 80, false, null),
  ('pro',   'Pro',   4990, 49900, 150, true, 300);

create table public.credit_config (
  key   text primary key,
  value integer not null
);
alter table public.credit_config enable row level security;
create policy "credit_config: leitura pública" on public.credit_config for select using (true);

insert into public.credit_config (key, value) values
  ('cost_pergunta', 1),
  ('cost_analise', 5),
  ('trial_credits', 15),
  ('topup_credits', 50),
  ('topup_cents', 1990),
  ('low_balance_threshold', 10),
  ('grace_days', 3);

create or replace function public.cfg(k text) returns integer language sql stable as $$
  select value from public.credit_config where key = k
$$;

-- ───────────── Assinaturas ─────────────
create type public.billing_cycle as enum ('mensal', 'anual');
create type public.subscription_status as enum ('trial', 'ativa', 'cancelada', 'inadimplente');

create table public.subscriptions (
  user_id              uuid primary key references auth.users on delete cascade,
  plan_id              text references public.plans,      -- null durante o teste grátis
  cycle                public.billing_cycle not null default 'mensal',
  status               public.subscription_status not null default 'trial',
  period_start         timestamptz,
  period_end           timestamptz,                       -- fim do período pago (mensal ou anual)
  next_credit_at       timestamptz,                       -- anual: créditos entram mês a mês
  pending_plan_id      text references public.plans,      -- downgrade agendado para a próxima renovação
  pending_cycle        public.billing_cycle,              -- troca mensal/anual agendada
  cancel_at_period_end boolean not null default false,
  grace_until          timestamptz,                       -- falha de pagamento: 3 dias de carência
  gateway              text,                              -- 'stripe' | 'mock'
  gateway_customer_id  text,
  gateway_subscription_id text,
  low_balance_notified_at timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subscriptions: ler a própria" on public.subscriptions for select using (auth.uid() = user_id);
-- escrita só por service role (Edge Functions de billing / webhooks)

-- ───────────── Ledger ─────────────
create type public.ledger_kind as enum ('trial', 'renovacao', 'recarga', 'consumo_pergunta', 'consumo_analise', 'estorno', 'expiracao');

create table public.credit_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  amount     integer not null check (amount <> 0),
  kind       public.ledger_kind not null,
  -- 'plano' expira na renovação (regras do plano); 'recarga' não expira com a assinatura ativa
  bucket     text not null default 'plano' check (bucket in ('plano', 'recarga')),
  reference  text,             -- id da análise, do pagamento ou do evento do gateway
  created_at timestamptz not null default now()
);
create index credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);
-- idempotência: o mesmo evento do gateway nunca lança créditos duas vezes
create unique index credit_ledger_ref_unique on public.credit_ledger (user_id, kind, bucket, reference)
  where reference is not null and kind in ('renovacao', 'recarga', 'trial', 'estorno');
alter table public.credit_ledger enable row level security;
create policy "ledger: ler o próprio" on public.credit_ledger for select using (auth.uid() = user_id);
-- nenhuma política de escrita: só funções security definer / service role

-- Livro de nota fiscal (gancho para integração futura) [EMISSOR DE NOTA A DEFINIR]
create table public.invoices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  amount_cents integer not null,
  description text not null,
  gateway_payment_id text unique,
  status      text not null default 'pendente_emissao',  -- pendente_emissao | emitida | erro
  issuer_ref  text,
  created_at  timestamptz not null default now()
);
alter table public.invoices enable row level security;
create policy "invoices: ler as próprias" on public.invoices for select using (auth.uid() = user_id);

-- ───────────── Saldo ─────────────
create or replace function public.credit_balance(p_user uuid) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount), 0)::integer from public.credit_ledger where user_id = p_user
$$;

create or replace function public.bucket_balance(p_user uuid, p_bucket text) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount), 0)::integer from public.credit_ledger where user_id = p_user and bucket = p_bucket
$$;

create or replace function public.my_credits() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'balance', public.credit_balance(auth.uid()),
    'cost_pergunta', public.cfg('cost_pergunta'),
    'cost_analise', public.cfg('cost_analise'),
    'low_threshold', public.cfg('low_balance_threshold')
  )
$$;

-- ───────────── Débito atômico ─────────────
-- Trava a linha da assinatura para serializar débitos concorrentes do mesmo usuário.
-- Retorna o novo saldo, ou levanta exceção com código legível.
create or replace function public.consume_credits(p_user uuid, p_kind public.ledger_kind, p_ref text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_cost integer;
  v_balance integer;
  v_from_plan integer;
  v_sub public.subscriptions%rowtype;
begin
  if p_kind not in ('consumo_pergunta', 'consumo_analise') then
    raise exception 'kind inválido' using errcode = '22023';
  end if;
  v_cost := public.cfg(case when p_kind = 'consumo_analise' then 'cost_analise' else 'cost_pergunta' end);

  select * into v_sub from public.subscriptions where user_id = p_user for update;
  if not found then raise exception 'sem_assinatura' using errcode = 'P0001'; end if;
  if v_sub.status = 'inadimplente' then raise exception 'inadimplente' using errcode = 'P0001'; end if;
  if v_sub.status = 'cancelada' and v_sub.period_end < now() then raise exception 'cancelada' using errcode = 'P0001'; end if;

  v_balance := public.credit_balance(p_user);
  if v_balance < v_cost then raise exception 'saldo_insuficiente' using errcode = 'P0001'; end if;

  -- gasta primeiro os créditos do plano, depois os de recarga
  v_from_plan := least(v_cost, greatest(public.bucket_balance(p_user, 'plano'), 0));
  if v_from_plan > 0 then
    insert into public.credit_ledger (user_id, amount, kind, bucket, reference) values (p_user, -v_from_plan, p_kind, 'plano', p_ref);
  end if;
  if v_cost - v_from_plan > 0 then
    insert into public.credit_ledger (user_id, amount, kind, bucket, reference) values (p_user, -(v_cost - v_from_plan), p_kind, 'recarga', p_ref);
  end if;
  return v_balance - v_cost;
end $$;

-- Estorno idempotente (agente falhou depois do débito): devolve cada balde ao que era
create or replace function public.refund_credits(p_user uuid, p_ref text)
returns integer language plpgsql security definer set search_path = public as $$
begin
  insert into public.credit_ledger (user_id, amount, kind, bucket, reference)
  select user_id, -amount, 'estorno', bucket, reference
    from public.credit_ledger
   where user_id = p_user and reference = p_ref and kind in ('consumo_pergunta', 'consumo_analise')
  on conflict do nothing;
  return public.credit_balance(p_user);
end $$;

-- ───────────── Renovação ─────────────
-- Basic: zera o que sobrou do plano e recebe 80.
-- Pro: mantém a sobra até o teto (300 após somar os 150 novos) e recebe 150.
-- Créditos de recarga não expiram enquanto a assinatura está ativa.
create or replace function public.grant_monthly_credits(p_user uuid, p_ref text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_plan_left integer;
  v_keep integer;
begin
  select * into v_sub from public.subscriptions where user_id = p_user for update;
  -- idempotência: o mesmo evento de renovação (webhook reenviado) não faz nada
  if exists (select 1 from public.credit_ledger where user_id = p_user and kind = 'renovacao' and reference = p_ref) then
    return public.credit_balance(p_user);
  end if;
  -- downgrade / troca de ciclo agendados entram em vigor agora
  if v_sub.pending_plan_id is not null then
    update public.subscriptions set plan_id = pending_plan_id, pending_plan_id = null where user_id = p_user;
    v_sub.plan_id := v_sub.pending_plan_id;
  end if;
  if v_sub.pending_cycle is not null then
    update public.subscriptions set cycle = pending_cycle, pending_cycle = null where user_id = p_user;
  end if;
  select * into v_plan from public.plans where id = v_sub.plan_id;

  v_plan_left := greatest(public.bucket_balance(p_user, 'plano'), 0);

  if v_plan.allows_rollover then
    v_keep := least(v_plan_left, greatest(coalesce(v_plan.rollover_cap, v_plan.credits_per_month * 2) - v_plan.credits_per_month, 0));
  else
    v_keep := 0;
  end if;

  if v_plan_left - v_keep > 0 then
    insert into public.credit_ledger (user_id, amount, kind, bucket, reference) values (p_user, -(v_plan_left - v_keep), 'expiracao', 'plano', 'renov:' || p_ref);
  end if;
  insert into public.credit_ledger (user_id, amount, kind, reference) values (p_user, v_plan.credits_per_month, 'renovacao', p_ref)
  on conflict do nothing;

  update public.subscriptions
     set next_credit_at = case when cycle = 'anual' then coalesce(next_credit_at, now()) + interval '1 month' else null end,
         low_balance_notified_at = null,
         updated_at = now()
   where user_id = p_user;
  return public.credit_balance(p_user);
end $$;

-- Cancelamento com período vencido: recargas deixam de valer
create or replace function public.expire_canceled(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_plan integer; v_topup integer;
begin
  v_plan := public.bucket_balance(p_user, 'plano');
  v_topup := public.bucket_balance(p_user, 'recarga');
  if v_plan > 0 then
    insert into public.credit_ledger (user_id, amount, kind, bucket, reference) values (p_user, -v_plan, 'expiracao', 'plano', 'cancel:' || now()::date);
  end if;
  if v_topup > 0 then
    insert into public.credit_ledger (user_id, amount, kind, bucket, reference) values (p_user, -v_topup, 'expiracao', 'recarga', 'cancel:' || now()::date);
  end if;
end $$;

revoke execute on function public.consume_credits(uuid, public.ledger_kind, text) from anon, authenticated;
revoke execute on function public.refund_credits(uuid, text) from anon, authenticated;
revoke execute on function public.grant_monthly_credits(uuid, text) from anon, authenticated;
revoke execute on function public.expire_canceled(uuid) from anon, authenticated;
revoke execute on function public.credit_balance(uuid) from anon, authenticated;
revoke execute on function public.bucket_balance(uuid, text) from anon, authenticated;

-- ───────────── Teste grátis no cadastro ─────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id, status, gateway) values (new.id, 'trial', null)
  on conflict (user_id) do nothing;
  -- teste grátis entra no balde 'recarga': não some se a pessoa assinar o Basic no meio do teste
  insert into public.credit_ledger (user_id, amount, kind, bucket, reference)
  values (new.id, public.cfg('trial_credits'), 'trial', 'recarga', 'signup')
  on conflict do nothing;
  return new;
end $$;

-- O limite diário por plano da versão anterior foi substituído por créditos.
drop table if exists public.agent_usage;
drop function if exists public.increment_agent_usage(uuid);
