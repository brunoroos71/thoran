#!/usr/bin/env bash
# Liga o Thoran ao Supabase e à Stripe (modo teste) e publica. Pode rodar quantas vezes precisar.
#
# Antes (só você pode fazer):
#   1. Conta na Stripe e a chave secreta de TESTE (sk_test_…) colada em .env.production.local
#   2. Conta no Supabase e `npx supabase login` feito no terminal
#   3. `vercel login` (já feito)
#
# Uso: bash scripts/setup-backend.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SB="npx -y supabase@latest"
ENV=.env.production.local

[ -f "$ENV" ] || { cp .env.production.example "$ENV"; chmod 600 "$ENV"; echo "Criei $ENV. Cole a STRIPE_SECRET_KEY nele e rode de novo."; exit 1; }
set -a; source "$ENV"; set +a
put() { printf '%s' "$2" | node scripts/env-set.mjs "$1"; export "$1=$2"; }

# token do Supabase colado no arquivo dispensa o `npx supabase login`
[ -n "${SUPABASE_ACCESS_TOKEN:-}" ] && export SUPABASE_ACCESS_TOKEN
echo "▸ Supabase: conferindo acesso"
$SB projects list >/dev/null 2>&1 || { echo "Sem acesso ao Supabase. Cole o SUPABASE_ACCESS_TOKEN (sbp_…) em $ENV ou rode: npx supabase login"; exit 1; }

if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "▸ Supabase: criando o projeto 'thoran' em São Paulo"
  ORG=$($SB orgs list -o json | node -e 'const o=JSON.parse(require("fs").readFileSync(0));const a=Array.isArray(o)?o:o.orgs||[];console.log(a[0]?.id||"")')
  [ -n "$ORG" ] || { echo "Nenhuma organização no Supabase. Crie uma no painel e rode de novo."; exit 1; }
  DBPASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 28)
  put SUPABASE_DB_PASSWORD "$DBPASS"
  REF=$($SB projects create thoran --org-id "$ORG" --db-password "$DBPASS" --region sa-east-1 -o json | node -e 'const o=JSON.parse(require("fs").readFileSync(0));console.log(o.id||o.ref||"")')
  [ -n "$REF" ] || { echo "Não consegui criar o projeto."; exit 1; }
  put SUPABASE_PROJECT_REF "$REF"
  put SUPABASE_URL "https://$REF.supabase.co"
  echo "  aguardando o projeto ficar pronto (pode levar ~2 min)…"
fi

echo "▸ Supabase: buscando as chaves do projeto"
for i in $(seq 1 30); do
  KEYS=$($SB projects api-keys --project-ref "$SUPABASE_PROJECT_REF" -o json 2>/dev/null || true)
  [ -n "$KEYS" ] && echo "$KEYS" | grep -q service_role && break
  sleep 10
done
put SUPABASE_ANON_KEY "$(echo "$KEYS" | node -e 'const a=JSON.parse(require("fs").readFileSync(0));console.log(a.find(k=>k.name==="anon").api_key)')"
put SUPABASE_SERVICE_ROLE_KEY "$(echo "$KEYS" | node -e 'const a=JSON.parse(require("fs").readFileSync(0));console.log(a.find(k=>k.name==="service_role").api_key)')"

echo "▸ Stripe: conferindo a chave"
case "${STRIPE_SECRET_KEY:-}" in
  sk_test_*) echo "  modo TESTE (nenhuma cobrança real)";;
  sk_live_*) echo "  ⚠ modo PRODUÇÃO: cobranças reais";;
  *) echo "Cole a STRIPE_SECRET_KEY (sk_test_…) em $ENV e rode de novo."; exit 1;;
esac
# enquanto o domínio próprio não responde, usa o endereço da Vercel (senão os links de login quebram)
SITE_URL="${SITE_URL:-https://thoran-rho.vercel.app}"
curl -sf -o /dev/null --max-time 8 "$SITE_URL" || { echo "  $SITE_URL ainda não está no ar; usando https://thoran-rho.vercel.app"; SITE_URL=https://thoran-rho.vercel.app; }
put SITE_URL "$SITE_URL"

echo "▸ Banco, autenticação e funções"
export SUPABASE_DB_PASSWORD
$SB link --project-ref "$SUPABASE_PROJECT_REF" -p "$SUPABASE_DB_PASSWORD" >/dev/null
$SB db push -p "$SUPABASE_DB_PASSWORD" --yes
SITE_URL="$SITE_URL" $SB config push --project-ref "$SUPABASE_PROJECT_REF" --yes >/dev/null && echo "✓ configuração de login aplicada"

echo "▸ Stripe: produtos, preços e webhook"
node scripts/stripe-setup.mjs

set -a; source "$ENV"; set +a
bash scripts/go-live.sh
