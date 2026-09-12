#!/usr/bin/env bash
# Swap the staged build into place and restart, in that order and together.
#
# A user unit, so no sudo anywhere in here.
set -euo pipefail

cd "$(dirname "$0")/.."

. "$HOME/bin/deploy-lib.sh"
LIVE="$PUBLIC_ROOT/context-viewer"

[[ $EUID -ne 0 ]] || { echo "Run this as carlos, not with sudo." >&2; exit 1; }
[[ -d "$LIVE.new" ]] || { echo "No $LIVE.new. Run ops/build.sh first." >&2; exit 1; }

assert_unit_workdir context-viewer "$LIVE" --user

echo "==> swapping"
rm -rf "$LIVE.old"
[[ -d "$LIVE" ]] && mv "$LIVE" "$LIVE.old"
mv "$LIVE.new" "$LIVE"

echo "==> restarting"
systemctl --user restart context-viewer
sleep 2
systemctl --user is-active --quiet context-viewer || {
  journalctl --user -u context-viewer -n 30 --no-pager; exit 1; }

echo "==> checking"
# /_ctx/login rather than /: the root redirects to it when signed out, and a
# 307 is indistinguishable from a broken build. The login page is a real render
# that touches the app, its CSS and _data.
ok=1
for url in "/_ctx/login" "/"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:3064$url")
  printf '    %-46s %s\n' "$url" "$code"
  [[ "$code" =~ ^(200|307)$ ]] || ok=0
done

if [[ $ok -eq 1 ]]; then
  rm -rf "$LIVE.old"
  echo "Released."
else
  echo "Something is wrong. $LIVE.old kept; roll back with:" >&2
  echo "  rm -rf $LIVE && mv $LIVE.old $LIVE && systemctl --user restart context-viewer" >&2
  exit 1
fi
