"""Drivers of one group in one Excel: name, phones, Telegram link by phone, Telegram link by id, car, route, activity.
Usage: rida_haydovchilar.py <export folder> <xlsx path>"""
import re
import sys
from collections import defaultdict

import rida_matn as T
from rida_tahlil import build, latest_ad, link, load, route_text
from rida_xlsx import write

HEAD = ["Имя", "Телефоны", "Telegram по номеру", "Открыть", "Telegram по ID", "Открыть", "Telegram ID", "Как связаться", "Тип",
        "Машина", "Маршрут", "Когда едет", "Последняя активность", "Сообщений за сутки", "Разных объявлений",
        "Последнее объявление", "Сообщение в группе"]
WIDTHS = [26, 30, 24, 9, 32, 9, 14, 14, 20, 12, 34, 24, 19, 10, 10, 90, 12]


def telegram_id(key):
    """The author photo number from the export encodes the Telegram id (checked by the owner on a real profile)."""
    if not key.isdigit():
        return None
    n = int(key)
    return ((n >> 35) << 32) | (n & 0xFFFFFFFF)


def driver_row(p, a):
    f = dict(a["f"])
    top = p["routes"].most_common(1)
    if not (f["from"] or f["to"]) and top:
        f["from"], f["to"] = top[0][0]
    car = f["car"] or (p["cars"].most_common(1)[0][0] if p["cars"] else "")
    phones = sorted(p["phones"])
    tid = telegram_id(p["key"])
    by_phone = f"t.me/{phones[0]}" if phones else ""
    by_id = f"web.telegram.org/k/#{tid}" if tid else ""
    how = "номер" if phones else "только Telegram" if tid else "нет"
    dispatcher = len(phones) >= 3 or re.search(r"taksi|такси|taxi|xizmat", p["name"].lower())
    return [T.clean_name(p["name"]), ", ".join(phones), by_phone, f"https://{by_phone}" if by_phone else "",
            by_id, f"https://{by_id}" if by_id else "", tid or "", how,
            "Диспетчер или служба" if dispatcher else "Водитель", car, route_text(f), T.when(f), p["last"], p["count"],
            len(p["texts"]), a["clean"], link(a["id"])]


def main():
    rows, people = build(load(sys.argv[1]))
    by_key = defaultdict(list)
    for a in rows:
        if not a["fwd"] and a["cat"] not in T.NOISE:
            by_key[a["key"]].append(a)
    out = []
    for key, p in sorted(people.items(), key=lambda kv: kv[1]["last"], reverse=True):
        if p["role"] != "driver":
            continue
        p["key"] = key
        out.append(driver_row(p, latest_ad(p, by_key)))
    write(sys.argv[2], [("Haydovchilar", HEAD, WIDTHS, out)])
    print(f"водителей: {len(out)}, с номером: {sum(1 for r in out if r[1])}, с Telegram ID: {sum(1 for r in out if r[6])}, "
          f"ни того ни другого: {sum(1 for r in out if r[7] == 'нет')}")


if __name__ == "__main__":
    main()
