"""Window posts: ERTAGA (top), secondary direction, primary direction (bottom, pinned).
Writes HTML post files with {ID_*} placeholders for cross links. No phones, no names."""
import datetime as dt
import html
import os
import re
import sys
from collections import defaultdict

import rida_doska as D
from rida_tahlil import load, build

CHANNEL = "yakkabog_rida"
PRIMARY, SECONDARY = "TQ", "QT"
CAP = {"SROCHNO": 14, "BUGUN": 12, "ERTAGA_QT": 12, "ERTAGA_TQ": 8}
TITLE = {"QT": f"{D.PLACES} → Toshkent", "TQ": f"Toshkentdan {D.PLACES}ga"}
NAV = {"QT": "Toshkentga ketayotganlar", "TQ": "Toshkentdan ketayotganlar", "ertaga": "Ertaga ketayotganlar"}


def link(name, label):
    return f'<a href="https://t.me/{CHANNEL}/{{ID_{name}}}">{label}</a>'


def grouped(trips, now, s):
    groups = defaultdict(list)
    rows = [r for (k, sd), r in trips.items() if sd == s and D.alive(r, now) and r["car"]]  # owner: no car model, no row
    for i, r in enumerate(sorted(rows, key=lambda r: -r["last"].timestamp())):
        b = D.block_of(r, now)
        groups[b[2]].append((b, r, f"{s}{i}"))
    for name, items in groups.items():
        items.sort(key=lambda x: (x[0][1], -x[1]["last"].timestamp()) if name != "SROCHNO" else -x[1]["last"].timestamp())
    return groups


def quote(title, items, cap, tail, expandable=False):
    """One block. Expandable: the reader sees the first lines only until a tap; SROCHNO stays open."""
    body = [D.line(i, r, b) for b, r, i in items[:cap]]
    if len(items) > cap:
        body.append(f"… yana {len(items) - cap} ta {tail}")
    tag = "<blockquote expandable>" if expandable else "<blockquote>"
    return f"{tag}<b>{title} · {len(items)}</b>\n" + "\n".join(body) + "</blockquote>"


def direction_post(groups, s, now, signature=False):
    total = sum(len(v) for v in groups.values())
    out = [f"<b>🚗 {TITLE[s]}</b>", f"{total} ta mashina · {D.OPEN[0]} · {D.OPEN[1]} · yangilandi {now:%H:%M}",
           "👩 ayol bor · 📦 pochta · 🏠 uydan oladi · 🧳 bagaj · ❄️ konditsioner · 🤝 kelishamiz · 📞 raqam"]
    for name in ("SROCHNO", "BUGUN"):
        if groups.get(name):
            out += ["", quote(name, groups[name], CAP[name], "mashina", expandable=name != "SROCHNO")]
    if not groups.get("SROCHNO") and not groups.get("BUGUN"):
        out += ["", "Hozircha eʼlon yoʻq. Doska har daqiqa yangilanadi."]
    if signature:
        out += ["", f"Haydovchimisiz? Eʼloningizni @{D.BOT} ga yuboring: doskada yuqorida turasiz."]
    return "\n".join(out)


def ertaga_post(g_qt, g_tq, now):
    total = len(g_qt.get("ERTAGA", [])) + len(g_tq.get("ERTAGA", []))
    out = [f"<b>🌅 ERTAGA ERTALAB</b>", f"{total} ta mashina · {D.OPEN[0]} · {D.OPEN[1]} · yangilandi {now:%H:%M}"]
    for s, g, cap in (("QT", g_qt, CAP["ERTAGA_QT"]), ("TQ", g_tq, CAP["ERTAGA_TQ"])):
        if g.get("ERTAGA"):
            out += ["", quote(TITLE[s], g["ERTAGA"], cap, "mashina", expandable=True)]
    return "\n".join(out)


def main():
    ex = load(sys.argv[1])
    rows, _ = build(ex)
    now = D.P(D.OPEN[4])
    trips, _ = D.collect(rows, now)
    g = {s: grouped(trips, now, s) for s in ("QT", "TQ")}
    posts = []
    has_ertaga = bool(g["QT"].get("ERTAGA") or g["TQ"].get("ERTAGA"))
    if has_ertaga:
        posts.append(("ertaga", ertaga_post(g["QT"], g["TQ"], now)))
    posts.append((SECONDARY, direction_post(g[SECONDARY], SECONDARY, now)))
    posts.append((PRIMARY, direction_post(g[PRIMARY], PRIMARY, now, signature=True)))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for n, (name, text) in enumerate(posts, 1):
        visible = re.sub(r"<[^>]+>", "", text)
        assert not re.search(r"\d{7,}", visible), name
        assert len(visible) <= 4096, (name, len(visible))
        with open(f"{out}/{n}_{name}.html", "w", encoding="utf-8") as fh:
            fh.write(text)
        print(f"===== {n}_{name}: {len(visible)} знаков, {visible.count(chr(10)) + 1} строк\n" + "\n".join(visible.split("\n")[:8]) + "\n…\n")


if __name__ == "__main__":
    main()
