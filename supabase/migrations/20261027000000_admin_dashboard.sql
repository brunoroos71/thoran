-- Thoran · relatórios do painel administrativo (/admin)
-- Só a service role executa (chamadas pela Edge Function admin-stats, que confere profiles.is_admin).
-- Dias contados no fuso de São Paulo.

create or replace function public.admin_dashboard() returns json
language sql stable security definer set search_path = public as $$
with
  hoje as (select (now() at time zone 'America/Sao_Paulo')::date d),
  dias as (select generate_series((select d from hoje) - 29, (select d from hoje), interval '1 day')::date d),
  contas as (select id, created_at, (created_at at time zone 'America/Sao_Paulo')::date dia from auth.users),
  pagos as (
    select s.*, p.monthly_cents, p.annual_cents from subscriptions s join plans p on p.id = s.plan_id
    where s.status = 'ativa' and s.plan_id is not null
  ),
  fat as (select amount_cents, description, (created_at at time zone 'America/Sao_Paulo')::date dia, created_at from invoices),
  uso as (
    select kind, amount, user_id, (created_at at time zone 'America/Sao_Paulo')::date dia, created_at
    from credit_ledger where kind in ('consumo_pergunta', 'consumo_analise', 'estorno')
  )
select json_build_object(
  'generated_at', now(),
  'accounts', json_build_object(
    'total', (select count(*) from contas),
    'today', (select count(*) from contas where dia = (select d from hoje)),
    'd7', (select count(*) from contas where dia > (select d from hoje) - 7),
    'd30', (select count(*) from contas where dia > (select d from hoje) - 30),
    'daily', (select json_agg(json_build_object('day', dias.d, 'n', (select count(*) from contas c where c.dia = dias.d)) order by dias.d) from dias)
  ),
  'subscriptions', json_build_object(
    'paying', (select count(*) from pagos),
    'by_plan', (select coalesce(json_agg(x), '[]') from (select plan_id plan, cycle, count(*) n from pagos group by 1, 2 order by 1, 2) x),
    'trial', (select count(*) from subscriptions where status = 'trial'),
    'conversion', (select case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where plan_id is not null) / count(*), 1) end from subscriptions),
    'mrr_cents', (select coalesce(sum(case when cycle = 'anual' then round(annual_cents / 12.0) else monthly_cents end), 0) from pagos)
  ),
  'revenue', json_build_object(
    'month_cents', (select coalesce(sum(amount_cents), 0) from fat where date_trunc('month', dia) = date_trunc('month', (select d from hoje))),
    'd30_cents', (select coalesce(sum(amount_cents), 0) from fat where dia > (select d from hoje) - 30),
    'total_cents', (select coalesce(sum(amount_cents), 0) from fat),
    'topups_month', (select count(*) from fat where description ilike 'Recarga%' and date_trunc('month', dia) = date_trunc('month', (select d from hoje))),
    'daily', (select json_agg(json_build_object('day', dias.d, 'cents', (select coalesce(sum(amount_cents), 0) from fat f where f.dia = dias.d)) order by dias.d) from dias)
  ),
  'usage', json_build_object(
    'analyses_d30', (select count(*) from uso where kind = 'consumo_analise' and dia > (select d from hoje) - 30),
    'questions_d30', (select count(*) from uso where kind = 'consumo_pergunta' and dia > (select d from hoje) - 30),
    'refunds_d30', (select count(*) from uso where kind = 'estorno' and dia > (select d from hoje) - 30),
    'credits_d30', (select coalesce(-sum(amount), 0) from uso where dia > (select d from hoje) - 30),
    'active_users_d7', (select count(distinct user_id) from uso where kind <> 'estorno' and dia > (select d from hoje) - 7),
    'daily', (select json_agg(json_build_object('day', dias.d, 'n', (select count(*) from uso u where u.dia = dias.d and u.kind in ('consumo_pergunta', 'consumo_analise'))) order by dias.d) from dias),
    'agent_calls_d30', (select count(*) from agent_calls where created_at > now() - interval '30 days'),
    'agent_errors_d30', (select count(*) from agent_calls where created_at > now() - interval '30 days' and coalesce(status, 0) <> 200)
  ),
  'health', json_build_object(
    'grace', (select count(*) from subscriptions where status = 'ativa' and grace_until is not null),
    'delinquent', (select count(*) from subscriptions where status = 'inadimplente'),
    'cancel_scheduled', (select count(*) from subscriptions where cancel_at_period_end),
    'webhook_errors', (select count(*) from billing_events where error is not null or (not processed and received_at < now() - interval '10 minutes')),
    'recent_events', (select coalesce(json_agg(x), '[]') from (select id, type, processed, error, received_at from billing_events order by received_at desc limit 12) x)
  )
)
$$;

create or replace function public.admin_accounts(p_search text default null, p_limit int default 50, p_offset int default 0) returns json
language sql stable security definer set search_path = public as $$
select json_build_object(
  'total', (select count(*) from auth.users u where p_search is null or u.email ilike '%' || p_search || '%'),
  'rows', coalesce((
    select json_agg(r) from (
      select
        u.id, u.email, u.created_at, u.last_sign_in_at,
        s.plan_id plan, s.cycle, s.status, s.period_end, s.cancel_at_period_end,
        public.credit_balance(u.id) balance,
        (select max(created_at) from credit_ledger l where l.user_id = u.id and l.kind in ('consumo_pergunta', 'consumo_analise')) last_use,
        (select coalesce(-sum(amount), 0) from credit_ledger l where l.user_id = u.id and l.kind in ('consumo_pergunta', 'consumo_analise', 'estorno') and l.created_at > now() - interval '30 days') used_d30,
        (select coalesce(sum(amount_cents), 0) from invoices i where i.user_id = u.id) paid_cents,
        coalesce(p.is_admin, false) is_admin
      from auth.users u
      left join subscriptions s on s.user_id = u.id
      left join profiles p on p.id = u.id
      where p_search is null or u.email ilike '%' || p_search || '%'
      order by u.created_at desc
      limit least(greatest(p_limit, 1), 500) offset greatest(p_offset, 0)
    ) r
  ), '[]')
)
$$;

revoke execute on function public.admin_dashboard() from public, anon, authenticated;
revoke execute on function public.admin_accounts(text, int, int) from public, anon, authenticated;
grant execute on function public.admin_dashboard() to service_role;
grant execute on function public.admin_accounts(text, int, int) to service_role;
