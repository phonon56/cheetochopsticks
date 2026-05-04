#!/bin/bash
# set-resend-secrets.sh — interactively load Resend secrets into Cloudflare.
#
# Usage:
#   ./shared/notify/set-resend-secrets.sh
#
# Each prompt is hidden (like a password field). The value is piped directly
# to `wrangler secret put` with the correct name. There's no chance of mixing
# up the name and the value.

set -euo pipefail

cd "$(dirname "$0")/../.."

echo
echo "━━━ Setting Resend secrets in Cloudflare ━━━"
echo

# 1. RESEND_API_KEY
read -srp "Paste your Resend API key (starts with re_): " RESEND_KEY
echo
if [[ -z "$RESEND_KEY" ]]; then
  echo "✘ No key entered — skipping RESEND_API_KEY"
else
  printf '%s' "$RESEND_KEY" | npx wrangler secret put RESEND_API_KEY
fi
unset RESEND_KEY
echo

# 2. RESEND_WEBHOOK_SECRET (optional — press Enter to skip)
read -srp "Paste your Resend webhook signing secret (starts with whsec_), or Enter to skip: " WEBHOOK_KEY
echo
if [[ -z "$WEBHOOK_KEY" ]]; then
  echo "→ Skipping RESEND_WEBHOOK_SECRET (you can run this script again later)"
else
  printf '%s' "$WEBHOOK_KEY" | npx wrangler secret put RESEND_WEBHOOK_SECRET
fi
unset WEBHOOK_KEY

echo
echo "━━━ Done. Listing current secrets ━━━"
npx wrangler secret list
