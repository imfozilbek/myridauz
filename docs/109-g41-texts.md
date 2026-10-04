# 109. G41: тексты новых фильтров на согласие владельца

> **Кратко:** 3 фильтра из `108` требуют новых текстов. Ниже 9 текстов на узбекском (латиница). Слова взяты из уже согласованных текстов (`25`, глоссарий). Владелец согласовал 04.10.2026, тексты в коде (PR #121). Проверяет носитель (OPS-03).

## X1. Часть дня в результатах поиска (F-P6)

Где: результаты поиска попутчика, над списком, рядом с выбором мест. Выбор одним касанием (SegmentedControl).

| Ключ | Текст | Часы (Ташкент) |
|---|---|---|
| `market.filter.dayPart.any` | Istalgan | весь день |
| `market.filter.dayPart.morning` | Ertalab | 05:00 … 11:59 |
| `market.filter.dayPart.day` | Kunduzi | 12:00 … 16:59 |
| `market.filter.dayPart.evening` | Kechqurun | 17:00 … 04:59 |

## X2. Способ посадки на заявке попутчика (F-D5)

Где: карточка заявки у водителя. Сейчас для попутчика есть «Uyimdan» и «Pitakdan» (от его лица); водителю нужно от третьего лица.

| Ключ | Текст |
|---|---|
| `way.request.door` | Uyidan olib ketish |
| `way.request.pitak` | Pitakdan olib ketish |
| `way.request.both` | Uyidan yoki pitakdan |

## X3. Очередь заявок водителей в админке (F-A2)

Где: «Arizalar» в админке. Число в заголовке и время ожидания у каждой заявки (как в сообщении бота `moderation.waiting`).

| Ключ | Текст |
|---|---|
| `moderation.queue.count` | Navbatda: {count} |
| `moderation.queue.waiting` | {minutes} daqiqadan beri kutmoqda |

## Почему так

- X1: «Ertalab, Kunduzi, Kechqurun» уже в G29 (`90`, F-P6); «Istalgan» как «Istalgan kun» в подписках; «Istalgan vaqt» не помещается на 360 px.
- X2: «olib ketish» как в «Olib ketish joyi»; без «uyim/uyingiz», чтобы не путать, кто говорит.
- X3: «daqiqadan beri kutmoqda» как в боте команды; одна форма для всех.
