# G21. Новые тексты на согласие владельца

> **Кратко:** все новые тексты цели G21 в одном месте. Язык: узбекский (латиница), по `../25`. Рядом перевод на русский, чтобы владелец понял смысл. Владелец одобряет или правит; носитель проверяет (`../33`).

## Вопросы «Вы уверены?» (B4)

| Ключ | Текст | Смысл |
|---|---|---|
| `bookings.cancelAsk` | Joyni bekor qilasizmi? Haydovchi bu haqda xabar oladi. | Пассажир отменяет место: водитель узнает |
| `bookings.driverCancelAsk` | Joyni bekor qilasizmi? Yoʻlovchi bu haqda xabar oladi. | Водитель отменяет бронь: пассажир узнает |
| `market.trip.cancelAsk` | Safarni bekor qilasizmi? Barcha yoʻlovchilar xabar oladi. | Водитель отменяет поездку: узнают все |
| `moderation.block.foreverAsk` | Butunlay bloklaysizmi? Uning safarlari va joylari bekor qilinadi. | Блок навсегда: поездки и места отменятся |

## Списки и поездки (B6, B8, C)

| Ключ | Текст | Смысл |
|---|---|---|
| `market.mine.more` | Yana koʻrsatish | Показать ещё |
| `market.trip.departed` | Bu safar yoʻlga chiqqan. Joy band qilib boʻlmaydi. | Поездка уже в пути, забронировать нельзя |
| `errors.bookings.departed` | Bu safar allaqachon yoʻlga chiqqan. Boshqa safarni tanlang. | Ошибка: поездка уже уехала |
| `market.trip.closed.full` | Boʻsh joy qolmagan. Boshqa safarni tanlang. | Мест нет |
| `market.trip.closed.cancelled` | Haydovchi bu safarni bekor qildi. Boshqa safarni tanlang. | Водитель отменил поездку |
| `market.trip.closed.completed` | Bu safar tugagan. | Поездка закончилась |
| `market.request.offers` | {count} ta taklif | «2 ta taklif»: число предложений на заявке |

## Водитель (C)

| Ключ | Текст | Смысл |
|---|---|---|
| `bookings.answerUntil` | Javob berish muddati | Срок ответа на бронь |
| `bookings.confirm.balance` | Hamyoningizda: {amount} | Сколько денег в кошельке |
| `bot.booking.pickupForDriver` | {name} oʻz uchrashuv joyini yubordi: {from} → {to}, {date}, soat {time}. Joyni koʻrish uchun ilovani oching. | Пассажир прислал место встречи |

## Админка (C)

| Ключ | Текст | Смысл |
|---|---|---|
| `moderation.history.title` | Oldingi qarorlar | Прошлые решения по заявке |
| `moderation.history.draft` | Qoralama | Черновик |
| `moderation.history.pending` | Tekshiruvga yuborilgan | Отправлена на проверку |
| `moderation.history.approved` | Tasdiqlangan | Одобрена |
| `moderation.history.rejected` | Rad etilgan | Отклонена |
| `moderation.history.changes_requested` | Tuzatish soʻralgan | Попросили исправить |
| `moderation.samePlate` | Bu davlat raqami yana {count} kishining arizasida bor. Tekshiring. | Этот номер машины есть ещё у N человек |
| `moderation.blocks.title` | Bloklar tarixi | Журнал блокировок |
| `moderation.blocks.none` | Hech qachon bloklanmagan | Ни разу не блокировали |
| `moderation.blocks.notNow` | Hozir bloklanmagan | Сейчас не заблокирован (блоки были раньше) |
| `moderation.blocks.activeForever` | Hozir butunlay bloklangan | Сейчас заблокирован навсегда |
| `moderation.blocks.activeUntil` | Hozir {date}gacha bloklangan | Сейчас заблокирован до даты |
| `moderation.blocks.reason.admin` | Admin bloklagan | Заблокировал админ |
| `moderation.blocks.reason.complaint` | Shikoyat boʻyicha bloklangan | Блок по жалобе |
| `moderation.blocks.reason.unblock` | Blokdan chiqarilgan | Разблокирован |
| `moderation.blocks.forever` | Butunlay | Навсегда |
| `moderation.blocks.until` | {date}gacha | До даты (конец блока) |
| `moderation.unblock` | Blokdan chiqarish | Кнопка «Разблокировать» |
| `moderation.unblockAsk` | Blokdan chiqarasizmi? U yana safar qila oladi. | Разблокировать? Он снова сможет ездить |
