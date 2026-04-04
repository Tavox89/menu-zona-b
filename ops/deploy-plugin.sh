#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT_DIR}/ops/deploy-common.sh"

PLUGIN_ROOT="${PLUGIN_ROOT:-$(cd "${ROOT_DIR}/../tavox-menu-api" && pwd)}"
PLUGIN_SLUG="${PLUGIN_SLUG:-tavox-menu-api}"
REMOTE_WP_PATH="${REMOTE_WP_PATH:-/var/www/vhosts/clubsamsve.com/zonabclub.com}"
REMOTE_PLUGIN_DIR="${REMOTE_PLUGIN_DIR:-${REMOTE_WP_PATH}/wp-content/plugins/${PLUGIN_SLUG}}"
REMOTE_PLUGIN_BACKUP_ROOT="${REMOTE_PLUGIN_BACKUP_ROOT:-${REMOTE_WP_PATH}/.zonab-ops/backups/${PLUGIN_SLUG}}"
REMOTE_WEB_GROUP="${REMOTE_WEB_GROUP:-psaserv}"
REMOTE_WEB_OWNER="${REMOTE_WEB_OWNER:-focused-ganguly_m9asfwnlf4}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

ensure_expect
ensure_ssh_password

if [[ ! -x "${PLUGIN_ROOT}/ops/build-plugin-zip.sh" ]]; then
  echo "No existe el build del plugin en ${PLUGIN_ROOT}/ops/build-plugin-zip.sh" >&2
  exit 1
fi

echo "Generando zip limpio del plugin..."
PLUGIN_ZIP="$("${PLUGIN_ROOT}/ops/build-plugin-zip.sh")"

if [[ ! -f "${PLUGIN_ZIP}" ]]; then
  echo "No se generó el zip del plugin: ${PLUGIN_ZIP}" >&2
  exit 1
fi

VERSION="$(sed -n 's/^ \* Version: //p' "${PLUGIN_ROOT}/tavox-menu-api.php" | head -n 1)"
if [[ -z "${VERSION}" ]]; then
  echo "No se pudo resolver la versión del plugin." >&2
  exit 1
fi

REMOTE_ZIP="/tmp/${PLUGIN_SLUG}-${VERSION}.zip"
REMOTE_SCRIPT="$(mktemp -t tavox-plugin-deploy.XXXXXX.sh)"
cleanup() {
  rm -f "${REMOTE_SCRIPT}"
}
trap cleanup EXIT

cat > "${REMOTE_SCRIPT}" <<EOF
#!/usr/bin/env bash
set -euo pipefail

REMOTE_WP_PATH='${REMOTE_WP_PATH}'
REMOTE_PLUGIN_DIR='${REMOTE_PLUGIN_DIR}'
REMOTE_PLUGIN_BACKUP_ROOT='${REMOTE_PLUGIN_BACKUP_ROOT}'
REMOTE_WEB_GROUP='${REMOTE_WEB_GROUP}'
REMOTE_WEB_OWNER='${REMOTE_WEB_OWNER}'
PLUGIN_SLUG='${PLUGIN_SLUG}'
PLUGIN_VERSION='${VERSION}'
REMOTE_ZIP='${REMOTE_ZIP}'
TIMESTAMP='${TIMESTAMP}'

BACKUP_DIR="\${REMOTE_PLUGIN_BACKUP_ROOT}/\${TIMESTAMP}-auto-deploy"
mkdir -p "\${BACKUP_DIR}"

if [[ -d "\${REMOTE_PLUGIN_DIR}" ]]; then
  cp -a "\${REMOTE_PLUGIN_DIR}" "\${BACKUP_DIR}/"
fi

php-zonab -d memory_limit=512M /usr/local/bin/wp \\
  --path="\${REMOTE_WP_PATH}" \\
  --skip-plugins=woocommerce,op-guard-supervisor-tavox \\
  --skip-themes \\
  --exec='define("FS_METHOD","direct");' \\
  plugin install "\${REMOTE_ZIP}" --force --activate

if [[ -d "\${REMOTE_PLUGIN_DIR}" ]]; then
  sudo -n /usr/local/sbin/zonab-pathops chgrp -R "\${REMOTE_WEB_GROUP}" "\${REMOTE_PLUGIN_DIR}"

  find "\${REMOTE_PLUGIN_DIR}" -type d -print0 | while IFS= read -r -d '' d; do
    sudo -n /usr/local/sbin/zonab-pathops chmod 2770 "\$d"
    setfacl -m "u:\${REMOTE_WEB_OWNER}:rwx,u:zonabagent:rwx,g::r-x,o::---" "\$d"
    setfacl -m "d:u:\${REMOTE_WEB_OWNER}:rwx,d:u:zonabagent:rwx,d:g::r-x,d:o::---" "\$d"
  done

  find "\${REMOTE_PLUGIN_DIR}" -type f -print0 | while IFS= read -r -d '' f; do
    chmod 660 "\$f"
    setfacl -m "u:\${REMOTE_WEB_OWNER}:rwx,u:zonabagent:rwx,g::r--,o::---" "\$f"
  done
fi

php-zonab -d memory_limit=512M /usr/local/bin/wp \\
  --path="\${REMOTE_WP_PATH}" \\
  --skip-plugins=woocommerce,op-guard-supervisor-tavox \\
  --skip-themes \\
  --exec='define("FS_METHOD","direct");' \\
  plugin get "\${PLUGIN_SLUG}" --fields=name,status,version

stat -c '%A %U %G %n' "\${REMOTE_PLUGIN_DIR}" "\${REMOTE_PLUGIN_DIR}/tavox-menu-api.php"
EOF

chmod 700 "${REMOTE_SCRIPT}"

echo "Subiendo zip del plugin..."
run_scp "${PLUGIN_ZIP}" "${REMOTE_ZIP}"

echo "Instalando plugin en producción..."
run_ssh_script "${REMOTE_SCRIPT}"

echo "Deploy plugin OK: ${PLUGIN_SLUG} ${VERSION}"
