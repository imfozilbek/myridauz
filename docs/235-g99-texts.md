# 235. G99: новые тексты на согласие владельца

> **Кратко:** тексты разделов «Yoʻl manbalari», «Telegram versiyalari», «Telegram ilovalari», кнопки файла для аналитика, периода «30 kun» и подписи файла в боте (G99, `234`). Пишем латиницей (`uz-Latn`), люди видят кириллицу (`228`). Названия «CSV», «Mac», «Web A», «Web K» остаются латиницей. Ключи: `stats.json`, `bot.json`.

## «Statistika»

| Ключ | Текст |
|---|---|
| `stats.period.month` | 30 kun |
| `stats.compare.month` | ↑ ↓ oldingi 30 kunga nisbatan |
| `stats.arrival.group` | Yoʻnalish guruhi |
| `stats.arrival.bot` | Bot xabari |
| `stats.paths.sources` | Yoʻl manbalari |
| `stats.paths.sourcesHint` | Odamlar birinchi marta qayerdan kelgan va har qadamda nechtasi qolgan. |
| `stats.paths.versions` | Telegram versiyalari |
| `stats.paths.platforms` | Telegram ilovalari |
| `stats.paths.versionsHint` | Eski va boshqa Telegram ilovalarida ilova ishlayaptimi: odamlar, xatolar va yoʻl. |
| `stats.paths.row` | {people} kishi · {errors} xato |
| `stats.paths.empty` | Bu davrda hali hech kim yoʻq |
| `stats.paths.tg.old` / `v7` / `v8` / `none` | 7.0 dan eski / 7.x / 8.0 va yangi / Versiyasi nomaʼlum |
| `stats.paths.platform.*` | Android, iPhone, Kompyuter, Mac, Telegram Web A, Telegram Web K, Nomaʼlum ilova, Boshqa ilova |
| `stats.paths.file` | Tahlilchi uchun fayl |
| `stats.paths.fileHint` | CSV fayl botga keladi: odamlar yoʻli va xatolar, ism va telefonsiz. |
| `stats.paths.fileSent` | Fayl botga yuborildi. |

## Новые шаги пути

| Ключ | Текст |
|---|---|
| `stats.step.found` | Safar topdi |
| `stats.step.rode` | Safarga chiqdi |
| `stats.step.first_booking` | Birinchi yoʻlovchisi |
| `stats.step.trip_done` | Safarni yakunladi |

Остальные шаги («Ilovani ochdi», «Qayerdan tanladi», «Joy soʻradi» и другие) уже утверждены (`56`).

## Бот

| Ключ | Текст |
|---|---|
| `bot.stats.pathsFile` | 📊 Tahlilchi uchun fayllar: {period}. Odamlar yoʻli va xatolar, ism va telefonsiz. |

## Строка в «Maxfiylik siyosati» (предложение, `30`)

Сейчас статистика не связана с человеком. После G99 события несут публичный id человека, версию Telegram и вид приложения. Предлагаю дописать в `legal.privacy.2.text`, пункт про статистику:

> «… ilovaga nima orqali kirildi (bot xabari, menyu yoki havola), Telegram ilovasi va uning versiyasi. Statistika hisobingizga ichki raqam bilan bogʻlanadi. Unda ism, telefon raqami va xabarlar boʻlmaydi.»

Статус: ждёт «да» владельца на тексты, вид (снимки `screenshots/g99-*.png`) и строку политики.
