# 202. G46: новые тексты доверия на согласие владельца

> **Кратко:** все новые и изменённые тексты G46 (`111`): вопрос бота «Yetib keldingizmi?», истёкшая заявка, «Hamrohlaringiz», выбор в жалобе, конец слежения близких. Ключи в `packages/i18n/locales/uz-Latn/`. Согласие владельца 18.10.2026 («Согласен», вместе с закрытием ссылки сразу после «Ha, yetib keldim»); ждут проверки носителем (`25`, OPS-07). Снимки: `screenshots/stand/g46/` (стенд, `e2e/stand/g46-screens.spec.ts`).

## Бот попутчика

| Когда | Текст | Ключ |
|---|---|---|
| Через час после прибытия без «Yetib keldim» | 🏁 Yetib keldingizmi? Javobingiz safarni yopadi. | `bot.ring.arrivedAsk` |
| Кнопки под вопросом (уже утверждены в G60) | Ha, yetib keldim · Hali yoʻldaman | `bookings.arrivedAsk.*` |
| Ответ «Ha, yetib keldim» | 🏁 Yetib keldingiz. Yaqinlaringiz ham bilib oladi. | `bot.arrived.yes` |
| Ответ «Hali yoʻldaman» | 🚗 Oq yoʻl! Yetib borganingizda «Yetib keldim»ni bosing. | `bot.arrived.onWay` |
| Заявка истекла в конце дня, водителя нет | ⌛ Soʻrov muddati tugadi, haydovchi topilmadi. Boshqa safarlarni koʻring. | `bot.ring.requestExpired` |
| Кнопка под этим сообщением (уже есть) | Boshqa safar topish | `bot.findOther` |

Первый и второй тексты собраны из уже утверждённых строк G60 и G76.

## Mini App

| Экран | Текст | Ключ |
|---|---|---|
| Бронь попутчика, блок попутчиков | Hamrohlaringiz | `bookings.coRiders` |
| «Shikoyat» попутчика, если в поездке были другие попутчики | Kimdan shikoyat qilasiz? | `complaints.aboutTitle` |
| Строки выбора (уже есть) | Haydovchi · Yoʻlovchi, под ними имя | `complaints.driver`, `complaints.passenger` |
| Экран близких, ссылка закрыта | Kuzatish tugadi, havola yopildi. | `share.follow.ended` (было: «Kuzatish tugadi: havola yetib borgandan 24 soat keyin yopiladi.») |
| Отзывы, под именем | {день} · {текст отзыва}; без текста только день | `home.meta` (уже есть) |
| Отзывы, внизу (уже есть) | Yana koʻrsatish | `market.mine.more` |
| Экран близких, строка водителя | ★ 4,9 · haydovchi | `find.stars` и `share.follow.role` (уже есть) |

## Почему изменён текст для близких

- Раньше ссылка всегда закрывалась через 24 часа после прибытия.
- Теперь ответ «Ha, yetib keldim» закрывает её сразу (`43`), «Ulashishni toʻxtatish» тоже.
- Поэтому текст стал общим: он верен в любом случае.
