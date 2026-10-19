"""Test responder for the board bot: Start, the 📞 deep links with the driver's own card, a driver's message.
Cards are built from the group export in memory and never written to disk (owner's decision after legal advice,
19.10.2026). Usage: tg_bot.py <token file> <log csv> [export folder; without it, or for a chat outside tg/allow.txt, every card shows a sample]"""
import csv
import datetime as dt
import html
import json
import os
import subprocess
import sys
import time
from collections import defaultdict
from pathlib import Path

CHANNEL = "yakkabog_rida"
POST = {"QT": 11, "TQ": 12}
SAMPLE = {"text": "Yakkabogʻdan Toshkentga soat 7 da ketamiz. Cobalt, 3 ta joy bor. Uydan olib ketamiz.",
          "phone": "+998900000000", "car": "Cobalt (sinov)", "post": "TQ"}
STALE, LIMIT, HOUR = 15 * 60, 10, 3600
TEXT = {"start": "Bu Rida doskasining boti (sinov).\nHaydovchi raqamini koʻrish uchun doskadagi 📞 ni bosing.",
        "driver": ("Haydovchi uchun (sinov).\nEʼloningizni bitta xabarda yozing: qayerdan, qayerga, soat nechida, "
                   "mashina, nechta joy, raqam.\n\nMisol: Yakkabogʻdan Toshkentga, soat 7 da, Cobalt, 3 joy, 90 123 45 67"),
        "driver_ok": "Qabul qilindi (sinov). Doskaga chiqarish hali ulanmagan.",
        "card": "<b>Haydovchi eʼloni</b>\n<blockquote>{text}</blockquote>\n\nQoʻngʻiroq qilganda <b>«Rida orqali»</b> deb ayting.",
        "no_phone": "<b>Haydovchi eʼloni</b>\n<blockquote>{text}</blockquote>\n\nBu eʼlonda haydovchi raqam yozmagan.",
        "old": "Bu eʼlon eskirgan. Doskadagi yangi 📞 ni bosing.",
        "limit": "Bir soatda 10 ta raqam yetarli. Keyinroq urinib koʻring.",
        "other": "Raqamni koʻrish uchun doskadagi 📞 ni bosing."}
BOARD = {"inline_keyboard": [[{"text": "Doskani ochish", "url": f"https://t.me/{CHANNEL}"}]]}
ALLOW = Path(os.environ.get("DOSKA_DATA", "data")) / "allow.txt"  # test participants' chat ids: only they get real cards


def allowed():
    try:
        return {int(x) for x in ALLOW.read_text(encoding="utf-8").split()}
    except (OSError, ValueError):
        return set()


def cards_from_export(folder):
    """The same pipeline that built the posts, so every 📞 link id maps to the same car."""
    import rida_doska as D
    import rida_oynalar as O
    from rida_tahlil import load, build
    rows, _ = build(load(folder))
    now = D.P(D.OPEN[4])
    trips, _ = D.collect(rows, now)
    g = {s: O.grouped(trips, now, s) for s in POST}
    return {f"t{i}": {"text": r["text"], "phone": r["phones"][0] if r["phones"] else "", "car": r["car"], "post": s}
            for s in POST for items in g[s].values() for b, r, i in items}


def call(token, method, payload, max_time=30):
    out = subprocess.run(["curl", "-sS", "--max-time", str(max_time), f"https://api.telegram.org/bot{token}/{method}",
                          "-H", "Content-Type: application/json", "-d", json.dumps(payload)],
                         capture_output=True, text=True, check=False)
    try:
        return json.loads(out.stdout)
    except json.JSONDecodeError:
        return {"ok": False, "description": (out.stdout or out.stderr)[:200]}


def paced(token, method, payload):
    """Telegram allows about one message per second to one chat: wait, and on 429 wait as told and retry once."""
    time.sleep(1)
    r = call(token, method, payload)
    if not r.get("ok") and r.get("parameters", {}).get("retry_after"):
        time.sleep(min(r["parameters"]["retry_after"], 300))
        r = call(token, method, payload)
    return r


def send(token, chat, text, markup=None):
    payload = {"chat_id": chat, "text": text, "parse_mode": "HTML", "link_preview_options": {"is_disabled": True}}
    if markup:
        payload["reply_markup"] = markup
    return paced(token, "sendMessage", payload)


def card(token, chat, c):
    """The driver's own words, the number as a copy button and as a contact, a way back to the board."""
    if not c["phone"]:
        return send(token, chat, TEXT["no_phone"].format(text=html.escape(c["text"])), BOARD)
    markup = {"inline_keyboard": [[{"text": "📋 Raqamni nusxalash", "copy_text": {"text": c["phone"]}}],
                                  [{"text": "Doskaga qaytish", "url": f"https://t.me/{CHANNEL}/{POST[c['post']]}"}]]}
    send(token, chat, TEXT["card"].format(text=html.escape(c["text"])), markup)
    return paced(token, "sendContact", {"chat_id": chat, "phone_number": c["phone"], "first_name": "Rida haydovchi",
                                         "last_name": c["car"] or ""})


def handle(token, m, cards, state, taps):
    chat, text = m["chat"]["id"], (m.get("text") or "").strip()
    if text.startswith("/start"):
        param = text[6:].strip()
        if param == "driver":
            state[chat] = "driver"
            return "driver", send(token, chat, TEXT["driver"])
        if param.startswith("t") and len(param) > 1:
            taps[chat] = [t for t in taps[chat] if t > time.time() - HOUR]
            if len(taps[chat]) >= LIMIT:
                return "limit", send(token, chat, TEXT["limit"])
            real = bool(cards) and chat in allowed()
            c = cards.get(param) if real else SAMPLE
            if not c:
                return f"old:{param}", send(token, chat, TEXT["old"], BOARD)
            taps[chat].append(time.time())
            return f"card:{param}", card(token, chat, c)
        return "start", send(token, chat, TEXT["start"], BOARD)
    if state.get(chat) == "driver":
        return "driver_text", send(token, chat, TEXT["driver_ok"])
    return "other", send(token, chat, TEXT["other"], BOARD)


def main():
    token = Path(sys.argv[1]).read_text(encoding="utf-8").strip()
    log = Path(sys.argv[2])
    cards = cards_from_export(sys.argv[3]) if len(sys.argv) > 3 else {}
    print(f"карточек: {len(cards)}, с номером: {sum(1 for c in cards.values() if c['phone'])}" if cards else "режим образца",
          flush=True)
    state, taps, offset = {}, defaultdict(list), None
    while True:
        payload = {"timeout": 50, "allowed_updates": ["message"]}
        if offset is not None:
            payload["offset"] = offset
        u = call(token, "getUpdates", payload, max_time=60)
        if not u.get("ok"):
            time.sleep(5)
            continue
        for upd in u["result"]:
            offset = upd["update_id"] + 1
            m = upd.get("message")
            if not m or m.get("chat", {}).get("type") != "private":
                continue
            if m.get("date", 0) < time.time() - STALE:  # a press made while the responder was down: too late to answer
                continue
            action, r = handle(token, m, cards, state, taps)
            with log.open("a", encoding="utf-8", newline="") as fh:
                csv.writer(fh).writerow([dt.datetime.now(dt.timezone(dt.timedelta(hours=5))).strftime("%d.%m %H:%M:%S"),
                                         m["chat"]["id"], action, "ok" if r.get("ok") else r.get("description")])
            print(action, "ok" if r.get("ok") else r.get("description"), flush=True)


if __name__ == "__main__":
    main()
