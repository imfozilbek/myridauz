# 110. G39: новые тексты на согласие владельца

> **Кратко:** восемнадцать текстов цели G39 (`goals/G39-trip-changes.md`, решения `104`) на узбекском, по `25`. Статус: в коде (ключи ниже), ждут согласия владельца вместе с видом экранов; дальше проверка носителем (`25`).

## Экран водителя: изменить поездку

| № | Ключ | Где | Текст |
|---|---|---|---|
| C1 | `market.change.section` | Заголовок блока на своей поездке | Oʻzgartirish |
| C2 | `market.change.time` | Строка блока: сдвинуть время | Vaqtni surish |
| C3 | `market.change.price` | Строка блока: снизить цену | Narxni tushirish |
| C4 | `market.change.timeTitle` | Заголовок экрана времени | Qachon joʻnaysiz? |
| C5 | `market.change.timeHint` | Подсказка под заголовком | Faqat keyinroqqa, jami 1 soatgacha. Band qilgan yoʻlovchilarga xabar boradi. |
| C6 | `market.change.at` | Вариант времени | soat {time} |
| C7 | `market.change.later` | Подпись варианта | +{minutes} daqiqa |
| C8 | `market.change.timeAsk` | Окно Telegram «Вы уверены?» | Joʻnash vaqti soat {time} boʻladimi? Yoʻlovchilarga xabar boradi. |
| C9 | `market.change.priceTitle` | Заголовок экрана цены | Yangi narx |
| C10 | `market.change.priceHint` | Подсказка под заголовком | Faqat pastga. Band qilinganlar eski narxda qoladi. Yoʻlovchilar va obunachilarga xabar boradi. |
| C11 | `market.change.priceAsk` | Окно Telegram «Вы уверены?» | Bir joy narxi {price} boʻladimi? |
| C12 | `market.change.priceMin` | Цена уже на нижней границе | Narx eng past chegarada, uni endi tushirib boʻlmaydi. |
| C13 | `market.change.save` | Кнопка подтверждения в окне | Ha, oʻzgartirish |

## Поиск: значки наверху

| № | Ключ | Где | Текст |
|---|---|---|---|
| M1 | `market.mark.soon` | Значок на карточке: отъезд в ближайший час | Tez orada joʻnaydi |
| M2 | `market.mark.cheaper` | Значок на карточке: цена ниже первой | Narxi tushdi |

## Сообщения ботов

| № | Ключ | Кому | Текст |
|---|---|---|---|
| B1 | `bot.booking.retimed` | Попутчик с бронью, бот попутчика | Haydovchi joʻnash vaqtini oʻzgartirdi. {from} → {to}. {date}, endi soat {time}. |
| B2 | `bot.booking.cheaper` | Попутчик с бронью | Haydovchi yangi yoʻlovchilar uchun narxni tushirdi: {from} → {to}, {date}. Siz band qilgan joy narxi oʻzgarmaydi. |
| B3 | `bot.subscription.cheaper` | Подписчик направления, не чаще раза в сутки на поездку | Siz kutgan yoʻnalishda safar arzonlashdi. {from} → {to}. {date}, soat {time}. Boʻsh joylar: {seats}, endi bir joy {price}. |

В B1 и B3 между строками стоит перенос строки, как в других сообщениях ботов.

## Как проверить

- Снимки экранов: `docs/screens/g39/` (Android и iOS, «до» и «после»).
- Сценарии стенда: `e2e/stand/trip-changes.spec.ts`.
