"""The screen a person sees before pressing Start: bot description and short description.
Usage: tg_bot_profile.py <token file>"""
import sys
from pathlib import Path

from tg_post import api

DESCRIPTION = ("Rida doskasidagi haydovchi raqamini koʻrish uchun Start bosing.\n"
               "Raqam faqat shu yerda ochiladi, kanalda yashirin turadi.\n\n"
               "Haydovchimisiz? Start bosing: eʼloningiz doskaga chiqadi.")
SHORT = "Yakkabogʻ, Shahrisabz, Kitob va Toshkent: haydovchilar doskasi. Raqamlar shu yerda ochiladi."


def main():
    token = Path(sys.argv[1]).read_text(encoding="utf-8").strip()
    assert len(DESCRIPTION) <= 512 and len(SHORT) <= 120, (len(DESCRIPTION), len(SHORT))
    for method, payload in (("setMyDescription", {"description": DESCRIPTION}),
                            ("setMyShortDescription", {"short_description": SHORT})):
        r = api(token, method, payload)
        print(method + ":", "ok" if r.get("ok") else r.get("description"))
    print("описание:", api(token, "getMyDescription", {}).get("result", {}).get("description", "")[:60], "…")


if __name__ == "__main__":
    main()
