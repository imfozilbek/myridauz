"""Named invite links for the channel: Telegram counts joins per link, so each promo source gets its own.
Usage: tg_invites.py <token file> <json file to keep the links in>"""
import json
import sys
from pathlib import Path

from tg_post import api

CHANNEL = "@yakkabog_rida"
NAMES = ["Ulashish", "Salon kartasi", "Mahalliy kanal", "Reklama"]


def main():
    token = Path(sys.argv[1]).read_text(encoding="utf-8").strip()
    me = api(token, "getMe", {})
    member = api(token, "getChatMember", {"chat_id": CHANNEL, "user_id": me["result"]["id"]})
    rights = {k: v for k, v in member.get("result", {}).items() if k.startswith("can_") and v}
    print("права бота:", ", ".join(sorted(rights)) or member.get("description"))
    out = Path(sys.argv[2])
    links = json.loads(out.read_text(encoding="utf-8")) if out.exists() else {}
    for name in NAMES:
        if name in links:
            continue
        r = api(token, "createChatInviteLink", {"chat_id": CHANNEL, "name": name})
        if r.get("ok"):
            links[name] = r["result"]["invite_link"]
        print(f"{name}:", links.get(name, r.get("description")))
    out.write_text(json.dumps(links, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
