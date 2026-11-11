# 227. G97: новые тексты на согласие владельца

> **Кратко:** тексты помощи G97 (`226`): подписи экрана и ботов, 11 новых ответов, 1 дополненный, 7 ответов сайта без изменений, и 3 старых текста, которые спорят с кодом. Всё по `25` (oʻ, gʻ: U+02BB; ʼ: U+02BC). Числа в фигурных скобках берутся из бренда и «Cheklovlar», в текст не пишутся. Нужен «да» владельца (`33`); проверка носителем: OPS-07.

## Подписи

| Ключ | Текст |
|---|---|
| `help.title` | Yordam |
| `help.lead` | Javobni shu yerdan toping yoki jamoamizga yozing. |
| `help.more` | Boshqa savolim bor |
| `help.moreHint` | Jamoamiz har kuni soat {from} dan {to} gacha javob beradi |
| `help.link` | {topic} boʻyicha savollar (например: «Hamyon va komissiya boʻyicha savollar») |
| `help.topic.find` | Safar topish |
| `help.topic.booking` | Joy band qilish |
| `help.topic.driver` | Haydovchi boʻlish |
| `help.topic.wallet` | Hamyon va komissiya |
| `help.topic.account` | Hisob va xavfsizlik |
| `bot.help.topics` | Savolingiz qaysi mavzuda? |
| `bot.help.questions` | «{topic}»: savolni tanlang. |
| `bot.help.back` | ⬅️ Mavzular |
| `bot.help.more` | ✍️ Boshqa savolim bor |
| `bot.commands.help` | Savollar va javoblar |
| `stats.help.title` (команде, «Statistika») | Yordam: koʻp ochilgan savollar |
| `stats.help.more` (команде, «Statistika») | Javobdan keyin jamoaga yozdi: {count} |
| `bot.support.ask` | Savolingizni shu yerga yozing. 🎤 Ovozli xabar yoki 🖼 rasm ham yuborsa boʻladi. |

`bot.support.welcome`, было: «…Bu yerga yozing: 💬 Safar, bron, hamyon yoki hisob boʻyicha savolingiz…». Стало:

> Assalomu alaykum! Bu {brand} yordam xizmati.
>
> Koʻp beriladigan savollarga javob pastda. Javob topmasangiz, «Boshqa savolim bor»ni bosing yoki savolingizni shu yerga yozing.
> 🕖 Jamoamiz har kuni soat {from} dan {to} gacha javob beradi.

## Новые ответы (11)

1. **Safarni qanday topaman?** Bosh ekranda «Qayerdan» va «Qayerga»ni tanlang, keyin «Safar topish»ni bosing. Bitta joyni tanlash ham yetadi. Kunni tanlang va safarni bosing: haydovchi, mashina va narx koʻrinadi.
2. **Joyni qanday band qilaman?** Safarni oching, necha kishi ketishini tanlang va «Joy band qilish»ni bosing. Olib ketish va tushirish joyini belgilang, keyin «Soʻrov yuborish»ni bosing. Haydovchi tasdiqlasa, joy sizniki. Pulni haydovchiga safarda oʻzingiz berasiz.
3. **Haydovchi qachon javob beradi?** Haydovchi {hours} soat ichida javob beradi, lekin safar vaqtidan kechikmaydi. Muddat kechaga toʻgʻri kelsa, ertalab soat {morning} gacha uzayadi. Javob boʻlmasa, soʻrov oʻzi bekor boʻladi va {brand} oʻxshash safarlarni koʻrsatadi.
4. **Joyni qanday bekor qilaman?** Bosh ekranda joyingizni oching va «Joyni bekor qilish»ni bosing. Haydovchi bu haqda xabar oladi. Safar vaqti kelgach yoki haydovchi yoʻlga chiqqach, joyni bekor qilib boʻlmaydi.
5. **Haydovchi bilan qanday bogʻlanaman?** Joy soʻrovini yuborganingizdan keyin «Xabar yozish» ochiladi. Haydovchi tasdiqlagach, «Qoʻngʻiroq» ham ochiladi. Yozishma va qoʻngʻiroq {brand} ichida boʻladi, telefon raqamingizni hech kim koʻrmaydi.
6. **Haydovchi boʻlish uchun nima kerak?** Yuzingiz rasmi, mashina maʼlumotlari (model, rang, davlat raqami, yoʻlovchi joylari) va mashinaning old tomondan, raqami koʻrinadigan bitta rasmi. Hujjat kerak emas. @{driverBot} botini oching va arizani yuboring.
7. **Arizam qachon koʻrib chiqiladi?** Jamoamiz arizalarni har kuni soat {from} dan {to} gacha tekshiradi, odatda 1 soat ichida. Kechasi yuborilgan ariza ertalab koʻriladi. Javob haydovchi botiga va ilovaning bosh ekraniga keladi.
8. **Arizam qaytarildi. Nima qilaman?** Botdagi xabarda nimani tuzatish kerakligi yozilgan. Ilovani oching va bosh ekranda «Tuzatish»ni bosing. Belgilangan joylarni tuzating va «Qayta yuborish»ni bosing. Ariza rad etilgan boʻlsa, «Boshqa savolim bor» orqali jamoaga yozing.
9. **Hamyonni qanday toʻldiraman?** «Hamyon»da «Hisobni toʻldirish»ni bosing. Yordam boti tayyor xabar bilan ochiladi: uni yuboring, jamoamiz qanday toʻlashni yozadi. Komissiya avval bonusdan, keyin asosiy hisobdan olinadi.
10. **Yoʻlovchi kelmasa, komissiya qaytadimi?** Ha, jamoa tekshirgandan keyin. Safaringizda yoʻlovchi yonidagi «Kelmadi»ni bosing: bu tugma safar vaqtidan {meetMinutes} daqiqa oldin chiqadi. Jamoa tasdiqlasa, komissiya hamyoningizga qaytadi.
11. **Maʼlumotlarimni qanday oʻchiraman?** Profilni oching va eng pastdagi «Maʼlumotlarimni oʻchirish»ni bosing. Faol safar va joylaringiz bekor boʻladi; ism, telefon, rasm va yozishmalar oʻchadi; hamyondagi pul ham nolga tushadi. Buni qaytarib boʻlmaydi.

## Дополненный ответ (1)

**Mos safar boʻlmasa-chi?** На сайте было только «Xabar bering». В Mini App есть три пути, поэтому:

> Uch yoʻl bor.
> • «Xabar bering»: shu yoʻnalishda yangi safar chiqqanda {brand} sizga yozadi.
> • «Soʻrov qoldirish»: haydovchilar soʻrovingizni koʻradi va taklif yuboradi.
> • «Kanalga qoʻshilish»: yoʻnalish kanalida yangi safarlar chiqadi.

## Ответы сайта без изменений (7)

`landing.faq.*`, одобрены раньше (`60`): «{brand} taksimi?», «Narxni kim belgilaydi?», «Haydovchi qanday tekshiriladi?», «Telefon raqamim koʻrinadimi?», «Ilova yuklab olish kerakmi?», «Haydovchi uchun qancha turadi?» и «Muammo boʻlsa, kimga yozaman?» (только на сайте). Ключи переезжают в `help.*`, слова те же.

## Старые тексты, которые спорят с кодом (T9)

| Ключ | Было | Стало |
|---|---|---|
| `legal.offer.5.text`, последнее предложение (оферта) | Bir vaqtda haydovchida 5 tagacha faol safar, yoʻlovchida 3 tagacha ochiq soʻrov va 3 tagacha joy soʻrovi boʻlishi mumkin. | Bir vaqtda haydovchida bitta faol safar, yoʻlovchida bitta ochiq soʻrov va bitta joy boʻlishi mumkin. |
| `home.dock.carFill` | Mashina, raqam va 3 ta rasm · 3 daqiqa | Mashina, raqam va rasm · 3 daqiqa |
| `bookings.done.why` | {brand} orqali: yaqinlaringiz kuzatadi, shikoyat qilish mumkin, kelmasa pul qaytadi. | {brand} orqali: yaqinlaringiz kuzatadi, muammo boʻlsa shikoyat qilasiz, raqamingiz yashirin qoladi. |

Почему: код разрешает одну поездку, одну заявку и одно место одновременно; водитель шлёт одно фото машины; попутчик платит водителю сам, вернуть можно только комиссию водителю (`226`, раздел «Находки»).

## Согласие

| Дата | Решение владельца |
|---|---|
| 11.11.2026 | «Да» владельца на все тексты этого файла, на макет `goals/g97/1-help.png` и на 3 исправления старых текстов (оферта: юр. документ) |
