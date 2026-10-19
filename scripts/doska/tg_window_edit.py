"""Edit the three window posts in place: text, inline buttons, and a branded link preview on the pinned one.
Usage: tg_window_edit.py <token file> <posts folder>"""
import json
import os
import re
import sys
import urllib.parse
from pathlib import Path

from tg_post import api

CHANNEL = "@yakkabog_rida"
BOT = "https://t.me/rida_billborad_bot"
IDS = {"ertaga": 10, "QT": 11, "TQ": 12}
SITE = "https://ridaone.uz/"
INVITES = Path(os.environ.get("DOSKA_DATA", "data")) / "invites.json"  # named invite links, kept out of the repo
SHARE_TEXT = "Yakkabogʻ, Shahrisabz, Kitob va Toshkent oʻrtasida hozir yoʻlga chiqayotgan mashinalar. Rida doskasi."


def share_url():
    """Native share sheet with a prefilled text. The named invite link makes every join from a share countable."""
    link = f"https://t.me/{CHANNEL[1:]}"
    try:
        link = json.loads(INVITES.read_text(encoding="utf-8")).get("Ulashish", link)
    except OSError:
        pass
    return "https://t.me/share/url?" + urllib.parse.urlencode({"url": link, "text": SHARE_TEXT})


def buttons(name):
    nav = {"ertaga": [("Toshkentga ↓", IDS["QT"]), ("Toshkentdan ↓", IDS["TQ"])],
           "QT": [("Ertaga ↑", IDS["ertaga"]), ("Toshkentdan ↓", IDS["TQ"])],
           "TQ": [("Ertaga ↑", IDS["ertaga"]), ("Toshkentga ↑", IDS["QT"])]}[name]
    rows = [[{"text": "🚗 Haydovchiman · eʼlon yuborish", "url": f"{BOT}?start=driver"}],
            [{"text": "📤 Doʻstga yuborish", "url": share_url()}],
            [{"text": t, "url": f"https://t.me/{CHANNEL[1:]}/{mid}"} for t, mid in nav]]
    return {"inline_keyboard": rows}


def main():
    token = Path(sys.argv[1]).read_text(encoding="utf-8").strip()
    for path in sorted(Path(sys.argv[2]).glob("*.html")):
        name = path.stem.split("_", 1)[1]
        text = re.sub(r"\{ID_(\w+)\}", lambda m: str(IDS[m[1]]), path.read_text(encoding="utf-8"))
        preview = {"is_disabled": True}
        r = api(token, "editMessageText", {"chat_id": CHANNEL, "message_id": IDS[name], "text": text, "parse_mode": "HTML",
                                           "link_preview_options": preview, "reply_markup": buttons(name)})
        print(f"{name} -> {IDS[name]}:", "ok" if r.get("ok") else r.get("description"))


if __name__ == "__main__":
    main()
