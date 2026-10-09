# 154. G68: каналы: пост поездки, его жизнь, доска дня, итоги

> **Кратко:** как сделаны каналы по `122` и макету `g68/5`. Пост поездки выглядит как карточка в боте и приходит без звука. Пост живёт: «последнее место», «мест нет», «в пути», «доехали», отменённый удаляется. Доска дня в 07:00: одна закреплённая запись со всеми поездками дня. Итог дня в 22:00 без звука, итог недели в понедельник со звуком. Ни адреса, ни номера машины, ни имени водителя. Тексты по согласию владельца 09.10.2026.

## Что видит человек в канале

| Что | Как | Звук |
|---|---|---|
| Пост поездки | «🆕 Yangi safar»; день и время «Ertaga, 8-oktabr · 08:00 → ≈ 13:10»; 🟢 и 🔴 в цитате: район жирным, область, как забирает и куда везёт; места полоской 🟩⬜ и цена; машина, «✅ Tekshirilgan», рейтинг; «👩 Mashinada ayol bor»; хэштеги районов; кнопки «Joy band qilish» и «📤 Doʻstga» | нет |
| Последнее место | сверху «🔥 1 ta joy qoldi» | нет (правка) |
| Мест нет | «⛔ Joy qolmadi», день и время, «Chilonzor → Urgut · 5 kishi ketmoqda», кнопка «🔎 Shunga oʻxshash safarlar» | нет |
| В пути | «🚗 Yoʻlga chiqdi», время в пути, «… kishi bir mashinada», без кнопок | нет |
| Доехали | «🏁 Yetib bordi», «… kishi · 13:05 da», «Yoʻl xarajati N ga boʻlindi», кнопка «🔎 Keyingi safarni topish» | нет |
| Отмена | пост удаляется; пост старше 48 часов Telegram не удаляет, он остаётся с «❌ Safar bekor qilindi» | нет |
| Доска дня | с 07:00, одна на канал, закреплена: «📋 Bugun, 7-oktabr: 14 ta safar», группы «➡️ Toshkent shahridan», «⬅️ Toshkent shahriga», строка «08:00 Chilonzor → **Urgut** · 2 joy · 90 000»; время открывает поездку; занятые, уехавшие и доехавшие зачёркнуты; сверху картинка направления с сайта; кнопки «🔎 Safar topish», «🔔 Xabar bering», «📤 Doʻstga» | 1 раз в день |
| Итог дня | 22:00: «🌙 Kun yakuni», поездки, сколько людей доехало, сколько мест заняли, сколько поездок уже завтра; кнопка «🔎 Ertangi safarlar» | нет |
| Итог недели | понедельник 10:00: «📊 Hafta: … yoʻnalishi», поездки и люди за 7 дней, средний рейтинг водителей, «Rahmat, yoʻl bir boʻlsin! 🤝», картинка направления, кнопка «📤 Doʻstlarga ulashish» | да |

## Новые тексты (`bot-channel.json`)

| Где | Ключи |
|---|---|
| Пост | `channel.new`, `channel.lastSeat`, `channel.when`, `channel.pickupDoor`, `channel.pickupPitak`, `channel.pickupBoth`, `channel.dropoff`, `channel.seats`, `channel.car`, `channel.rating`, `channel.share` |
| Жизнь поста | `channel.full`, `channel.going`, `channel.similar`, `channel.started`, `channel.inCar`, `channel.arrived`, `channel.arrivedLine`, `channel.arrivedAlone`, `channel.split`, `channel.next`, `channel.at` |
| Доска дня | `board.title`, `board.from`, `board.to`, `board.line`, `board.seats`, `board.lastSeat`, `board.done`, `board.full`, `board.started`, `board.arrived`, `board.hint`, `board.find`, `board.subscribe`, `board.shareText` |
| Итоги | `daySum.*`, `weekSum.*` |
| Убраны | `channel.places`, `channel.date`, `channel.time`, `channel.price`, `channel.verified`, `channel.door`, `channel.pitak`, `channel.doorOrPitak`, `channel.subscribe`, `channel.tag.*` |

## Как сделано

| Что | Где в коде |
|---|---|
| Пост и его жизнь | `channels/infrastructure/post-text.ts`, `post-life.ts`, `post-parts.ts`; состояния `domain/route-channels.ts` (`postState`) |
| Отмена: правка, потом удаление | `channels/application/channels.ts`, задача `remove` (`deleteMessage`) в `notifications` |
| «Yetib bordi» | событие поездки `arrived` и `completed` правит посты (`trip-events.ts`) |
| Доска дня | `channels/application/board.ts`, `infrastructure/board-text.ts`; живая карточка канала (`bot_cards`, ключ `board:<день>`, закрепление, первая со звуком) |
| Обновление доски | Cron каждые 15 минут и сразу после любого изменения поездки сегодняшнего дня |
| Итоги | `channels/application/summaries.ts`, `infrastructure/summary-text.ts`; Cron раз в час, каждый итог один раз (`once`) |
| Картинка направления | `page` зоны в `brands/rida/channels.json`; страница направления сайта с `og:image` = картинка области (`brands/rida/landing/og/<код>.png`, генератор `brand-kit/build.mjs`) |

## Отступления и толкования макета g68/5

| # | На макете | В коде | Почему |
|---|---|---|---|
| 1 | «4 kishi … Yoʻl xarajati 4 ga boʻlindi» | люди с водителем: 1 попутчик = «2 kishi», расход делится на 2 | расход делят все в машине; спросить владельца |
| 2 | Заголовки доски «Toshkent shahridan / shahriga» | «{откуда}dan / {куда}ga» по второй стороне поездки | так же для поездок не из Ташкента |
| 3 | Хэштеги «#Urgut #Chilonzor» | хэштеги районов, хэштегов областей больше нет | как на макете |
| 4 | Цена «90 000» без «soʻm» | как на макете | |
| 5 | Картинка итога недели | превью страницы направления сайта, не отдельное фото | одна живая карточка, без загрузки файлов |
| 6 | Вчерашняя доска | остаётся закреплённой ниже | Telegram показывает сверху последнюю закреплённую |
| 7 | Каналы работают | `CHANNEL_POSTS = "off"` в проде | включить: решение владельца (публично, `33`) |
