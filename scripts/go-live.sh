#!/usr/bin/env bash
# Coloca o Thoran no ar. Rode DEPOIS de criar as contas e preencher o arquivo .env.production.local
# (modelo em .env.production.example). Uso: bash scripts/go-live.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env.production.local ] || { echo "Falta .env.production.local (copie de .env.production.example)"; exit 1; }
set -a; source .env.production.local; set +a

need() { [ -n "${!1:-}" ] || { echo "Falta $1 em .env.production.local"; exit 1; }; }
for v in SUPABASE_PROJECT_REF SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET RESEND_API_KEY SITE_URL; do need "$v"; done

echo "▸ 1/5 Banco (migrações)"
npx -y supabase@latest link --project-ref "$SUPABASE_PROJECT_REF"
npx -y supabase@latest db push

echo "▸ 2/5 Segredos das Edge Functions"
npx -y supabase@latest secrets set \
  SITE_URL="$SITE_URL" SITE_ORIGIN="$SITE_URL" \
  IP_SALT="${IP_SALT:-$(openssl rand -hex 16)}" CRON_SECRET="${CRON_SECRET:-$(openssl rand -hex 24)}" \
  RESEND_API_KEY="$RESEND_API_KEY" EMAIL_FROM="${EMAIL_FROM:-Thoran <ola@thoran.com.br>}" \
  BILLING_GATEWAY=stripe STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  ${AGENT_API_URL:+AGENT_API_URL="$AGENT_API_URL"} ${AGENT_API_KEY:+AGENT_API_KEY="$AGENT_API_KEY"}

echo "▸ 3/5 Edge Functions"
# market-data fica de fora até haver fornecedor de cotação licenciado (docs/auditoria-legal.md, item 10)
npx -y supabase@latest functions deploy waitlist-join admin-waitlist agent-proxy billing billing-webhook billing-cron

echo "▸ 4/5 Produtos e preços no Stripe"
STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" SUPABASE_URL="$SUPABASE_URL" SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" node scripts/stripe-setup.mjs

echo "▸ 5/5 Site na Vercel"
for kv in "VITE_SUPABASE_URL=$SUPABASE_URL" "VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" "VITE_SITE_URL=$SITE_URL" \
          "WAITLIST_MODE=${WAITLIST_MODE:-false}" "AGENT_MODE=${AGENT_MODE:-mock}" "BILLING_MODE=live"; do
  k="${kv%%=*}"; v="${kv#*=}"
  vercel env rm "$k" production -y >/dev/null 2>&1 || true
  printf '%s' "$v" | vercel env add "$k" production >/dev/null
done
vercel deploy --prod

echo
echo "✓ No ar. Faltam 3 cliques manuais (ver README › Colocar no ar): webhook do Stripe, Google OAuth e agendar o billing-cron."
