"""Telegram Desktop HTML export -> messages: (id, sender key, name, date, text, forwarded from)."""
import re
from html.parser import HTMLParser

MONTHS = {m: i for i, ms in enumerate([
    ("января", "january"), ("февраля", "february"), ("марта", "march"), ("апреля", "april"), ("мая", "may"),
    ("июня", "june"), ("июля", "july"), ("августа", "august"), ("сентября", "september"),
    ("октября", "october"), ("ноября", "november"), ("декабря", "december")], 1) for m in ms}


def parse_date(title):
    d = re.match(r"(\d\d)\.(\d\d)\.(\d{4}) (\d\d:\d\d:\d\d)", title)
    if d:
        return f"{d[3]}-{d[2]}-{d[1]} {d[4]}"
    d = re.match(r"(\d{1,2}) (\w+) (\d{4}),? (\d\d:\d\d:\d\d)", title)
    if d and d[2].lower() in MONTHS:
        return f"{d[3]}-{MONTHS[d[2].lower()]:02d}-{int(d[1]):02d} {d[4]}"
    return ""


def file_order(path):
    n = re.search(r"messages(\d*)\.html$", path.name)
    return (n is None, int(n[1] or 1) if n else 0, path.name)


class Export(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title, self.head, self.messages, self.sender = "", "", [], None
        self.stack, self.msg, self.cap, self.buf, self.in_title = [], None, None, [], False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.in_title = self.in_title or tag == "title"
        if tag == "br" and self.cap:
            self.buf.append("\n")
        if tag == "img" and self.msg and not self.msg["author"]:
            m = re.search(r"author_(\d+)", a.get("src") or "")
            self.msg["author"] = m[1] if m else ""
        if tag != "div":
            return
        cls = set((a.get("class") or "").split())
        self.stack.append(cls)
        hidden = any({"forwarded", "reply_to"} & c for c in self.stack)
        if {"message", "default"} <= cls:
            mid = re.sub(r"\D", "", a.get("id") or "")
            self.msg = {"id": mid, "from": None if "joined" in cls else "", "author": "", "date": "", "text": "",
                        "fwd": "", "depth": len(self.stack)}
        elif cls & {"text", "name"} and "bold" in cls and any("page_header" in c for c in self.stack):
            self.cap, self.buf = ("head", len(self.stack)), []
        elif self.msg and hidden and "forwarded" in cls:
            self.msg["fwd"] = "?"
        elif self.msg and not hidden:
            if {"date", "details"} <= cls and not self.msg["date"]:
                self.msg["date"] = a.get("title", "")
            elif "from_name" in cls or "forwarded_from" in cls or cls == {"text"}:
                kind = "from" if "from_name" in cls else "fwd" if "forwarded_from" in cls else "text"
                self.cap, self.buf = (kind, len(self.stack)), []

    def handle_endtag(self, tag):
        self.in_title = self.in_title and tag != "title"
        if tag != "div" or not self.stack:
            return
        if self.cap and self.cap[1] == len(self.stack):
            value = re.sub(r"[ \t]+", " ", "".join(self.buf)).strip()
            if self.cap[0] == "head":
                self.head = self.head or value
            else:
                self.msg[self.cap[0]] = re.sub(r"\s+via @\w+$", "", value) if self.cap[0] == "from" else value
            self.cap = None
        if self.msg and self.msg["depth"] == len(self.stack):
            self.finish()
        self.stack.pop()

    def handle_data(self, data):
        if self.in_title and not self.title:
            self.title = data.strip()
        if self.cap:
            self.buf.append(data)

    def finish(self):
        m, self.msg = self.msg, None
        if m["from"]:
            self.sender = (m["author"] or "name:" + m["from"], m["from"])
        elif m["from"] == "":
            self.sender = None
        date = parse_date(m["date"])
        fwd = re.sub(r"^Forwarded from\s*", "", m["fwd"]) if m["fwd"] else ""
        if self.sender and fwd.endswith(self.sender[1]):
            fwd = ""
        if self.sender and date and m["text"]:
            self.messages.append((m["id"], *self.sender, date, m["text"], fwd))
