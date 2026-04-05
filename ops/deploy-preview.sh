#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT_DIR}/ops/deploy-common.sh"

DIST_DIR="${ROOT_DIR}/dist"
PUBLIC_DIR="${ROOT_DIR}/public"
SSH_TARGET="${SSH_TARGET:-zonabagent@74.208.41.95}"
REMOTE_DOCROOT="${REMOTE_DOCROOT:-/var/www/vhosts/clubsamsve.com/menu.zonabclub.com}"
REMOTE_PUBLIC_URL="${REMOTE_PUBLIC_URL:-https://menu.zonabclub.com}"
REMOTE_MAIN_URL="${REMOTE_MAIN_URL:-https://zonabclub.com}"
REMOTE_GROUP="${REMOTE_GROUP:-psaserv}"
REMOTE_OWNER="${REMOTE_OWNER:-focused-ganguly_m9asfwnlf4}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TMP_TGZ="$(mktemp -t menu-zonab-preview.XXXXXX.tgz)"
TMP_STAGE_DIR="$(mktemp -d -t menu-zonab-preview-stage.XXXXXX)"
REMOTE_UPLOAD_TGZ="/tmp/menu-zonab-preview-${TIMESTAMP}.tgz"
REMOTE_BACKUP_DIR="${REMOTE_DOCROOT}/.zonab-ops/backups/frontend/${TIMESTAMP}"
REMOTE_SCRIPT="$(mktemp -t menu-zonab-preview.XXXXXX.sh)"

cleanup() {
  rm -f "${TMP_TGZ}"
  rm -rf "${TMP_STAGE_DIR}"
  rm -f "${REMOTE_SCRIPT}"
}
trap cleanup EXIT

ensure_expect
ensure_ssh_password

if [[ ! -f "${DIST_DIR}/index.html" ]]; then
  echo "No existe ${DIST_DIR}/index.html. Corre primero npm run build." >&2
  exit 1
fi

ASSET_RELATIVE_PATH="$(
  sed -nE 's#.*(assets/index-[^"]+\.js).*#\1#p' "${DIST_DIR}/index.html" | head -n 1
)"

if [[ -z "${ASSET_RELATIVE_PATH}" ]]; then
  echo "No se pudo resolver el asset JS principal desde dist/index.html" >&2
  exit 1
fi

mkdir -p "${ROOT_DIR}/ops"

echo "Empaquetando dist..."
cp -R "${DIST_DIR}/." "${TMP_STAGE_DIR}/"
if [[ -f "${PUBLIC_DIR}/.htaccess" ]]; then
  cp "${PUBLIC_DIR}/.htaccess" "${TMP_STAGE_DIR}/.htaccess"
fi
if command -v xattr >/dev/null 2>&1; then
  xattr -cr "${TMP_STAGE_DIR}" || true
fi
COPYFILE_DISABLE=1 tar \
  --exclude='.DS_Store' \
  --exclude='._*' \
  -czf "${TMP_TGZ}" -C "${TMP_STAGE_DIR}" .

cat > "${REMOTE_SCRIPT}" <<EOF
#!/usr/bin/env bash
set -euo pipefail

REMOTE_DOCROOT='${REMOTE_DOCROOT}'
REMOTE_GROUP='${REMOTE_GROUP}'
REMOTE_OWNER='${REMOTE_OWNER}'
REMOTE_UPLOAD_TGZ='${REMOTE_UPLOAD_TGZ}'
REMOTE_BACKUP_DIR='${REMOTE_BACKUP_DIR}'
TIMESTAMP='${TIMESTAMP}'

mkdir -p "\${REMOTE_BACKUP_DIR}"
tar --exclude='./.zonab-ops' -czf "\${REMOTE_BACKUP_DIR}/predeploy-preview-root.tgz" -C "\${REMOTE_DOCROOT}" .

sudo -n /usr/local/sbin/zonab-pathops setfacl -m "u:zonabagent:rwx" "\${REMOTE_DOCROOT}"

for tree in "\${REMOTE_DOCROOT}/assets" "\${REMOTE_DOCROOT}/pwa"; do
  if [[ -e "\${tree}" ]]; then
    sudo -n /usr/local/sbin/zonab-pathops setfacl -R -m "u:zonabagent:rwx" "\${tree}"
    rm -rf "\${tree}"
  fi
done

for file in \\
  "\${REMOTE_DOCROOT}/index.html" \\
  "\${REMOTE_DOCROOT}/manifest.json" \\
  "\${REMOTE_DOCROOT}/manifest.webmanifest" \\
  "\${REMOTE_DOCROOT}/sw.js" \\
  "\${REMOTE_DOCROOT}/.htaccess" \\
  "\${REMOTE_DOCROOT}/apple-touch-icon.png" \\
  "\${REMOTE_DOCROOT}/zonab.png" \\
  "\${REMOTE_DOCROOT}/zonab2.png" \\
  "\${REMOTE_DOCROOT}/vite.svg" \\
  "\${REMOTE_DOCROOT}/logoformalzonab.png" \\
  "\${REMOTE_DOCROOT}/logoisola.png" \\
  "\${REMOTE_DOCROOT}/noImagen.png"; do
  if [[ -f "\${file}" ]]; then
    sudo -n /usr/local/sbin/zonab-pathops setfacl -m "u:zonabagent:rw" "\${file}"
    rm -f "\${file}"
  fi
done

tar --no-same-owner --no-same-permissions --no-overwrite-dir -xzf "\${REMOTE_UPLOAD_TGZ}" -C "\${REMOTE_DOCROOT}"
rm -f "\${REMOTE_UPLOAD_TGZ}"

for tree in "\${REMOTE_DOCROOT}/assets" "\${REMOTE_DOCROOT}/pwa"; do
  if [[ -d "\${tree}" ]]; then
    sudo -n /usr/local/sbin/zonab-pathops chgrp -R "\${REMOTE_GROUP}" "\${tree}"

    find "\${tree}" -type d -print0 | while IFS= read -r -d '' d; do
      sudo -n /usr/local/sbin/zonab-pathops chmod 755 "\$d"
      setfacl -m "u:\${REMOTE_OWNER}:rwx,u:zonabagent:rwx,g::r-x,o::r-x" "\$d"
      setfacl -m "d:u:\${REMOTE_OWNER}:rwx,d:u:zonabagent:rwx,d:g::r-x,d:o::r-x" "\$d"
    done

    find "\${tree}" -type f -print0 | while IFS= read -r -d '' f; do
      chmod 644 "\$f"
      setfacl -m "u:\${REMOTE_OWNER}:rw,u:zonabagent:rw,g::r,o::r" "\$f"
    done
  fi
done

for file in \\
  "\${REMOTE_DOCROOT}/index.html" \\
  "\${REMOTE_DOCROOT}/manifest.json" \\
  "\${REMOTE_DOCROOT}/manifest.webmanifest" \\
  "\${REMOTE_DOCROOT}/sw.js" \\
  "\${REMOTE_DOCROOT}/.htaccess" \\
  "\${REMOTE_DOCROOT}/apple-touch-icon.png" \\
  "\${REMOTE_DOCROOT}/zonab.png" \\
  "\${REMOTE_DOCROOT}/zonab2.png" \\
  "\${REMOTE_DOCROOT}/vite.svg" \\
  "\${REMOTE_DOCROOT}/logoformalzonab.png" \\
  "\${REMOTE_DOCROOT}/logoisola.png" \\
  "\${REMOTE_DOCROOT}/noImagen.png"; do
  if [[ -f "\${file}" ]]; then
    sudo -n /usr/local/sbin/zonab-pathops chgrp "\${REMOTE_GROUP}" "\${file}"
    chmod 644 "\${file}"
    setfacl -m "u:\${REMOTE_OWNER}:rw,u:zonabagent:rw,g::r,o::r" "\${file}"
  fi
done

find "\${REMOTE_DOCROOT}" -maxdepth 1 -name '._*' -type f -delete || true
find "\${REMOTE_DOCROOT}" -maxdepth 1 -name '.DS_Store' -type f -delete || true
EOF

chmod 700 "${REMOTE_SCRIPT}"

echo "Subiendo build..."
run_scp "${TMP_TGZ}" "${REMOTE_UPLOAD_TGZ}"

echo "Desplegando y normalizando permisos..."
run_ssh_script "${REMOTE_SCRIPT}"

echo "Validando index público..."
INDEX_HTML="$(curl -fsSL "${REMOTE_PUBLIC_URL}/")"
if ! grep -q "${ASSET_RELATIVE_PATH}" <<<"${INDEX_HTML}"; then
  echo "El index público no apunta al asset esperado: ${ASSET_RELATIVE_PATH}" >&2
  exit 1
fi

echo "Validando asset JS público..."
ASSET_HEADERS="$(curl -fsSI "${REMOTE_PUBLIC_URL}/${ASSET_RELATIVE_PATH}")"
if ! grep -qE '^HTTP/.* 200' <<<"${ASSET_HEADERS}"; then
  echo "El asset JS no respondió HTTP 200" >&2
  printf '%s\n' "${ASSET_HEADERS}" >&2
  exit 1
fi

if ! grep -qi 'content-type: .*javascript' <<<"${ASSET_HEADERS}"; then
  echo "El asset JS no respondió con MIME javascript" >&2
  printf '%s\n' "${ASSET_HEADERS}" >&2
  exit 1
fi

echo "Validando asset JS en dominio principal..."
MAIN_ASSET_HEADERS="$(curl -fsSI "${REMOTE_MAIN_URL}/${ASSET_RELATIVE_PATH}")"
if ! grep -qE '^HTTP/.* 200' <<<"${MAIN_ASSET_HEADERS}"; then
  echo "El asset JS en el dominio principal no respondió HTTP 200" >&2
  printf '%s\n' "${MAIN_ASSET_HEADERS}" >&2
  exit 1
fi

if ! grep -qi 'content-type: .*javascript' <<<"${MAIN_ASSET_HEADERS}"; then
  echo "El asset JS en el dominio principal no respondió con MIME javascript" >&2
  printf '%s\n' "${MAIN_ASSET_HEADERS}" >&2
  exit 1
fi

echo "Validando icono PWA en dominio principal..."
MAIN_PWA_HEADERS="$(curl -fsSI "${REMOTE_MAIN_URL}/pwa/zonab-192.png")"
if ! grep -qE '^HTTP/.* 200' <<<"${MAIN_PWA_HEADERS}"; then
  echo "El icono PWA del dominio principal no respondió HTTP 200" >&2
  printf '%s\n' "${MAIN_PWA_HEADERS}" >&2
  exit 1
fi

if ! grep -qi 'content-type: image/png' <<<"${MAIN_PWA_HEADERS}"; then
  echo "El icono PWA del dominio principal no respondió como image/png" >&2
  printf '%s\n' "${MAIN_PWA_HEADERS}" >&2
  exit 1
fi

echo "Validando manifest en dominio principal..."
MAIN_MANIFEST_HEADERS="$(curl -fsSI "${REMOTE_MAIN_URL}/manifest.json")"
if ! grep -qE '^HTTP/.* 200' <<<"${MAIN_MANIFEST_HEADERS}"; then
  echo "El manifest del dominio principal no respondió HTTP 200" >&2
  printf '%s\n' "${MAIN_MANIFEST_HEADERS}" >&2
  exit 1
fi

if ! grep -qi 'content-type: .*json' <<<"${MAIN_MANIFEST_HEADERS}"; then
  echo "El manifest del dominio principal no respondió con MIME JSON" >&2
  printf '%s\n' "${MAIN_MANIFEST_HEADERS}" >&2
  exit 1
fi

echo "Validando rutas SPA del preview..."
for route in /equipo /mesa /mesa/menu; do
  ROUTE_HEADERS="$(curl -fsSI "${REMOTE_PUBLIC_URL}${route}")"
  if ! grep -qE '^HTTP/.* 200' <<<"${ROUTE_HEADERS}"; then
    echo "La ruta SPA ${REMOTE_PUBLIC_URL}${route} no respondió HTTP 200" >&2
    printf '%s\n' "${ROUTE_HEADERS}" >&2
    exit 1
  fi
done

echo "Deploy OK:"
echo "  Preview: ${REMOTE_PUBLIC_URL}/${ASSET_RELATIVE_PATH}"
echo "  Principal: ${REMOTE_MAIN_URL}/${ASSET_RELATIVE_PATH}"
