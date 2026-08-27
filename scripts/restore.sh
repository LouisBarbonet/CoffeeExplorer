#!/usr/bin/env bash
# Restores a Postgres dump from Cloudflare R2. DESTRUCTIVE: overwrites every
# table in the live database with the contents of the chosen dump. Run this
# on the VM, manually, only when you actually need to restore.
#
# Usage:
#   ./scripts/restore.sh list                        # show available dumps
#   ./scripts/restore.sh <dump-filename.sql.gz> --yes # restore a specific one
#   ./scripts/restore.sh latest --yes                 # restore the newest one
set -euo pipefail

cd "$(dirname "$0")/.."

set -a
source .env
set +a

: "${R2_ACCOUNT_ID:?Set R2_ACCOUNT_ID in .env}"
: "${R2_ACCESS_KEY_ID:?Set R2_ACCESS_KEY_ID in .env}"
: "${R2_SECRET_ACCESS_KEY:?Set R2_SECRET_ACCESS_KEY in .env}"
: "${R2_BUCKET:?Set R2_BUCKET in .env}"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env"

TMP_DIR="$(pwd)/backups/tmp"
mkdir -p "$TMP_DIR"

RCLONE_CONF="${TMP_DIR}/rclone.conf"
cleanup() { rm -f "$RCLONE_CONF"; }
trap cleanup EXIT

cat > "$RCLONE_CONF" <<EOF
[r2]
type = s3
provider = Cloudflare
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
endpoint = https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
EOF
chmod 600 "$RCLONE_CONF"

rclone_cmd() {
  docker run --rm \
    -v "${RCLONE_CONF}:/config/rclone/rclone.conf:ro" \
    -v "${TMP_DIR}:/data" \
    rclone/rclone:latest "$@"
}

if [[ "${1:-}" == "list" ]]; then
  echo "Available Postgres dumps in r2:${R2_BUCKET}/postgres/"
  rclone_cmd lsf "r2:${R2_BUCKET}/postgres/" | sort
  exit 0
fi

DUMP_NAME="${1:-}"
CONFIRM="${2:-}"

if [[ -z "$DUMP_NAME" ]]; then
  echo "Usage:"
  echo "  $0 list                          # show available dumps"
  echo "  $0 <dump-filename.sql.gz> --yes   # restore one (DESTRUCTIVE)"
  echo "  $0 latest --yes                   # restore the most recent dump"
  exit 1
fi

if [[ "$DUMP_NAME" == "latest" ]]; then
  DUMP_NAME="$(rclone_cmd lsf "r2:${R2_BUCKET}/postgres/" | sort | tail -1)"
  if [[ -z "$DUMP_NAME" ]]; then
    echo "error: no dumps found in r2:${R2_BUCKET}/postgres/" >&2
    exit 1
  fi
  echo "Resolved 'latest' -> ${DUMP_NAME}"
fi

if [[ "$CONFIRM" != "--yes" ]]; then
  echo
  echo "!! This will PERMANENTLY OVERWRITE the live database with ${DUMP_NAME}."
  echo "!! Every account, visit, buddy, rating, and notification created since"
  echo "!! that backup was taken will be lost."
  echo
  echo "Re-run with --yes to confirm: $0 ${DUMP_NAME} --yes"
  exit 1
fi

echo "==> Downloading ${DUMP_NAME} from R2..."
rclone_cmd copyto "r2:${R2_BUCKET}/postgres/${DUMP_NAME}" "/data/${DUMP_NAME}"

echo "==> Restoring into Postgres (this overwrites the current database)..."
gunzip -c "${TMP_DIR}/${DUMP_NAME}" \
  | $COMPOSE exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "==> Restore complete from ${DUMP_NAME}."
echo "==> Consider restarting the backend so it drops any stale connections/cache:"
echo "    ${COMPOSE} restart backend"
