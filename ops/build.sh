#!/usr/bin/env bash
# Build the viewer and stage ~/public/context-viewer.new.
#
# Nothing goes live here. ops/release.sh does the swap and the restart, in that
# order and together: `next start`'s successor serves /_next/static straight off
# the deploy directory, so renaming it under a running process leaves the live
# site 404ing every stylesheet until it restarts.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"

. "$HOME/bin/deploy-lib.sh"
STAGE="$PUBLIC_ROOT/context-viewer.new"

echo "==> installing"
npm ci

echo "==> building"
npm run build

echo "==> staging $STAGE"
rm -rf "$STAGE"
mkdir -p "$STAGE"

# The standalone bundle: server.js plus its traced dependencies.
cp -a .next/standalone/. "$STAGE/"

# Static assets and public/ are not traced into standalone and have to come
# along by hand. Copy the *contents* (dir/.) into an existing target: Next puts
# its own stub public/ inside standalone, so `cp -a public "$STAGE/public"`
# lands the real one at public/public and every asset 404s while the files sit
# plainly on disk.
mkdir -p "$STAGE/.next/static" "$STAGE/public"
cp -a .next/static/. "$STAGE/.next/static/"
cp -a public/. "$STAGE/public/"

# _data is deliberately NOT copied. The session secret, the password hash, the
# audit log and the trash live in the source tree and are pinned by DATA_DIR in
# the unit. Staging them here would mean a release silently reset the password
# and dropped the audit trail.

echo "==> done"
du -sh "$STAGE"
echo
echo "Staged. Nothing is live until:"
echo "  ./ops/release.sh"
