"""Text of one ad: emoji cleanup, Uzbek Latin, roles, standard fields and a standard line."""
import re
import unicodedata
from collections import Counter

CYR = dict(zip("абвгдеёжзийклмнопрстуфхцчшщъыьэюяўқғҳ",
               ["a", "b", "v", "g", "d", "e", "yo", "j", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r", "s",
                "t", "u", "f", "x", "s", "ch", "sh", "sh", "ʼ", "i", "", "e", "yu", "ya", "oʻ", "q", "gʻ", "h"]))
LETTERS = {"ğ": "gʻ", "ģ": "gʻ", "ĝ": "gʻ", "ǵ": "gʻ", "ŏ": "oʻ", "õ": "oʻ", "ö": "oʻ", "ô": "oʻ", "ò": "oʻ"}
KEEP = set(" .,:;!?()+/%№'\"-")
APOS = "'`‘’ʼʻ´"


FILLERS = set("\u3164\u115f\u1160\uffa0\u200b\u200c\u200d\u2060\ufeff")


def _char(ch):
    low = ch.lower()
    out = CYR.get(low, LETTERS.get(low))
    if out is None:
        cat = unicodedata.category(ch)
        if ch in FILLERS or not (cat[0] == "L" or cat == "Nd" or ch in KEEP or ch in APOS):
            return " "
        return ch
    return out.capitalize() if ch != low else out


FIX = [(re.compile("^(" + a + ")$"), b) for a, b in [
    (r"xozir", "hozir"), (r"xozirga|hoziga", "hozirga"),
    (r"s[iu]?ro[cs]h?[nj]?[aeiy]+\w*|srocni|sroshn\w*|srochn\w*|sirochn\w*|srojn\w*|sirojn\w*|surochn\w*", "srochno"),
    (r"m[ao]sh[ei]na?|moshin|mashena|moshena|moshna|mowina", "mashina"), (r"kshi|keshi|kishi", "kishi"),
    (r"kerag|kere|kirak|kk|k-k|keraak", "kerak"), (r"po'?shta|pushta|po'chta", "pochta"),
    (r"pochta[xh]am|poshtayam|pochtayam|poshtaham|pushtaham", "pochta ham"), (r"xam", "ham"), (r"pojta|po'jta", "pochta"),
    (r"olamz|oiamiz|olami|olamis", "olamiz"), (r"ketamz|katamiz|kitamiz|kemiz|ketamis", "ketamiz"),
    (r"yulga|yolga|yo'lga", "yoʻlga"), (r"ertalap|ertalb", "ertalab"), (r"ertga|erta", "ertaga"),
    (r"chiqamz|chqamiz|chikamiz", "chiqamiz"), (r"[kc]o[bp][aoiu]?l?i?[dt]\w*", "Cobalt"),
    (r"[jg][ei]nt?i?ra", "Gentra"), (r"la[sc]+et+i|lecetti|laseti", "Lacetti"), (r"on[ei][kxh]s?", "Onix"),
    (r"neks?i?y?a|nexia", "Nexia"), (r"tr[ae]ker", "Tracker"), (r"malibu", "Malibu"), (r"damas", "Damas"), (r"tel\.?|telefon", "tel"), (r"assalom|asalomu|assalamu|asalom", "assalomu")]]


def _fix(word):
    core = word.rstrip(".,:;!?()")
    for rx, good in FIX:
        if rx.match(core):
            return good + word[len(core):]
    return word


def clean(text):
    """Emoji and decoration out, Cyrillic to Latin, one spelling of oʻ and gʻ, sentence case."""
    text = "".join(_char(ch) for ch in unicodedata.normalize("NFKC", text)).lower()
    text = re.sub(r"([og])[" + APOS + "]", r"\1ʻ", text)
    text = re.sub("[" + APOS.replace("ʻ", "") + "]", "ʼ", text).replace("w", "sh")
    text = re.sub(r"\s*([.,:;!?])(\s*[.,:;!?])+", r"\1", text)
    text = re.sub(r"\s+([.,:;!?])", r"\1", re.sub(r"\s+", " ", text)).strip(" .,:;-")
    text = re.sub(r"(\S+) (dan|ga|qa|ka|gacha|da)\b", lambda m: m[1] + m[2] if place_of(m[1]) else m[0], text)
    text = " ".join(place_word(_fix(w)) for w in text.split(" "))
    return re.sub(r"(^|[.!?]\s+)([a-z])", lambda m: m[1] + m[2].upper(), text)


def matchable(cleaned):
    return cleaned.lower().replace("ʻ", "'").replace("ʼ", "'")


PLACES = [("Yakkabogʻ", "Yakkabogʻ", r"ya+k+[ao]boʻ?(gʻ|g|q|k)?"), ("Toshkent", "Toshkent", r"t[ao]shk[a-z]{0,4}?"),
          ("Shahrisabz", "Shahrisabz", r"sha[hx]r[a-z]{1,5}?z"), ("Kitob", "Kitob", r"k?itob|ktob"),
          ("Chiroqchi", "Chiroqchi", r"chiroqchi"), ("Qarshi", "Qarshi", r"[qk]arshi"),
          ("Samarqand", "Samarqand", r"sama?r[qk]and"), ("Gʻuzor", "Gʻuzor", r"gʻ?uzor"),
          ("Jizzax", "Jizzax", r"jizza[xh]"), ("Qamashi", "Qamashi", r"[qk]amashi"), ("Koson", "Koson", r"koson"),
          ("Yunusobod", "Toshkent", r"yun[iu]?sobo[dt]"), ("Chilonzor", "Toshkent", r"chilonzor"),
          ("Sergeli", "Toshkent", r"serg[ei]li"), ("Olmazor", "Toshkent", r"olmazor"),
          ("Uchtepa", "Toshkent", r"uchtepa"), ("Yashnobod", "Toshkent", r"yashnobo[dt]"),
          ("Chirchiq", "Chirchiq", r"chirchi[qk]"), ("Ohangaron", "Ohangaron", r"o[xh]angaron")]
SUFFIX = r"(dan|tan|nan|den|ddan|gacha|qacha|kacha|ga|ka|qa|da|ta)?"
PLACE_RE = [(c, r, re.compile("^(" + p + ")" + SUFFIX + "$")) for c, r, p in PLACES]


def place_of(word):
    """(canonical, region, 'from' | 'to' | 'in' | '') for a word that names a place, else None."""
    w = word.lower().strip(".,:;!?()")
    for canon, region, rx in PLACE_RE:
        m = rx.match(w)
        if m:
            s = m[m.lastindex] if m.lastindex > 1 and m[m.lastindex] else ""
            kind = "from" if s.endswith(("an", "en")) else "to" if s.startswith(("ga", "ka", "qa")) or \
                s.endswith("acha") else "in" if s else ""
            return canon, region, kind, "cha" in s
    return None


def place_word(word):
    p = place_of(word)
    if not p:
        return word
    canon, _, kind, till = p
    to = "qa" if canon.endswith("q") else "ka" if canon.endswith("k") else "ga"
    tail = {"from": "dan", "to": to + ("cha" if till else ""), "in": "da", "": ""}[kind]
    return canon + tail + word[len(word.rstrip(".,:;!?()")):]


def clean_name(name):
    words = clean(name).split()
    return " ".join(w[0].upper() + w[1:] for w in words) or "Без имени"


COUNT = r"(\b\d{1,2}|bir|bitta|bita|ikki|ikkita|ikta|uch|uchta|to'?rt|to'?rtta)[\s\-]*(ta\s*)?"
NUM = COUNT + r"((ayol|qiz)\s*)?"
PEOPLE = r"(k[iye]?sh[iy]?|odam)"
NEED = r"(kera[kg]|kere\w*|kirak|k\s?-?k\b|ke+a+k|kerk|krak)"
CARS = [("Cobalt", r"[kc]o[bp][aoiu]?l?i?[dt]\w*"), ("Gentra", r"[jg][ei]nt?i?ra"), ("Nexia", r"neks?i?y?a|nexia"),
        ("Lacetti", r"la[sc]+et+i"), ("Malibu", r"malibu"), ("Spark", r"spark"), ("Damas", r"damas"),
        ("Onix", r"on[ei][kx]s?"), ("Tracker", r"tr[ae]ker"), ("Captiva", r"[kc]aptiva"), ("Orlando", r"orlando"),
        ("Matiz", r"matiz"), ("Monza", r"monza"), ("Labo", r"labo"), ("BYD", r"byd"), ("BMW", r"bmw"), ("Kia", r"kia"),
        ("Hyundai", r"hyundai"), ("Toyota", r"toyota")]
CAR_RE = [(c, re.compile(r"\b(" + p + r")\b")) for c, p in CARS]
POST = r"\bp[ou]'?[cs]hta\w*"
TRAVEL = r"\bket(uv|iv|guv|v)ch\w*"
DRIVER = [re.compile(p) for p in [
    NUM + PEOPLE + r"\w*\W{0,3}(" + NEED[1:-1] + r"|olam)", r"\b\d+\s*(ta\s*)?kera[kg]", r"\bodam\w*\s*" + NEED,
    r"\bodam\w*\s*([hx]am\s*)?olam", r"\b(ayol|qiz)\s*k[iye]?sh[iy]\w*\s*" + NEED,
    r"\byo'?lovchi\w*\s*(" + NEED[1:-1] + r"|olam|bormi)", r"\bjoy(imiz|i)?\s*bor\b", r"\bbo'sh\s*joy",
    r"\bjoy(lar)?\s*bo'sh", r"\bodam\s*(va|ham)\s*p[ou]'?[cs]hta", POST + r"\W{0,6}([hxy]am\W{0,6})?x?ol[ai]",
    POST + r"\s*xizmat", r"\b(olib|ob|op)\s*k[ei]tam", TRAVEL + r"\s*(bo'?l?s?a|bu?lsa|busa|aloqa|aloka)",
    r"\bj[uo]'?naymiz", r"\b(yo'?lga\s*)?chiqamiz\b", r"\byuramiz\b", r"\bket[ai]mi?z\b.{0,40}\bp[ao]p[uy]t\w*\b(?!\s*kera)",
    r"\bp[ao]p[uy]t\w*\s*ket[ai]m", r"\bpusto[yi]\b(?!\s*\w+\s*kera)", r"\bmanzildan\s*manzil",
    r"\bshahar\s*ichidan\s*ol", r"\bk[ao]nd\w*n[ea]r\b", r"\b(metan|propan)\b", r"\b(bagaj|bogaj)\w*\s*bor",
    r"\bm[ao]sh[ie]n\w*da\s*(ayol|qiz)", r"\bhaydovchiman\b"] + [p for _, p in CARS]]
DRIVER[-len(CARS):] = [re.compile(r"\b(" + "|".join(p for _, p in CARS if _ != "Labo") + r")\b")]
PASSENGER = [re.compile(p) for p in [
    COUNT + PEOPLE + r"(miz)?\s*(bo+r\b|ketishi|ketam|(bilan|bn)\s*ketaman)", r"\bikk?ishi\s*bo+r\b",
    COUNT + r"(yosh\s*)?bola(lar|la)?\s*bo+r\b",
    r"\bkishimiz\s*bor\b", r"\bk[iy]?shiman\b", r"\bketaman\W{1,3}" + NUM + PEOPLE,
    r"\bketishga\s*(odam|k[iy]?sh[iy])", r"\bqanchaga\b", r"\b(nech\s*pul|qancha\s*b[uo]'?l|puli\s*qancha|yo'?l\s*puli)",
    r"\b\d+\s*(ming\s*)?beraman", r"\b(m[ao]sh[ie]n|ta[nk]?ksi|taxi|takse|avto)\w*\s*(" + NEED[1:-1] + r"|bo?r?mi|topib|yo'?qmi)",
    r"\b(taksichi|shafyor|shofyor|shopir|shofer)\w*\s*aka", r"\b(taksi|mashina)\s*topildi",
    r"\b(labo|damas|yuk)\w*\s*(m[ao]sh\w*\s*)?" + NEED, r"\bp[ao]p[uy]t\w*\s*" + NEED,
    r"(?<!orqada )(?<!orqaga )\b" + COUNT + PEOPLE + r"\s*ketadi",
    r"kera[kg]\s*pusto|pusto[yi]\s*(m[ao]sh|taksi|taxi)\w*\s*kera",
    r"\b(shopir|shofer|haydovchi)\s*" + NEED, r"\b(olib|ob)\s*ket(ing|asiz|asila|adigan)",
    r"\b(op|ob|olib)\s*k[ie]tuvchi", TRAVEL + r"\W*\w*\W*(bor\b|taksi|m[ao]sh)",
    r"\b(ketishim|ketishimiz|borishim|borishimiz)\s*" + NEED, r"\bket(i)?sh\s*" + NEED,
    r"\bjoy\s*(" + NEED[1:-1] + r"|bormi)", POST + r"(m|miz)?\s*(ham\s*)?bor\b"]]
PHONE = re.compile(r"(?<!\d)(?:\+?998[\s\-.]?)?\(?(20|33|50|55|77|88|90|91|93|94|95|97|98|99)\)?"
                   r"[\s\-.]?(\d{3})[\s\-.]?(\d{2})[\s\-.]?(\d{2})(?!\d)")
SEATS = re.compile(NUM + PEOPLE)
WORD_NUM = {"bir": 1, "bitta": 1, "bita": 1, "ikki": 2, "ikkita": 2, "ikta": 2, "uch": 3, "uchta": 3}
DAY = [("Ertaga", r"\berta(ga|lab\w*)?\b(?!.*\bbugun)"), ("Bugun", r"\bbugun"),
       ("Hozir", r"\b(hozir|xozir|s[iu]?ro[cs]h?[nj]|s[iu]?rosh|srocn)")]
PART = [("ertalab", r"\b(ertalab|tong|sahar)"), ("tushdan keyin", r"\b(tush|ab[ei][td]|obed)\w*\s*(dan\s*)?k[ie]yin"),
        ("kechqurun", r"\bkech(ga|ki|qurun|asi|gi)?\b"), ("tunda", r"\btun(da|gi)?\b")]
TIME = [re.compile(r"\bsoat\s*(\d{1,2})(?:[:.\s]\d{2})?(?:\s*[-.,/\s]\s*(\d{1,2})(?:[:.\s]\d{2})?)?"),
        re.compile(r"\b(\d{1,2})(?:[:.\s]00)?\s*[-.,/\s]\s*(\d{1,2})(?:[:.\s]00)?\s*(?:lar|la|da|ga)"),
        re.compile(r"\b(\d{1,2})(?:[:.\s]00)?()\s*(?:larda|lada|larga|lar|la)\b")]


WEAK_PASSENGER = [re.compile(p) for p in [
    r"(?<!olib )(?<!ob )(?<!op )\bketaman\b", COUNT + PEOPLE + r"\b(?!\s*(kera|kk\b|k\s?k\b|olam))",
    r"\b(bir|bitta|1)\s*(ta\s*)?(xoji|bobo|momo|ayol|qiz|bola|o'g'il|ugil)\w*(\s+\w+)?\s+(bor|ketadi)",
    r"\bketadig[ao]n\w*\s*" + COUNT + PEOPLE, r"\bkim\s*k[ie]tadi",
    r"\b(ketadig[ao]n|yuradigan|ketayotgan|ketvotgan|ketyotgan)\w*\s*(bo?r?mi|yomi)"]]


def score(m):
    """Strong signals first; weak passenger wording counts only when nothing else is there."""
    d, s = sum(1 for r in DRIVER if r.search(m)), sum(1 for r in PASSENGER if r.search(m))
    return (d, s) if d or s else (0, sum(1 for r in WEAK_PASSENGER if r.search(m)))


def phones(text):
    return {"+998" + "".join(g) for g in PHONE.findall(text)}


def route(cleaned):
    found = [p for p in map(place_of, cleaned.split()) if p and p[2] != "in"]
    kinds = []
    for i, (_, region, kind, _) in enumerate(found):
        if not kind:
            nxt = [k for _, _, k, _ in found[i + 1:] if k]
            kind = nxt[0] if nxt else "to" if "from" in kinds and "to" not in kinds else "from" \
                if "to" in kinds or not kinds else "to"
        kinds.append(kind)
    side = {k: list(dict.fromkeys(f[1] for f, kk in zip(found, kinds) if kk == k)) for k in ("from", "to")}
    return side["from"], [r for r in side["to"] if r not in side["from"]]


def fields(cleaned):
    m = matchable(cleaned)
    origins, dests = route(cleaned)
    seat = SEATS.search(m)
    n = seat and (int(seat[1]) if seat[1].isdigit() else WORD_NUM.get(seat[1], 4))
    hours = next((t for t in (rx.search(m) for rx in TIME) if t and 0 <= int(t[1]) <= 23), None)
    return {
        "from": ", ".join(origins), "to": ", ".join(dests),
        "day": next((d for d, p in DAY if re.search(p, m)), ""), "part": next((d for d, p in PART if re.search(p, m)), ""),
        "time": hours and (str(int(hours[1])) + (" … " + str(int(hours[2])) if hours[2] and 0 <= int(hours[2]) <= 23 else "")),
        "seats": n if n and 1 <= n <= 8 else "", "car": next((c for c, r in CAR_RE if r.search(m)), ""),
        "post": bool(re.search(POST + r"\W{0,6}(([hxy]am\W{0,6})?x?ol[ai]|xizmat|(m|miz)?\s*(ham\s*)?bor\b)", m)),
        "woman_in_car": bool(re.search(r"\b(ayol|qiz)\w*\s*(k[iye]?sh[iy]\w*|bola\w*)?\s*bor", m)),
        "woman": bool(re.search(r"\b(ayol|qiz)", m)), "bagaj": bool(re.search(r"\b(bagaj|bogaj)\w*\s*bor", m)),
        "cond": bool(re.search(r"\bk[ao]nd\w*n[ea]r", m))}


def when(f):
    text = " ".join(x for x in (f["day"], f["part"]) if x)
    text = ", ".join(x for x in (text, f["time"] and "soat " + f["time"]) if x)
    return text[:1].upper() + text[1:]


def standard(role, f, tel):
    if role not in ("driver", "passenger"):
        return ""
    way = f["from"] + " → " + f["to"] if f["from"] and f["to"] else f["from"] and f["from"] + "dan" or f["to"] and f["to"] + "ga"
    if role == "driver":
        extra = [f["seats"] and f"{f['seats']} kishi kerak", f["car"] and "Mashina: " + f["car"], f["post"] and "Pochta olamiz",
                 f["woman_in_car"] and "Mashinada ayol bor", f["bagaj"] and "Tepa bagaj bor", f["cond"] and "Konditsioner bor"]
    else:
        extra = [f["seats"] and f"{f['seats']} kishi", f["post"] and "Pochta bor", f["woman"] and "Ayol kishi bor"]
    parts = [way, when(f)] + extra + [tel and "Tel: " + tel]
    return ". ".join(str(p) for p in parts if p) + "."


POINTS = [("Toshkent", n, re.compile(r"\b(" + p + r")")) for n, p in [
    ("Ipodrom", r"ip[oa]d[iy]?rom"), ("TTZ", r"ttz"), ("Qoʻyliq", r"[qk]o'?[yu]li[qk]|kuyli[qk]"),
    ("Qoraqamish", r"[qk]ora[qk]amish"), ("Sergeli", r"serg[ei]li"), ("Yarmarka", r"yarmarka"),
    ("Yunusobod", r"yun[iu]?sobo[dt]"), ("Chilonzor", r"chilonzor"), ("Olmazor", r"olmazor"), ("Uchtepa", r"uchtepa"),
    ("Choshtepa", r"choshtepa"), ("Shayxontohur", r"shayxontohur"), ("Yashnobod", r"yashnobo"),
    ("Maksim Gorkiy", r"maksim\s*gor"), ("Keles", r"k[ei]l[ei]s\b"), ("Vodnik", r"vodnik"),
    ("Vokzal", r"(avto)?vokzal"), ("Xamza", r"[xh]amza"), ("Nurafshon", r"nur[ao]fsho"), ("Chirchiq", r"chirchi[qk]"),
    ("Yangiyoʻl", r"yangiyo'?l"), ("Angren", r"ang[iy]?ren"), ("Ohangaron", r"o[xh]angaron")]] + \
    [("Qashqadaryo", n, re.compile(r"\b(" + p + r")")) for n, p in [
    ("Yakkabogʻ markazi (posyolka)", r"p[ao]s[yëe]?[oe]?lka|poselka|posyolka"), ("Sharq yulduzi", r"sharq\s*yulduz"),
    ("Engels (Ingliz)", r"engel|engil|ingil|ingliz|ingls"), ("Kalinin", r"kal[il]i?[ln]in"), ("Budyonniy", r"bud[yi]on+"),
    ("Stansiya", r"i?stans|styank|stansiya"), ("Lolazor", r"lolazor"), ("Toshqishloq", r"toshqishloq"),
    ("Qoramurcha", r"[qk]oramurcha"), ("Terak", r"terak"), ("Tatar", r"tatar"), ("Qayragʻoch", r"qayrag'?och"),
    ("Gʻurjob", r"g'?urjob"), ("Samok", r"samok"), ("Turon", r"turon"), ("Mevazor", r"mevazor"),
    ("Mirishkor", r"mirishkor"), ("Qiziltepa", r"[qk]iziltepa"), ("Kasbi", r"kasbi"), ("Jeynov", r"j[ei]y?nov")]] + \
    [("Другое", "Aeroport", re.compile(r"\baeroport"))]
DOOR = re.compile(r"\bmanzildan\s*manzil|\bshahar\s*ichidan|\buy(ingiz)?dan\s*(olib|ob)|\bshaxardan|\bshahardan")
WHEN_FULL = re.compile(r"\btay+[oy]?riga|\btoʻlsa\s*toʻlmasa|\btulsa\s*tulmasa|\bto'lsa")
PRICE = re.compile(r"(?<![\d+])(\d{2,3})\s*(ming\w*|minh\w*|min\b|k\b|000\s*(so'm|som|sum)|beraman|dan\s+\d\s*(ta\s*)?(kishi|odam|bola))")
SPAM = re.compile(r"sotiladi|sotaman|sotamiz|kafel|g'isht|septik|qazish|antiradar|\bmollar|chorva|podrabot|finans|usdt|"
                  r"kripto|tabrik|aviachipta|uchrashuv|erkaklar|kanalim|spamdan|akk?ount|premium|obunachi|shogirt|"
                  r"o'tin|\butin\b|pechka|lich\s*yoz|\bv\s*ls\b|proofl|deqat|avarini|kredit|\bishga\b|babok|pishi mne|"
                  r"company|trade|money|qizlar va|loto|kazino|stavka|advertis|kunjut|sedana|\braps\b|indov")
MODERATION = re.compile(r"reklama tarqatmang|haqoratli so'?z yubormang|kunlik xisobot|guruh tozalanmoqda|kirdi.chiqdi|"
                        r"^/\w|tozala\w*bot")
NOISE = {"Модерация", "Спам и реклама", "Разговор"}


def points(m):
    return [(side, name) for side, name, rx in POINTS if rx.search(m)]


def price(m):
    p = PRICE.search(m)
    return int(p[1]) * 1000 if p and 30 <= int(p[1]) <= 1500 else ""


def category(m, d, s, has_place, sender=""):
    if MODERATION.search(m) or "tozala" in sender.lower():
        return "Модерация"
    if SPAM.search(m) and (not has_place or not (d or s)):
        return "Спам и реклама"
    if d > s:
        return "Водитель"
    if s > d:
        return "Пассажир"
    return "Неясно" if has_place or d or PHONE.search(m) else "Разговор"
