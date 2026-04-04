#!/usr/bin/env bash
set -euo pipefail

TABLE_KEY="${TABLE_KEY:-1770219338-4aengdjuovbyxlhkd18j}"
SITE_ROOT="${SITE_ROOT:-/var/www/vhosts/clubsamsve.com/zonabclub.com}"
SYSTEM_ROOT="${SYSTEM_ROOT:-/var/www/vhosts/system/zonabclub.com}"
REALTIME_HEALTH_URL="${REALTIME_HEALTH_URL:-https://realtime.zonabclub.com/health}"
MAIN_URL="${MAIN_URL:-https://zonabclub.com}"
PREVIEW_URL="${PREVIEW_URL:-https://menu.zonabclub.com}"
OUT_DIR="${OUT_DIR:-${SITE_ROOT}/.zonab-ops/logs}"
OUT_FILE="${OUT_FILE:-${OUT_DIR}/observe-latest.log}"
HISTORY_FILE="${HISTORY_FILE:-${OUT_DIR}/observe-history.log}"
FPM_POOL="${FPM_POOL:-zonabclub.com}"
SLOWLOG_PATH="${SLOWLOG_PATH:-/var/log/plesk-php83-zonabclub.com.slow.log}"
ACCESS_LOG_PATH="${ACCESS_LOG_PATH:-${SYSTEM_ROOT}/logs/access_ssl_log}"

mkdir -p "${OUT_DIR}"

tmp_file="$(mktemp)"
trap 'rm -f "${tmp_file}"' EXIT

curl_json_field() {
  local url="$1"
  curl -ksS "${url}" | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("table_token",""))'
}

{
  echo "=== Zona B observe $(date --iso-8601=seconds) ==="
  echo "host=$(hostname)"
  echo

  curl -ksS -L -o /dev/null -w 'qr total=%{time_total} start=%{time_starttransfer} redirect=%{time_redirect} code=%{http_code}\n' \
    "${MAIN_URL}/wp-content/plugins/woocommerce-openpos/customer/index.php?key=${TABLE_KEY}"

  table_session_body="$(curl -ksS "${MAIN_URL}/wp-json/tavox/v1/table/session?key=${TABLE_KEY}")"
  table_token="$(printf '%s' "${table_session_body}" | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("table_token",""))')"

  printf '%s\n' "${table_session_body}" | sed -n '1,1p'
  if [[ -n "${table_token}" ]]; then
    curl -ksS -o /dev/null -w 'table/context total=%{time_total} start=%{time_starttransfer} code=%{http_code}\n' \
      "${MAIN_URL}/wp-json/tavox/v1/table/context?table_token=${table_token}"
    curl -ksS -o /dev/null -w 'table/messages total=%{time_total} start=%{time_starttransfer} code=%{http_code}\n' \
      "${MAIN_URL}/wp-json/tavox/v1/table/messages?table_token=${table_token}"
  fi

  curl -ksS -o /dev/null -w 'main /equipo/pedidos total=%{time_total} start=%{time_starttransfer} code=%{http_code}\n' \
    "${MAIN_URL}/equipo/pedidos"
  curl -ksS -o /dev/null -w 'preview /equipo total=%{time_total} start=%{time_starttransfer} code=%{http_code}\n' \
    "${PREVIEW_URL}/equipo"
  curl -ksS -o /dev/null -w 'realtime total=%{time_total} start=%{time_starttransfer} code=%{http_code}\n' \
    "${REALTIME_HEALTH_URL}"

  echo
  echo "-- hot endpoints last 2000 lines --"
  python3 - "${ACCESS_LOG_PATH}" <<'PY'
import sys
from collections import Counter
from pathlib import Path
p = Path(sys.argv[1])
lines = p.read_text(errors='ignore').splitlines()[-2000:]
ctr = Counter()
for line in lines:
    parts = line.split('"')
    if len(parts) > 1:
        req = parts[1].split()
        if len(req) >= 2:
            path = req[1].split('?')[0]
            if path in ('/index.php', '/wp-admin/admin-ajax.php'):
                ctr[path] += 1
            elif path.startswith('/wp-json/tavox/v1/table/messages'):
                ctr['/wp-json/tavox/v1/table/messages'] += 1
for key, value in ctr.most_common():
    print(f'{value} {key}')
PY

  echo
  echo "-- active php-fpm workers --"
  ps -eo pid,etime,pcpu,pmem,rss,cmd | grep "php-fpm: pool ${FPM_POOL}" | grep -v grep || true

  echo
  echo "-- slowlog tail --"
  tail -n 30 "${SLOWLOG_PATH}" 2>/dev/null || true
} > "${tmp_file}"

cat "${tmp_file}" > "${OUT_FILE}"
printf '[%s] ' "$(date --iso-8601=seconds)" >> "${HISTORY_FILE}"
grep -E 'qr total=|table/context total=|table/messages total=|main /equipo/pedidos|preview /equipo|realtime total=' "${tmp_file}" \
  | paste -sd ' | ' - >> "${HISTORY_FILE}" || true
echo >> "${HISTORY_FILE}"
