-- Novos preços (22/10/2026). Anual = 10 × mensal ("2 meses grátis").
-- Assinantes existentes continuam no preço antigo na Stripe até mudarem de plano.
update public.plans set monthly_cents = 5790, annual_cents = 57900 where id = 'basic';
update public.plans set monthly_cents = 9790, annual_cents = 97900 where id = 'pro';
