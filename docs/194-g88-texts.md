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
| `trip.text` | Safarimda {seats} ta boʻsh joy bor · 🟢 {from} · 🔴 {to} · 🗓 {date} soat {time} · 💰 Bir joy {price} |

- Каждая часть с новой строки; под ними пустая строка и `value.passenger`.
- Кнопка: «Joy band qilish» (есть).
- Картинка карточки (Mini App, квадрат): заголовок `storyTitle`, маршрут, время, места, цена, значки `picture.hidden` и `picture.telegram`; кнопка только настоящая, под картинкой.

## История поездки и картинки

| Ключ | Было | Стало |
|---|---|---|
| `storyTitle` | Yangi safar | Boʻsh joy bor |
| `storyCaption` | {from} → {to}, {date} soat {time}. {seats} ta joy bor. Joy band qilish: {link} | {from} → {to}, {date} soat {time}. Joy band qilish: {link} |
| `picture.hidden` (новый) | | Raqamingiz yashirin |
| `picture.telegram` (новый) | | Telegram ichida |

- Подпись истории короче: у обычного аккаунта Telegram до 200 знаков, а ссылка поездки длинная. Места и польза теперь на картинке.
- Вид (на согласие): история поездки и QR теперь бирюзовые и из приложения водителя, их открывает попутчик; шрифт без засечек (`193`).
- Картинка QR: под «Skanerlang: {brand} bilan yoʻlga chiqing» значки `picture.hidden` и `picture.telegram`.

## Моменты и «Sizning taʼsiringiz» (`growth.json`)

| Ключ | Было | Стало |
|---|---|---|
| `message.text` | «{phrase}» · {name} · {fact} · Siz ham {name} bilan yoʻlga chiqing: | «{phrase}» · {name} · {fact} · `value.passenger` · Siz ham {brand} bilan yoʻlga chiqing: |
| `link.driver` | {name} bilan yoʻlga chiqish | Safar topish |
| `invite.text` (новый) | | Men {brand} bilan yoʻlga chiqaman. Siz ham qoʻshiling! |

- `link.driver` и конец `message.text`: ссылка открывает бот попутчика, а не поездки этого человека. Текст и кнопка говорят честно, куда ведут.
- `invite.text`: готовая карточка «Yana ulashish», под ней `value.passenger`; кнопка «Men ham qoʻshilaman» (есть), заголовок «Men {brand} bilan» (есть).

## Петли 2, 3, 4 и каналы: только добавленная строка

| Где | Добавлено в конце |
|---|---|
| Сообщение в группу района (`growth.group.message`) | `value.driver` и `value.bonus` перед «Haydovchilar, taklif yuboring:», чтобы двоеточие вело к кнопке |
| Сообщение другу о свободных местах (`growth.seats.message`) | `value.passenger` |
| Карточка «Yaqinlarimga» (`bot.share.invite`) | `value.passenger` |
| «Doʻstga», доска дня, итог недели (`bot.channel.shareText`, `bot.board.shareText`, `bot.weekSum.shareText`) | `value.service` |

## «Rost» в админке (`growth.json`, новые)

| Ключ | Текст |
|---|---|
| `rost.loop.trip` | Haydovchi havolasi |
| `rost.loop.story` | Safar hikoyasi |

## Без «делим расходы» (решение владельца 18.10.2026)

Везде убраны «yoʻl xarajatini boʻlishadi», «birga boʻlamiz», «birga koʻtaring», «qoplang», «… ga boʻlindi» (`25`). Где нужен текст, он из утверждённого флаера.

| Где (ключ) | Было | Стало |
|---|---|---|
| Описания и приветствия ботов, лендинг, опросник (`bot`, `bot-main`, `waitlist`, `landing`) | yoʻli bir odamlar bir mashinada boradi va yoʻl xarajatini boʻlishadi | yoʻli bir odamlar bir mashinada boradi |
| Приветствие попутчика (`common.welcome.woman`) | Yoʻl xarajatini birga boʻlamiz. | Mashinada ayol bor. |
| Приветствие водителя (`common.welcome.ownPrice`, `bot.driver.welcome`, картинка бота) | Yoʻl xarajatingiz qaytadi. | Narxni oʻzingiz belgilaysiz. |
| Бот водителя (`bot.profile.driver.*`), лендинг (`landing.driver.text`) | …yoʻl xarajatini birga koʻtaring / qoplang | Safaringizga yoʻlovchi toping. Narxni oʻzingiz belgilaysiz. |
| Каналы (`bot-channel.look.*`) | …yoʻlovchi oladi, yoʻl xarajati birga koʻtariladi. | …yoʻlovchi oladi. |
| Пост «Yetib bordi» (`bot.channel.split`) | Yoʻl xarajati N ga boʻlindi | строка убрана |
| Вопросы лендинга (`landing.faq.taxi.a`) | …Yoʻl xarajati hammaga boʻlinadi. | последнее предложение убрано |
| Цена водителя (`market.price.hint`) | Tavsiya: {price}. Bu yoʻl xarajatining bir kishiga toʻgʻri keladigan qismi. | Tavsiya: {price}. |
| «Haydovchi boʻling» (`home.becomeDriver.hint`) | Mashinangiz bormi? Xarajatni boʻling | Mashinangiz bormi? Yoʻlovchilar sizni topadi |
| Момент водителя (`growth.why.driver.title`) | Joy toʻlsa, yoʻl xarajati koʻproq boʻlinadi. | Yoʻlovchilar sizni topadi. |
| Карточка момента (`growth.fact.join`) | Birga borish, xarajatni boʻlish | Viloyatlararo birga safarlar |
| История для соцсетей, рекламное видео (бренд-пакет) | Yoʻl xarajatini birga koʻtaring; Yoʻl xarajati hammaga boʻlinadi | Narxni oʻzingiz belgilaysiz; Tekshirilgan haydovchilar |

- Не тронуто: оферта (`legal.offer.*`, юридический текст, `30`) и подписи сумм водителя «yoʻl xarajati» (`driverTrip.month.costs`, `driverAfter.done.sum`, урок №2).

## Удалено

- `share.sendHint` («Yaqinlaringiz safarni kuzatib boradi»): нигде не показывается.
