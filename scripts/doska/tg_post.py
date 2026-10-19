"""Publish prepared post files to a Telegram channel via Bot API. Token is read from a file, never printed."""
import json
import subprocess
import sys
from pathlib import Path


def api(token, method, payload):
    out = subprocess.run(["curl", "-sS", "--max-time", "30", f"https://api.telegram.org/bot{token}/{method}",
                          "-H", "Content-Type: application/json", "-d", json.dumps(payload)],
                         capture_output=True, text=True, check=False)
    try:
        return json.loads(out.stdout)
    except json.JSONDecodeError:
        return {"ok": False, "description": out.stdout[:200] or out.stderr[:200]}


def main():
    token = Path(sys.argv[1]).read_text(encoding="utf-8").strip()
    channel, folder = sys.argv[2], Path(sys.argv[3])
    pin_name = sys.argv[4] if len(sys.argv) > 4 else ""
    for path in sorted(folder.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        r = api(token, "sendMessage", {"chat_id": channel, "text": text, "parse_mode": "HTML",
                                       "disable_notification": True, "link_preview_options": {"is_disabled": True}})
        if not r.get("ok"):
            print(f"{path.stem}: ОШИБКА {r.get('description')}")
            continue
        mid = r["result"]["message_id"]
        print(f"{path.stem}: https://t.me/{channel.lstrip('@')}/{mid}")
        if path.stem == pin_name:
            p = api(token, "pinChatMessage", {"chat_id": channel, "message_id": mid, "disable_notification": True})
            print(f"  закреп: {'да' if p.get('ok') else p.get('description')}")


if __name__ == "__main__":
    main()
