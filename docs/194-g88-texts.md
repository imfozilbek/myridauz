# 194. G88: новые тексты карточек «поделиться» на согласие владельца

> **Кратко:** все новые и изменённые тексты G88 (`193`). Основа: тексты флаера и рекламы Telegram Ads, которые выбрал владелец (`38`). Ключи в `packages/i18n/locales/uz-Latn/share.json` (кроме отмеченных). `{brand}`: имя среды («MyRida» внутри команды, «Rida» в проде, `179`). Ждёт согласия владельца и проверки носителем (`25`).

## Строки пользы (новые)

| Ключ | Текст | Где |
|---|---|---|
| `value.passenger` | Raqamingiz yashirin. Telegramda ochiladi. Ilova yuklab olish shart emas. | все сообщения, которые читает будущий попутчик |
| `value.driver` | Narxni oʻzingiz belgilaysiz. Har 10 daqiqada yozish shart emas. | сообщение в группу района (петля 2), читают водители |
| `value.bonus` | Yangi haydovchilarga {bonus}gacha bonus. | там же, пока бонус есть в бренде |
| `value.service` | Tekshirilgan haydovchilar. Raqamingiz yashirin. | «Doʻstga» под постом канала, доска дня, итог недели |

- В карточке самого водителя «tekshirilgan» нет (решение владельца 15.10.2026, `187`).
- `{bonus}`: «1 500 000 soʻm» (3 × 500 000, как в приветствии бота водителя).

## Карточка поездки водителя (новая)

Кнопки «Havolani yoʻlovchilarga yuborish» в «Mening safarim» и «🔗 Havolani yuborish» в боте водителя.

| Ключ | Текст |
|---|---|
| `trip.title` | Safarimda boʻsh joy bor |
| `trip.text` | Safarimda {seats} ta boʻsh joy bor · 🟢 {from} · 🔴 {to} · 🗓 {date}, soat {time} · 💰 Bir joy {price} |

- Каждая часть с новой строки; под ними пустая строка и `value.passenger`.
- Кнопка: «Joy band qilish» (есть).
- Картинка карточки (Mini App): заголовок `storyTitle`, маршрут, время, места, цена, «Joy band qilish», значки `picture.hidden` и `picture.telegram`.

## История поездки и картинки

| Ключ | Было | Стало |
|---|---|---|
| `storyTitle` | Yangi safar | Boʻsh joy bor |
| `storyCaption` | {from} → {to}, {date} soat {time}. {seats} ta joy bor. Joy band qilish: {link} | {from} → {to}, {date} soat {time}. Joy band qilish: {link} |
| `picture.hidden` (новый) | | Raqamingiz yashirin |
| `picture.telegram` (новый) | | Telegram ichida |

- Подпись истории короче: у обычного аккаунта Telegram до 200 знаков, а ссылка поездки длинная. Места и польза теперь на картинке.
- Картинка QR: под «Skanerlang: {brand} bilan yoʻlga chiqing» строка `value.passenger` (текст есть).

## Моменты и «Sizning taʼsiringiz» (`growth.json`)

| Ключ | Было | Стало |
|---|---|---|
| `message.text` | «{phrase}» · {name} · {fact} · Siz ham {name} bilan yoʻlga chiqing: | «{phrase}» · {name} · {fact} · `value.passenger` · Siz ham {name} bilan yoʻlga chiqing: |
| `link.driver` | {name} bilan yoʻlga chiqish | Safar topish |
| `invite.text` (новый) | | Men {brand} bilan yoʻlga chiqaman. Siz ham qoʻshiling! |

- `link.driver`: ссылка открывает бот попутчика, а не поездки водителя. Кнопка говорит честно, куда ведёт.
- `invite.text`: готовая карточка «Yana ulashish», под ней `value.passenger`; кнопка «Men ham qoʻshilaman» (есть), заголовок «Men {brand} bilan» (есть).

## Петли 2, 3, 4 и каналы: только добавленная строка

| Где | Добавлено в конце |
|---|---|
| Сообщение в группу района (`growth.group.message`) | `value.driver` и `value.bonus` |
| Сообщение другу о свободных местах (`growth.seats.message`) | `value.passenger` |
| Карточка «Yaqinlarimga» (`bot.share.invite`) | `value.passenger` |
| «Doʻstga», доска дня, итог недели (`bot.channel.shareText`, `bot.board.shareText`, `bot.weekSum.shareText`) | `value.service` |

## Удалено

- `share.sendHint` («Yaqinlaringiz safarni kuzatib boradi»): нигде не показывается.
