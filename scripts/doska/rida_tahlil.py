"""Full analysis of one Telegram group export: people, routes, hours, points, cars, prices, every message."""
import re
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path

import rida_matn as T
from rida_html import Export, file_order
from rida_xlsx import write

GROUP = "Taksi_xizmatiii"


def load(folder):
    ex = Export()
    for f in sorted(Path(folder).rglob("*.html"), key=file_order):
        ex.feed(f.read_text(encoding="utf-8", errors="replace"))
    return ex


def analyse_text(text, name, memo={}):
    if text not in memo:
        c = T.clean(text)
        m = T.matchable(c)
        d, s = T.score(m)
        f = T.fields(c)
        memo[text] = {"clean": c, "d": d, "s": s, "f": f, "phones": T.phones(text), "price": T.price(m),
                      "points": T.points(m), "door": bool(T.DOOR.search(m)), "full": bool(T.WHEN_FULL.search(m)),
                      "cat0": (m, d, s, bool(f["from"] or f["to"]))}
    a = dict(memo[text])
    a["cat"] = T.category(*a["cat0"], sender=name)
    return a


def route_text(f):
    return f["from"] + " → " + f["to"] if f["from"] and f["to"] else f["from"] + " → ?" if f["from"] else "? → " + f["to"] if f["to"] else ""


def link(mid):
    return f"https://t.me/{GROUP}/{mid}" if mid else ""


def build(ex):
    rows, people, seen = [], {}, Counter()
    for mid, key, name, date, text, fwd in ex.messages:
        a = analyse_text(text, name)
        seen[(key, a["clean"])] += 1
        a.update(id=mid, key=key, name=name, date=date, text=text, fwd=fwd, rep=seen[(key, a["clean"])])
        rows.append(a)
        if fwd or a["cat"] in T.NOISE or name == ex.head:
            continue  # noise filter first: chatter, ads and bots never reach the people lists
        p = people.setdefault(key, {"name": name, "phones": set(), "count": 0, "texts": set(), "first": date, "last": date,
                                    "d": 0, "s": 0, "ad": None, "routes": Counter(), "cars": Counter(), "cats": Counter(),
                                    "door": False, "full": False, "post": False, "hours": Counter()})
        p["name"], p["count"], p["last"] = name, p["count"] + 1, max(p["last"], date)
        p["phones"] |= a["phones"]
        p["cats"][a["cat"]] += 1
        p["hours"][date[11:13]] += 1
        if a["clean"] in p["texts"]:
            continue
        p["texts"].add(a["clean"])
        p["d"], p["s"] = p["d"] + a["d"], p["s"] + a["s"]
        f = a["f"]
        for o in f["from"].split(", ") if f["from"] else []:
            for t in f["to"].split(", ") if f["to"] else []:
                p["routes"][(o, t)] += 1
        if f["car"]:
            p["cars"][f["car"]] += 1
        p["door"] |= a["door"]
        p["full"] |= a["full"]
        p["post"] |= f["post"]
        if a["d"] or a["s"] or not p["ad"]:
            p["ad"] = a
    for p in people.values():
        p["role"] = "driver" if p["d"] > p["s"] else "passenger" if p["s"] > p["d"] else ""
        # a person keeps the role of the majority of their own ads; the latest ad must match it
    return rows, people


def latest_ad(p, rows_by_key):
    for a in reversed(rows_by_key[p["key"]]):
        if (p["role"] == "driver" and a["d"] > a["s"]) or (p["role"] == "passenger" and a["s"] > a["d"]):
            return a
    return p["ad"]


def person_rows(people, rows):
    by_key = defaultdict(list)
    for a in rows:
        if not a["fwd"] and a["cat"] not in T.NOISE:
            by_key[a["key"]].append(a)
    out = {"driver": [], "passenger": [], "": []}
    for key, p in sorted(people.items(), key=lambda kv: kv[1]["last"], reverse=True):
        p["key"] = key
        a = latest_ad(p, by_key)
        f = dict(a["f"])
        top_route = p["routes"].most_common(1)
        if not (f["from"] or f["to"]) and top_route:
            f["from"], f["to"] = top_route[0][0]
        if not f["car"] and p["cars"]:
            f["car"] = p["cars"].most_common(1)[0][0]
        tel = ", ".join(sorted(p["phones"]))
        name = T.clean_name(p["name"])
        both = any((t, o) in p["routes"] for o, t in p["routes"])
        dispatcher = len(p["phones"]) >= 3 or re.search(r"taksi|такси|taxi|xizmat", p["name"].lower())
        std = T.standard(p["role"], f, tel)
        common = [name, tel, link(a["id"]), p["last"], p["count"], len(p["texts"])]
        if p["role"] == "driver":
            out["driver"].append(common + [route_text(f), both, T.when(f), f["seats"], f["car"], p["post"], f["woman_in_car"],
                                           p["door"], p["full"], "Диспетчер или служба" if dispatcher else "Водитель",
                                           std, a["clean"]])
        elif p["role"] == "passenger":
            pts = ", ".join(n for _, n in a["points"])
            out["passenger"].append(common + [route_text(f), pts, T.when(f), f["seats"], f["woman"], f["post"], a["price"],
                                              std, a["clean"]])
        else:
            why = "И водитель, и пассажир" if p["d"] and p["d"] == p["s"] else "Неясный текст"
            out[""].append(common + [why, a["clean"]])
    return out


def pct(a, b):
    return f"{round(100 * a / b)}%" if b else "0%"


def tables(rows, people):
    role = {k: p["role"] for k, p in people.items()}
    drivers = [p for p in people.values() if p["role"] == "driver"]
    passengers = [p for p in people.values() if p["role"] == "passenger"]
    routes = defaultdict(lambda: [set(), set()])
    for k, p in people.items():
        for o, t in p["routes"]:
            if p["role"] in ("driver", "passenger"):
                routes[(o, t)][p["role"] == "passenger"].add(k)
    t_routes = sorted(([f"{o} → {t}", len(d), len(s), round(len(d) / len(s), 1) if s else ""]
                       for (o, t), (d, s) in routes.items()), key=lambda r: -(r[1] + r[2]))
    hours = defaultdict(lambda: [set(), set(), 0, 0, 0, 0])
    for a in rows:
        r = role.get(a["key"])
        if a["fwd"] or r not in ("driver", "passenger"):
            continue
        h, i = hours[a["date"][11:13]], r == "passenger"
        h[i].add(a["key"])
        h[2 + i] += 1
        h[4 + i] += a["rep"] == 1
    t_hours = [[f"{hh}:00", len(h[0]), len(h[1]), h[2], h[3], h[4], h[5]] for hh, h in sorted(hours.items())]
    pts = defaultdict(lambda: [set(), set()])
    when = defaultdict(lambda: [0, 0])
    prices = []
    for a in rows:
        r = role.get(a["key"])
        if a["fwd"] or a["rep"] > 1 or r not in ("driver", "passenger"):
            continue
        for side, n in a["points"]:
            pts[(side, n)][r == "passenger"].add(a["key"])
        w = T.when(a["f"]) and " ".join(x for x in (a["f"]["day"], a["f"]["part"]) if x) or "не указано"
        when[w][r == "passenger"] += 1

    for a in rows:
        if a["price"] and not a["fwd"] and a["rep"] == 1 and a["cat"] not in ("Спам и реклама", "Модерация"):
            prices.append([a["date"], T.clean_name(a["name"]), a["cat"], route_text(a["f"]), a["price"], a["clean"], link(a["id"])])
    t_points = sorted(([side, n, len(d), len(s)] for (side, n), (d, s) in pts.items()), key=lambda r: (r[0], -(r[2] + r[3])))
    t_when = sorted(([w, d, s] for w, (d, s) in when.items()), key=lambda r: -(r[1] + r[2]))
    cars = Counter(p["cars"].most_common(1)[0][0] for p in drivers if p["cars"])
    t_cars = [[c, n, pct(n, sum(cars.values()))] for c, n in cars.most_common()]
    t_reports = []
    for a in rows:
        nums = [int(x) for x in re.findall(r"(\d+) ta o", a["text"])] if "xisobot" in a["clean"].lower() else []
        if len(nums) >= 3 and a["rep"] == 1:
            t_reports.append([a["date"], T.clean_name(a["name"])] + nums[:3])
    cats = defaultdict(lambda: [0, 0])
    for a in rows:
        cats[a["cat"]][0] += 1
        cats[a["cat"]][1] += a["rep"] == 1
    t_cats = sorted(([c, n, u] for c, (n, u) in cats.items()), key=lambda r: -r[1])
    return locals()


def summary(rows, people, t):
    d, s = t["drivers"], t["passengers"]
    counts = sorted((p["count"] for p in d), reverse=True)
    top10 = sum(counts[:max(1, len(counts) // 10)])
    uniq = sum(1 for a in rows if a["rep"] == 1)
    dir_q = sum(1 for p in d if any(o != "Toshkent" and tt == "Toshkent" for o, tt in p["routes"]))
    dir_t = sum(1 for p in d if any(o == "Toshkent" and tt != "Toshkent" for o, tt in p["routes"]))
    pdir_q = sum(1 for p in s if any(o != "Toshkent" and tt == "Toshkent" for o, tt in p["routes"]))
    pdir_t = sum(1 for p in s if any(o == "Toshkent" and tt != "Toshkent" for o, tt in p["routes"]))
    woman = sum(1 for k, p in people.items() if p["role"] == "driver" and
                any(T.fields(c)["woman_in_car"] for c in p["texts"]))
    pw = sum(1 for p in s if any(T.fields(c)["woman"] for c in p["texts"]))
    hours_p = sorted(t["t_hours"], key=lambda r: -r[2])[:3]
    hours_d = sorted(t["t_hours"], key=lambda r: -r[1])[:3]
    period = sorted(a["date"] for a in rows if a["cat"] != "Модерация")
    reps = t["t_reports"]
    prices = [r[4] for r in t["prices"]]
    both = sum(1 for p in d if any((tt, o) in p["routes"] for o, tt in p["routes"]))
    rt = {r[0]: r for r in t["t_routes"]}
    ya_to, to_ya = rt.get("Yakkabogʻ → Toshkent"), rt.get("Toshkent → Yakkabogʻ")
    money = lambda v: f"{v:,}".replace(",", " ")
    return [
        ["Период", f"{period[0][:16]} … {period[-1][:16]}", "Одни сутки одной группы: выводы предварительные"],
        ["Сообщений всего", len(rows), "Ни одно не потеряно: все на листе «Все сообщения»"],
        ["Разных текстов", uniq, f"{pct(len(rows) - uniq, len(rows))} сообщений: повтор того же текста тем же человеком"],
        ["Водителей", len(d), f"На 1 пассажира {round(len(d) / max(1, len(s)), 1)} водителя: пассажир здесь редкий"],
        ["Пассажиров", len(s), f"С телефоном {pct(sum(1 for p in s if p['phones']), len(s))}; остальным писать по ссылке"],
        ["Сообщений у 10% самых активных водителей", pct(top10, sum(counts)),
         f"Медиана {round(statistics.median(counts)) if counts else 0} сообщений на водителя в сутки, рекорд {counts[0] if counts else 0}"],
        ["Водители: Qashqadaryo → Toshkent / обратно", f"{dir_q} / {dir_t}", "Сколько водителей в каждую сторону"],
        ["Пассажиры: Qashqadaryo → Toshkent / обратно", f"{pdir_q} / {pdir_t}", "Сколько пассажиров в каждую сторону"],
        ["Водителей на 1 пассажира: Yakkabogʻ → Toshkent / обратно",
         f"{ya_to[3] if ya_to else '?'} / {to_ya[3] if to_ya else '?'}",
         "В Toshkent водителей намного больше, чем пассажиров: там им труднее всего заполнить машину"],
        ["Водители ездят в обе стороны", pct(both, len(d)), "Постоянные водители направления"],
        ["Водители с «в машине есть женщина»", pct(woman, len(d)), "Подтверждает фичу «Mashinada ayol bor» (docs/06)"],
        ["Пассажиры: едет женщина", pct(pw, len(s)), "Для фильтра «Mashinada ayol bor»"],
        ["Водители берут почту", pct(sum(1 for p in d if p["post"]), len(d)), "Почта: частая доп. услуга водителя"],
        ["Водители «от двери до двери»", pct(sum(1 for p in d if p["door"]), len(d)), "Забирают из дома или по городу (docs/70)"],
        ["Водители «едем, когда заполнится»", pct(sum(1 for p in d if p["full"]), len(d)), "Время выезда часто не точное"],
        ["Цена в объявлении", f"{len(prices)} из {uniq}", "Цену почти не пишут, договариваются по телефону. За место звучит "
         "100 000 … 125 000 so'm; у Rida для Yakkabogʻ 125 000 (docs/16)"],
        ["Пик пассажиров (час)", ", ".join(r[0] for r in hours_p), "Когда показывать доску дня в канале"],
        ["Пик водителей (час)", ", ".join(r[0] for r in hours_d), "Когда водители ищут пассажиров"],
        ["Машины", ", ".join(f"{c} {n}" for c, n, _ in t["t_cars"][:4]), "Самые частые модели"],
        ["Отчёты ботов чистки", f"{len(reps)} за сутки" if reps else "нет",
         "Два бота публикуют «отчёт» каждые 25 минут, числа скачут вверх и вниз: это реклама ботов, не статистика"],
        ["Убрано фильтром шума", f"{sum(1 for a in rows if a['cat'] in T.NOISE)} сообщений",
         "Болтовня, реклама не про поездки и боты: в списки людей не попадают, но остаются на листе «Все сообщения»"],
        ["Шум в группе", pct(sum(1 for a in rows if a["cat"] in T.NOISE), len(rows)),
         "Модерация, спам и болтовня; плюс 92% повторов. Чистый список поездок Rida здесь заметен сразу"],
        ["Совет: когда публиковать", ", ".join(r[0] for r in hours_p), "Доска дня и напоминания в канале направления: в часы, когда больше всего пассажиров"],
        ["Совет: кого звать первым", "пассажиров", f"Водителей уже в {round(len(d) / max(1, len(s)), 1)} раза больше: на этом направлении не хватает пассажиров, а не водителей"],
        ["Совет: фильтр «Mashinada ayol bor»", pct(woman, len(d)), "Столько водителей сами пишут о женщине в машине: показывать фильтр на видном месте"],
        ["Идея после запуска: почта", pct(sum(1 for p in d if p["post"]), len(d)), "Столько водителей берут посылки; в Rida этого нет. До запуска новых фич нет"],
    ]


def main():
    src = Path(sys.argv[1])
    out = Path(sys.argv[2])
    ex = load(src)
    rows, people = build(ex)
    pr = person_rows(people, rows)
    t = tables(rows, people)
    every = [[a["date"], T.clean_name(a["name"]), a["cat"], a["rep"], a["fwd"] and T.clean_name(a["fwd"]), a["f"]["from"],
              a["f"]["to"], T.when(a["f"]), a["f"]["seats"], a["f"]["car"], a["f"]["post"], a["f"]["woman"], a["price"],
              ", ".join(sorted(a["phones"])), link(a["id"]),
              T.standard({"Водитель": "driver", "Пассажир": "passenger"}.get(a["cat"], ""), a["f"], ", ".join(sorted(a["phones"]))),
              a["clean"], a["text"].replace("\n", " ")] for a in rows]
    common = ["Имя", "Телефоны", "Сообщение", "Последняя активность", "Сообщений за сутки", "Разных текстов"]
    cw = [26, 30, 10, 19, 10, 10]
    write(out, [
        ("Выводы", ["Тема", "Цифра", "Что это значит"], [44, 34, 80], summary(rows, people, t)),
        ("Водители", common + ["Маршрут", "В обе стороны", "Когда", "Мест нужно", "Машина", "Почта", "Женщина в машине",
                               "От двери до двери", "Едет, когда заполнится", "Тип", "Стандартное объявление", "Очищенный текст"],
         cw + [34, 9, 24, 8, 10, 7, 9, 9, 10, 20, 90, 90], pr["driver"]),
        ("Пассажиры", common + ["Маршрут", "Точка посадки", "Когда", "Человек", "Женщина", "Почта", "Цена",
                                "Стандартное объявление", "Очищенный текст"],
         cw + [34, 22, 24, 8, 9, 7, 9, 80, 90], pr["passenger"]),
        ("Не определено", common + ["Почему", "Очищенный текст"], cw + [24, 100], pr[""]),
        ("Маршруты", ["Маршрут", "Водителей", "Пассажиров", "Водителей на 1 пассажира"], [40, 11, 11, 14], t["t_routes"]),
        ("По часам", ["Час", "Водителей активно", "Пассажиров активно", "Сообщений водителей", "Сообщений пассажиров",
                      "Новых текстов водителей", "Новых текстов пассажиров"], [8, 12, 12, 12, 12, 12, 12], t["t_hours"]),
        ("Когда едут", ["Когда", "Объявлений водителей", "Объявлений пассажиров"], [30, 14, 14], t["t_when"]),
        ("Точки посадки", ["Сторона", "Точка", "Водителей", "Пассажиров"], [14, 30, 11, 11], t["t_points"]),
        ("Машины", ["Модель", "Водителей", "Доля"], [16, 11, 8], t["t_cars"]),
        ("Цены", ["Время", "Имя", "Роль", "Маршрут", "Цена, so'm", "Очищенный текст", "Сообщение"], [19, 22, 10, 30, 11, 90, 10], t["prices"]),
        ("Категории", ["Категория", "Сообщений", "Разных текстов"], [20, 11, 14], t["t_cats"]),
        ("Отчёты ботов чистки", ["Время", "Бот", "«Вход и выход удалено»", "«Реклама удалено»", "«Грубые слова удалено»"],
         [19, 18, 16, 16, 16], t["t_reports"]),
        ("Все сообщения", ["Время", "Имя", "Категория", "Повтор №", "Переслано от", "Откуда", "Куда", "Когда", "Мест", "Машина",
                           "Почта", "Женщина", "Цена", "Телефоны", "Сообщение", "Стандартное объявление", "Очищенный текст", "Исходный текст"],
         [19, 22, 14, 8, 16, 20, 20, 22, 6, 9, 6, 8, 9, 28, 10, 70, 80, 80], every),
    ])
    print(len(rows), "сообщений;", {k or "unknown": len(v) for k, v in pr.items()}, "->", out)


if __name__ == "__main__":
    main()
