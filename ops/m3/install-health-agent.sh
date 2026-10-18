#!/bin/bash
# Installs the watch-live watchdog as a LaunchAgent on the M3. Run on the M3,
# ONLY after Non says go, and only after /live/health.json is live (otherwise it
# will report "not_connected" and alert after 10 minutes).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p "$HOME/bin" "$HOME/Library/Logs"
install -m 0755 watch-live-health.sh "$HOME/bin/watch-live-health.sh"
PLIST="$HOME/Library/LaunchAgents/org.nonarkara.watch-live-health.plist"
sed "s#__HOME__#$HOME#g" org.nonarkara.watch-live-health.plist > "$PLIST"
plutil -lint "$PLIST"
launchctl bootout "gui/$(id -u)/org.nonarkara.watch-live-health" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "loaded; log at $HOME/Library/Application Support/watch-live/health.log"
