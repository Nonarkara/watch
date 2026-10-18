#!/bin/bash
# Time Pop live-attention watchdog for the M3. Light: one curl every 5 min,
# no Node, no browser. Alerts only after the problem has lasted more than 10
# minutes, sends one alert per incident and one recovery note.
#
# Alert hook: set WATCH_ALERT_CMD to a command that takes the message as $1
# (for example the existing Telegram notifier). Without it, alerts go to the log.
URL="${WATCH_HEALTH_URL:-https://watch.nonarkara.org/live/health.json}"
STATE_DIR="${WATCH_STATE_DIR:-$HOME/Library/Application Support/watch-live}"
GRACE="${WATCH_ALERT_AFTER_S:-600}"
mkdir -p "$STATE_DIR"
STATE="$STATE_DIR/state"
LOG="$STATE_DIR/health.log"
now=$(date +%s)

body=$(/usr/bin/curl -sS -m 20 "$URL" 2>&1)
status=$(printf '%s' "$body" | sed -n 's/.*"status":"\([a-z_]*\)".*/\1/p' | head -1)
[ -n "$status" ] || status="unreachable"

first_bad=""; alerted=""
[ -f "$STATE" ] && . "$STATE"

alert() {
  echo "$(date '+%F %T %Z') ALERT $1" >> "$LOG"
  if [ -n "${WATCH_ALERT_CMD:-}" ]; then "$WATCH_ALERT_CMD" "$1" || true; fi
}

if [ "$status" = "ok" ]; then
  if [ -n "$alerted" ]; then alert "Time Pop live attention recovered (status ok)"; fi
  printf 'first_bad=""\nalerted=""\n' > "$STATE"
  echo "$(date '+%F %T %Z') ok" >> "$LOG"
  exit 0
fi

[ -n "$first_bad" ] || first_bad=$now
if [ -z "$alerted" ] && [ $((now - first_bad)) -gt "$GRACE" ]; then
  alert "Time Pop live attention is '$status' for $(( (now - first_bad) / 60 )) min: $URL"
  alerted=1
fi
printf 'first_bad="%s"\nalerted="%s"\n' "$first_bad" "$alerted" > "$STATE"
echo "$(date '+%F %T %Z') $status" >> "$LOG"
