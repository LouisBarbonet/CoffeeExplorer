#!/usr/bin/env bash
# Nightly backup: dumps Postgres and mirrors the uploads volume to Cloudflare
# R2. Runs on the VM -- triggered by .github/workflows/backup.yml over SSH,
# same as a normal deploy. Not meant to be run from a laptop.
#
# Requires R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET
# in .env (see DEPLOY.md's "Set up backups" section).
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

# The named volume compose created for uploads -- "<project-dir-name>_uploads"
# since these are run from ~/coffeeexplorer with no explicit -p. Adjust if
# your checkout directory is named differently.
UPLOADS_VOLUME="coffeeexplorer_uploads"

TMP_DIR="$(pwd)/backups/tmp"
mkdir -p "$TMP_DIR"

# rclone's config lives in a tempfile for the duration of this script only --
# keeps the R2 secret key out of process argv (visible to anyone on the box
# via `ps`) and out of shell history.
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
# R2 API tokens scoped to "Object Read & Write" on a single bucket (the
# recommended, least-privilege scope) can't call CreateBucket -- without
# this, rclone's default "create if missing" check 403s even though the
# bucket already exists and every actual read/write works fine.
no_check_bucket = true
EOF
chmod 600 "$RCLONE_CONF"

rclone_cmd() {
  docker run --rm \
    -v "${RCLONE_CONF}:/config/rclone/rclone.conf:ro" \
    -v "${TMP_DIR}:/data" \
    rclone/rclone:latest "$@"
}

if ! docker volume inspect "$UPLOADS_VOLUME" >/dev/null 2>&1; then
  echo "error: docker volume '${UPLOADS_VOLUME}' not found -- check UPLOADS_VOLUME in this script" >&2
  exit 1
fi

STAMP="$(date -u +%Y%m%d-%H%M%S)"
DUMP_FILE="postgres-${STAMP}.sql.gz"

echo "==> Dumping Postgres..."
# --clean --if-exists makes the dump safe to replay over an existing
# database (drops each object before recreating it) -- see restore.sh.
$COMPOSE exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
  pg_dump -U "$POSTGRES_USER" --clean --if-exists "$POSTGRES_DB" \
  | gzip > "${TMP_DIR}/${DUMP_FILE}"

echo "==> Uploading dump to R2..."
rclone_cmd copyto "/data/${DUMP_FILE}" "r2:${R2_BUCKET}/postgres/${DUMP_FILE}"

echo "==> Pruning R2 dumps older than 14 days..."
rclone_cmd delete "r2:${R2_BUCKET}/postgres/" --min-age 14d

echo "==> Mirroring uploads volume to R2..."
docker run --rm \
  -v "${RCLONE_CONF}:/config/rclone/rclone.conf:ro" \
  -v "${UPLOADS_VOLUME}:/uploads:ro" \
  rclone/rclone:latest sync /uploads "r2:${R2_BUCKET}/uploads"

echo "==> Pruning local dump cache older than 2 days..."
find "$TMP_DIR" -name '*.sql.gz' -mtime +2 -delete

echo "==> Backup complete: ${DUMP_FILE}"
