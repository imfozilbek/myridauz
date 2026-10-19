#!/bin/bash
# Samples the public member/online counter of a group every 5 minutes into online.csv in the data folder.
# Usage: sampler.sh <group username>   (data folder: $DOSKA_DATA, default ./data)
d="${DOSKA_DATA:-./data}"
f="$d/online.csv"
mkdir -p "$d"
[ -f "$f" ] || echo "время_Ташкент,участников,онлайн" > "$f"
while true; do
  line=$(curl -sS --max-time 15 "https://t.me/$1" | grep -oE 'tgme_page_extra">[^<]*' | sed 's/.*">//')
  m=$(echo "$line" | grep -oE '^[0-9 ]+' | tr -d ' ')
  o=$(echo "$line" | grep -oE '[0-9 ]+ online' | tr -d ' ' | sed 's/online//')
  if [ -n "$o" ]; then
    echo "$(TZ=Asia/Tashkent date '+%d.%m %H:%M'),$m,$o" >> "$f"
  fi
  sleep 300
done
