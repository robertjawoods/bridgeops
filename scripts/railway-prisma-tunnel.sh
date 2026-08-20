#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/packages/database/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing Prisma env file: $ENV_FILE" >&2
  exit 1
fi

updated=0

echo "Starting Railway Postgres tunnel"
echo "Watching tunnel output and updating $ENV_FILE"

# Read from process substitution so `railway connect` keeps a direct process lifecycle
# instead of running through a shell pipe.
while IFS= read -r line; do
  echo "$line"

  if [[ $updated -eq 0 && "$line" =~ (postgres(ql)?://[^[:space:]]+) ]]; then
    url="${BASH_REMATCH[1]}"
    temp_file="$(mktemp)"

    awk -v new_url="$url" '
      BEGIN { replaced = 0 }
      /^DATABASE_URL=/ {
        print "DATABASE_URL=\"" new_url "\""
        replaced = 1
        next
      }
      { print }
      END {
        if (replaced == 0) {
          print "DATABASE_URL=\"" new_url "\""
        }
      }
    ' "$ENV_FILE" > "$temp_file"

    mv "$temp_file" "$ENV_FILE"
    updated=1
    echo "Prisma DATABASE_URL updated: $url"
  fi
done < <(railway connect database --tunnel-only 2>&1)
