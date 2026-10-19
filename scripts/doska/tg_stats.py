"""Public Telegram page stats: members/online for groups, subscribers for channels, posts per day from the channel preview."""
import datetime as dt
import re
import subprocess
import sys

NAMES = sys.argv[1:]


def get(url):
    r = subprocess.run(["curl", "-sS", "-L", "--max-time", "20", url], capture_output=True, text=True)
    return r.stdout


for name in NAMES:
    page = get(f"https://t.me/{name}")
    extra = re.search(r'tgme_page_extra">([^<]*)', page)
    title = re.search(r'tgme_page_title[^>]*>\s*<span[^>]*>([^<]*)', page)
    if not extra:
        print(f"{name}: нет страницы")
        continue
    kind = "группа" if "online" in extra[1] else "канал"
    line = f"{name} | {(title[1] if title else '').strip()[:40]} | {kind} | {extra[1].strip()}"
    if kind == "канал":
        prev = get(f"https://t.me/s/{name}")
        times = [dt.datetime.fromisoformat(t.replace("+00:00", "")) for t in re.findall(r'datetime="([^"]+)"', prev)]
        if times:
            last = max(times)
            day = sum(1 for t in times if t > last - dt.timedelta(days=1))
            age = (dt.datetime.utcnow() - last).days
            line += f" | постов за последние сутки активности: {day} (на странице {len(times)}), последний пост {age} дн. назад"
        else:
            line += " | превью нет"
    print(line)
