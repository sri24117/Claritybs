#!/usr/bin/env bash
# Needs: age (apt install age), rclone configured with a remote named r2,
# AGE_PUBKEY exported in the environment (e.g. in /etc/environment or a root crontab).
# Cron (daily 02:30): 30 2 * * * /opt/claritybs/scripts/backup.sh >> /var/log/claritybs-backup.log 2>&1
set -euo pipefail

cd /opt/claritybs
set -a; source .env; set +a

TS=$(date +%F-%H%M)

docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip | age -r "$AGE_PUBKEY" > "/tmp/db-$TS.sql.gz.age"

tar czf - /data/reports 2>/dev/null | age -r "$AGE_PUBKEY" > "/tmp/reports-$TS.tgz.age"

rclone copy "/tmp/db-$TS.sql.gz.age" r2:claritybs-backups/
rclone copy "/tmp/reports-$TS.tgz.age" r2:claritybs-backups/

rm -f "/tmp/db-$TS.sql.gz.age" "/tmp/reports-$TS.tgz.age"

echo "$(date -Is) backup uploaded: db-$TS reports-$TS"
# Test a restore once a month. An untested backup is not a backup.
