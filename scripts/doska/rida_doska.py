"""Replay of one day of group data as window posts: rolled-up summaries plus one open board.
Output: text files only. No phones, no names. Publishing is a separate step."""
import datetime as dt
import html
import os
import re
import sys
from collections import defaultdict

from rida_tahlil import load, build

BOT = "rida_billborad_bot"
PLACES = "Yakkabogʻ, Shahrisabz, Kitob"
WINDOWS = [("Kechqurun", "17.10", "17:00 … 21:00", "2026-10-17 17:00:00", "2026-10-17 22:00:00"),
           ("Tun", "17 … 18.10", "22:00 … 05:00", "2026-10-17 22:00:00", "2026-10-18 06:00:00"),
           ("Ertalab", "18.10", "06:00 … 11:00", "2026-10-18 06:00:00", "2026-10-18 12:00:00")]
OPEN = ("Kunduzi", "18.10", "12:00 … 16:00", "2026-10-18 12:00:00", "2026-10-18 16:59:00")
LIVE, GRACE = dt.timedelta(hours=2), dt.timedelta(minutes=30)
CAP = {"QT": {"SROCHNO": 14, "BUGUN": 12, "ERTAGA": 10}, "TQ": {"SROCHNO": 10, "BUGUN": 8, "ERTAGA": 6}}
SHORT = {"Yakkabogʻ markazi (posyolka)": "posyolka", "Engels (Ingliz)": "Engels", "Maksim Gorkiy": "M. Gorkiy"}

P = lambda s: dt.datetime.strptime(s, "%Y-%m-%d %H:%M:%S")


def side(f):
    return "QT" if "Toshkent" in f["to"] else "TQ" if "Toshkent" in f["from"] else None


def departure(f, t):
    if not f["time"]:
        return None
    h = int(f["time"].split(" ")[0])
    h += 12 if f["part"] == "kechqurun" and h < 12 else 0
    d = t.replace(hour=h % 24, minute=0, second=0)
    if f["day"] == "Ertaga" or d < t - dt.timedelta(hours=1):
        d += dt.timedelta(days=1)
    return d


def collect(rows, until):
    trips, passengers = {}, defaultdict(set)
    for a in rows:
        if a["fwd"] or a["date"] < "2026-10-17 17:00":
            continue
        t = P(a["date"])
        if t > until:
            continue
        if a["cat"] == "Пассажир":
            passengers[t].add(a["key"])
            continue
        if a["cat"] != "Водитель" or not side(a["f"]):
            continue
        region = "Qashqadaryo" if side(a["f"]) == "QT" else "Toshkent"
        pts = [SHORT.get(n, n) for sd, n in a["points"] if sd == region][:2]
        phones = sorted(a["phones"])
        key = (phones[0] if phones else a["key"], side(a["f"]))  # one car = one phone, whoever posts it
        r = trips.setdefault(key, {"first": t, "last": t, "dep": None, "f": a["f"], "pts": pts, "phones": phones})
        r["last"], r["f"], r["pts"] = max(r["last"], t), a["f"], pts or r["pts"]
        r["phones"] = phones or r["phones"]
        r["car"] = a["f"]["car"] or r.get("car", "")  # the car model sticks once the driver has named it
        r["extra"] = r.get("extra", set()) | extras(a)  # every detail the driver ever wrote stays on the line
        r["span"] = a["f"]["time"] or r.get("span", "")
        r["dep"] = departure(a["f"], t) or r["dep"]
        r["text"] = a["text"]  # the driver's latest wording, verbatim, for the card in the bot
    return trips, passengers


EXTRA = [("🏠", re.compile(r"manzildan\s*manzil|uy(ingiz)?dan\s*(olib|ob)|shahar\s*ichidan|shaxardan|shahardan")),
         ("🧳", re.compile(r"tepa\s*bagaj|bagaj\w*\s*bor|bogaj")), ("❄️", re.compile(r"k[ao]nd\w*n[ea]r|konditsioner")),
         ("🤝", re.compile(r"kelish(ib|tirib|amiz|sak)")), ("oldi joy", re.compile(r"oldi\s*(mesta|joy|o'rin)|old\s*o'rin"))]


def extras(a):
    m = a["clean"].lower().replace("ʻ", "'").replace("ʼ", "'")
    return {tag for tag, rx in EXTRA if rx.search(m)}


def alive(r, m):
    end = r["last"] + LIVE
    if r["dep"] and r["dep"] + GRACE > r["first"]:
        end = min(end, r["dep"] + GRACE)
    return r["first"] <= m <= end


def summary(trips, passengers, w):
    name, day, hours, a, b = w
    a, b = P(a), P(b)
    n = sum(1 for r in trips.values() if r["first"] < b and r["last"] >= a)
    p = len({k for t, ks in passengers.items() if a <= t < b for k in ks})
    return f"✅ <b>{name}</b> · {day} · {hours}\n{n} ta haydovchi eʼloni · {p} ta yoʻlovchi soʻrovi · doska yopildi"


def block_of(r, now):
    """SROCHNO: no departure time or it is near. BUGUN / ERTAGA: later today or tomorrow, sorted by hour."""
    dep = r["dep"]
    if r["f"]["day"] == "Ertaga" and not dep:
        return (3, 6, "ERTAGA")
    if dep and dep > now + dt.timedelta(minutes=30):
        return (2, dep.hour, "BUGUN") if dep.date() == now.date() else (3, dep.hour, "ERTAGA")
    return (1, 0, "SROCHNO")


def masked(phone):
    """+998901234567 -> 90•••67: operator code and the last two digits, five digits hidden."""
    d = phone[-9:]
    return f"{d[:2]}•••{d[-2:]}"


def line(i, r, block):
    """One short line, fits a phone screen: time · car · seats · place · flags · tappable masked number."""
    f = r["f"]
    if block[0] > 1 and r["dep"]:
        hours = [int(x) for x in re.findall(r"\d+", r["span"] or "")]
        when = f"{r['dep']:%H:%M}"
        if len(hours) > 1:
            end = (hours[1] + (12 if r["dep"].hour >= 12 and hours[1] < 12 else 0)) % 24
            if 0 < (end - r["dep"].hour) % 24 <= 3:  # "soat 8/9 larda": a short window the driver named
                when += f"…{end:02d}:00"
    else:
        when = "ertalab" if block[0] == 3 else f"{r['last']:%H:%M}"
    parts = [when]
    if r["car"]:
        parts.append(html.escape(r["car"]))
    if f["seats"]:
        parts.append(f"{f['seats']} joy")
    if r["pts"]:
        parts.append("📍" + html.escape(r["pts"][0]) + (f" +{len(r['pts']) - 1}" if len(r["pts"]) > 1 else ""))
    flags = ("👩" if f["woman_in_car"] else "") + ("📦" if f["post"] else "") + "".join(t for t in ("🏠", "🧳", "❄️", "🤝") if t in r["extra"])
    if flags:
        parts.append(flags)
    if "oldi joy" in r["extra"]:
        parts.append("oldi joy")
    label = f"📞 {masked(r['phones'][0])}" + (f" +{len(r['phones']) - 1}" if len(r["phones"]) > 1 else "") if r["phones"] else "📞 Raqam"
    parts.append(f'<a href="https://t.me/{BOT}?start=t{i}">{label}</a>')
    return " · ".join(parts)


def section(trips, now, s):
    head = f"<b>{PLACES} → Toshkent</b>" if s == "QT" else f"<b>Toshkentdan {PLACES}ga</b>"
    rows = [r for (k, sd), r in trips.items() if sd == s and alive(r, now)]
    groups = defaultdict(list)
    for i, r in enumerate(sorted(rows, key=lambda r: -r["last"].timestamp())):
        b = block_of(r, now)
        groups[b[2]].append((b, r, i))
    out = [head]
    for name in ("SROCHNO", "BUGUN", "ERTAGA"):
        items = groups.get(name)
        if not items:
            continue
        items.sort(key=lambda x: (x[0][1], -x[1]["last"].timestamp()) if name != "SROCHNO" else -x[1]["last"].timestamp())
        out.append(f"\n<b>{name}</b>")
        shown = items[:CAP[s][name]]
        out += [line(i, r, b) for b, r, i in shown]
        if len(items) > len(shown):
            out.append(f"… yana {len(items) - len(shown)} ta mashina hozir yoʻlda")
    return "\n".join(out), len(rows)


def board(trips, now):
    qt, n1 = section(trips, now, "QT")
    tq, n2 = section(trips, now, "TQ")
    title = f"<b>{OPEN[0]} · {OPEN[1]} · yangilandi {now:%H:%M}</b>\n\n"
    foot = f"\n\nHaydovchimisiz? Eʼloningizni @{BOT} ga yuboring: doskada yuqorida turasiz."
    return title + qt + "\n\n" + tq + foot, n1 + n2


def main():
    ex = load(sys.argv[1])
    rows, _ = build(ex)
    now = P(OPEN[4])
    trips, passengers = collect(rows, now)
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    posts = [(f"1_{w[0]}", summary(trips, passengers, w)) for w in WINDOWS]
    text, n = board(trips, now)
    visible = re.sub(r"<[^>]+>", "", text)
    assert len(visible) <= 4096, len(visible)
    print(f"видимый текст: {len(visible)} знаков, строк {visible.count(chr(10)) + 1}")
    print(f"доска: {n} живых строк, {len(text)} знаков")
    posts.append(("2_doska", text))
    for name, text in posts:
        assert not re.search(r"\d{7,}", text), name  # no phone-like digit runs
        with open(f"{out}/{name}.html", "w", encoding="utf-8") as fh:
            fh.write(text)
        plain = re.sub(r"<[^>]+>", "", text)
        lines = plain.split("\n")
        print(f"\n===== {name} ({len(text)} знаков)\n" + "\n".join(lines[:16]) + ("\n…" if len(lines) > 16 else ""))


if __name__ == "__main__":
    main()
