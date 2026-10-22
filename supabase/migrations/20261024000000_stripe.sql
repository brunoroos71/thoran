-- Stripe: anual pago no Pix não renova sozinho; registro de eventos para idempotência e auditoria.
alter table public.subscriptions add column auto_renew boolean not null default true;
create index subscriptions_gateway_customer_idx on public.subscriptions (gateway_customer_id);

create table public.billing_events (
  id          text primary key,        -- id do evento no gateway (evt_…)
  gateway     text not null,
  type        text not null,
  received_at timestamptz not null default now(),
  processed   boolean not null default false,
  error       text
);
alter table public.billing_events enable row level security;  -- só service role
