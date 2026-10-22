-- Thoran · schema inicial
create extension if not exists citext;

-- ───────────── Fase 1: lista de espera ─────────────
create table public.waitlist (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null unique check (email = lower(email::text)),
  created_at   timestamptz not null default now(),
  locale       text default 'pt-BR',
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  referrer     text,
  consent_at   timestamptz not null
);
create index waitlist_created_at_idx on public.waitlist (created_at desc);
-- RLS ligado e SEM políticas: só a service role (Edge Functions) lê/escreve.
alter table public.waitlist enable row level security;

-- Limite de requisições por IP (hash do IP, nunca o IP em claro)
create table public.rate_limits (
  id         bigint generated always as identity primary key,
  bucket     text not null,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index rate_limits_lookup_idx on public.rate_limits (bucket, ip_hash, created_at desc);
alter table public.rate_limits enable row level security;

-- ───────────── Fase 2: contas ─────────────
create type public.experience_level as enum ('iniciante', 'intermediario', 'avancado');
create type public.plan_tier as enum ('free', 'pro', 'max');

create table public.profiles (
  id               uuid primary key references auth.users on delete cascade,
  name             text,
  experience_level public.experience_level,
  markets          text[] not null default '{}' check (markets <@ array['b3','crypto','global']),
  plan             public.plan_tier not null default 'free',
  locale           text not null default 'pt-BR',
  onboarded        boolean not null default false,
  is_admin         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profile: ler o próprio"     on public.profiles for select using (auth.uid() = id);
create policy "profile: criar o próprio"   on public.profiles for insert with check (auth.uid() = id and plan = 'free' and is_admin = false);
create policy "profile: editar o próprio"  on public.profiles for update using (auth.uid() = id);

-- Usuário não pode se promover a admin nem trocar de plano pelo front
create or replace function public.protect_profile_fields() returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.plan := old.plan;
    new.is_admin := old.is_admin;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Cria o profile automaticamente no cadastro
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── Fase 2: agente ─────────────
create table public.analyses (
  id         text primary key,                -- id devolvido pela API do agente
  user_id    uuid not null references auth.users on delete cascade,
  question   text not null,
  response   jsonb not null,
  created_at timestamptz not null default now()
);
create index analyses_user_idx on public.analyses (user_id, created_at desc);
alter table public.analyses enable row level security;
create policy "analyses: ler as próprias"  on public.analyses for select using (auth.uid() = user_id);
-- insert pelo front só é usado em AGENT_MODE=mock; no live quem grava é o agent-proxy (service role)
create policy "analyses: criar as próprias" on public.analyses for insert with check (auth.uid() = user_id);
create policy "analyses: upsert as próprias" on public.analyses for update using (auth.uid() = user_id);

create table public.agent_usage (
  user_id  uuid not null references auth.users on delete cascade,
  day      date not null default (now() at time zone 'America/Sao_Paulo')::date,
  count    integer not null default 0,
  primary key (user_id, day)
);
alter table public.agent_usage enable row level security;
create policy "usage: ler o próprio" on public.agent_usage for select using (auth.uid() = user_id);

-- Incremento atômico usado pelo agent-proxy; devolve o total do dia
create or replace function public.increment_agent_usage(p_user uuid) returns integer
language sql security definer set search_path = public as $$
  insert into public.agent_usage (user_id, day, count)
  values (p_user, (now() at time zone 'America/Sao_Paulo')::date, 1)
  on conflict (user_id, day) do update set count = public.agent_usage.count + 1
  returning count;
$$;
revoke execute on function public.increment_agent_usage(uuid) from anon, authenticated;

create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  analysis_id text not null references public.analyses on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  rating      text not null check (rating in ('useful', 'not_useful')),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (analysis_id, user_id)
);
alter table public.feedback enable row level security;
create policy "feedback: ler o próprio"   on public.feedback for select using (auth.uid() = user_id);
create policy "feedback: criar o próprio" on public.feedback for insert with check (auth.uid() = user_id);
create policy "feedback: editar o próprio" on public.feedback for update using (auth.uid() = user_id);

create table public.alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  term       text not null check (char_length(term) between 1 and 80),
  created_at timestamptz not null default now()
);
alter table public.alerts enable row level security;
create policy "alerts: tudo no próprio" on public.alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Log de chamadas ao agente (auditoria / custos)
create table public.agent_calls (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users on delete set null,
  analysis_id text,
  status      integer,
  latency_ms  integer,
  created_at  timestamptz not null default now()
);
alter table public.agent_calls enable row level security;
