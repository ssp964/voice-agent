#!/usr/bin/env sh
# Simple helper to test n8n webhook from the terminal.
# Usage:
#   sh ./test_n8n.sh "Hello"            # hits TEST webhook
#   sh ./test_n8n.sh "Hello" --prod     # hits PRODUCTION webhook

set -eu

MESSAGE=${1:-"Hello"}
MODE=${2:-"--test"}

N8N_BASE_URL=${N8N_BASE_URL:-"http://localhost:5678"}

if [ "$MODE" = "--prod" ]; then
  WEBHOOK_PATH="/webhook/my-webhook"
else
  WEBHOOK_PATH="/webhook-test/my-webhook"
fi

URL="${N8N_BASE_URL}${WEBHOOK_PATH}"

echo "POST ${URL}"
curl -sS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"${MESSAGE}\"}"
echo ""


