#!/usr/bin/env bash
set -euo pipefail

SSH_TARGET="${SSH_TARGET:-zonabagent@74.208.41.95}"

ensure_expect() {
  if ! command -v expect >/dev/null 2>&1; then
    echo "Falta 'expect' en esta máquina. Instálalo para poder automatizar SSH/SCP con password." >&2
    exit 1
  fi
}

ensure_ssh_password() {
  if [[ -z "${SSH_PASSWORD:-}" ]]; then
    read -rsp "Password SSH para ${SSH_TARGET}: " SSH_PASSWORD
    echo
    export SSH_PASSWORD
  fi
}

run_scp() {
  local source_path="$1"
  local remote_path="$2"

  expect <<EOF
set timeout -1
spawn /bin/sh -lc "scp -o StrictHostKeyChecking=no '$source_path' '${SSH_TARGET}:$remote_path'"
expect {
  "*assword:" { send -- "$SSH_PASSWORD\r"; exp_continue }
  eof
}
catch wait result
exit [lindex \$result 3]
EOF
}

run_ssh_script() {
  local script_path="$1"

  expect <<EOF
set timeout -1
spawn /bin/sh -lc "ssh -o StrictHostKeyChecking=no '${SSH_TARGET}' 'bash -s' < '$script_path'"
expect {
  "*assword:" { send -- "$SSH_PASSWORD\r"; exp_continue }
  eof
}
catch wait result
exit [lindex \$result 3]
EOF
}
