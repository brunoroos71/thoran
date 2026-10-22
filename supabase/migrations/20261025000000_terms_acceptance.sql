-- Registro do aceite dos Termos, Política de Privacidade e Aviso de Risco (prova de consentimento).
alter table public.profiles
  add column terms_version text,
  add column terms_accepted_at timestamptz;

-- No cadastro por e-mail, a versão aceita vem nos metadados do usuário.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, terms_version, terms_accepted_at)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'terms_version',
    case when new.raw_user_meta_data ? 'terms_version' then now() end
  )
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id, status, gateway) values (new.id, 'trial', null)
  on conflict (user_id) do nothing;
  insert into public.credit_ledger (user_id, amount, kind, bucket, reference)
  values (new.id, public.cfg('trial_credits'), 'trial', 'recarga', 'signup')
  on conflict do nothing;
  return new;
end $$;
