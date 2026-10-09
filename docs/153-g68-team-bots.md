# 153. G68 часть C: боты команды (админка и поддержка)

> **Кратко:** как сделаны боты команды по `122` и макету `g68/4`: «Navbat» модератора, «Diqqat» владельца, итог дня в 21:00, карточка обращения в поддержку. Тексты по согласию владельца 09.10.2026 и его правилу понятности. Отступления от макета и их причины: внизу.

## Что видит команда

| Что | Как работает |
|---|---|
| «Navbat» | Одна закреплённая карточка у каждого в боте админки. Числа: заявки, жалобы, фото. Самое старое дело и сколько минут до 30. Решать дела только в приложении (кнопка «▶️ Ishni boshlash») |
| Звонки «Navbat» | Первое дело после пустой очереди (все члены команды). Дело ждёт 25 минут (тому, кому назначено). Важная жалоба (всем, днём и ночью). Ночью (23:00 … 07:00) всё остальное без звука |
| «Diqqat» владельца | Одна тихая карточка в день: ошибки, падение воронки, дело дольше 30 минут, попытки контакта, низкий рейтинг, мало денег у водителя. Звонок под карточкой только на ошибки и опоздание, и только 07:00 … 23:00 |
| Итог дня | Владельцам в 21:00 без звука: новые люди, поездки, брони; работа каждого; сколько пришло из каналов. Кнопка «Batafsil: Statistika» |
| Карточка обращения | Кто пишет и роль, активная бронь (или ближайшая поездка водителя), текст, сколько с брендом, поездки, рейтинг. Telegram ID нет нигде, и в «Tarix» тоже (урок №136). Ночью без звука |
| Кнопки обращения | «✍️ Javob berish», «📜 Tarix» (если писал раньше), «📋 Bronni ochish» (или «📋 Safarni ochish» у водителя): открывает поездку с бронями в админке |
| После ответа | Другие операторы, у кого за 2 дня была копия этого человека, получают под своей копией тихое «✅ Operator {имя} javob berdi» |

## Новые тексты (`bot-team.json`)

| Где | Текст |
|---|---|
| «Navbat» | «📋 Navbat · {n} ta ish», «📋 Navbat boʻsh», «{n} ariza · {n} shikoyat · {n} rasm», «⏱ Eng eskisi: {дело}», «{n} daqiqa kutmoqda · {n} daqiqa qoldi», «… · {лимит} daqiqadan oshdi», «Ish kelsa, shu xabar oʻzi yangilanadi», «▶️ Ishni boshlash» |
| Дела | «{имя} arizasi», «{имя} shikoyati», «{имя} rasmi» |
| Звонки «Navbat» | «📋 Yangi ish keldi: navbat boʻsh edi», «⏱ {дело} {n} daqiqa kutmoqda: {n} daqiqa qoldi» |
| «Diqqat» | «⚠️ Diqqat · bugun», «Kuniga bitta karta: yangi belgi chiqsa, shu karta yangilanadi», «📊 Statistika», «👥 Odamlar», «💳 {имя} (ID {публичный id}): hamyondagi pul {n} ta joyga yetadi» |
| Итог дня | «📊 Kun yakuni · {дата}», «{n} yangi odam · {n} safar · {n} bron», «👥 Jamoa», «📣 Kanaldan keldi: {n} kishi», «Batafsil: Statistika» |
| Обращение | «💬 Yangi murojaat», «{имя} · yoʻlovchi / haydovchi / roʻyxatdan oʻtmagan», «📌 Faol bron: {откуда} → {куда}, {день} {время}», «📌 Faol safar: …», «{водитель} · {номер}», ««{текст}»», «{бренд} bilan {n} kun / {n} oy · {n} safar · ⭐ {рейтинг}» |
| Кнопки и ответ | «✍️ Javob berish», «📜 Tarix», «📋 Bronni ochish», «📋 Safarni ochish», «✅ Operator {имя} javob berdi» |
| «Tarix» | «{имя}: murojaatlar tarixi» (было «{имя} (ID {Telegram ID}): …») |

## Убраны

| Ключ | Почему |
|---|---|
| `bot.moderation.card`, `approve`, `reject`, `requestChanges`, `checkPlate`, `plateMatches`, `fixPlate`, `send`, `changesRequested`, `alreadyDecided`, `waiting`, `picked`, `pickReason` | заявки водителей решаются только в приложении (`120`) |
| `bot.digest.title` | итог дня в 21:00 вместо дайджеста после полуночи |
| `bot.support.incoming`, `bot.support.history` | карточка обращения со своими текстами; в старом был Telegram ID |

## Как сделано

| Что | Где в коде |
|---|---|
| Очередь дел и числа | `team-queue/domain/queue.ts`, `team-queue/index.ts` (`showQueue`, `tellOwners`) |
| Карточки «Navbat» и «Diqqat» | `team-queue/infrastructure/navbat-card.ts`, `diqqat-card.ts`; «Diqqat» через карточку новостей дня (`showNews`) |
| Опоздание дела | `assignments/index.ts`: 25 минут модератору, 30 минут владельцам |
| Итог дня | `assignments/application/digest.ts`, `infrastructure/digest-text.ts`, Cron раз в час (с 21:00) |
| Сигналы владельцу | `stats/infrastructure/bot-alert.ts`, `chat/infrastructure/bot-signals.ts`, `ratings`, `wallet` → `tellOwners` |
| Карточка обращения | `bots/support-card.ts` (текст и кнопки), `bots/support-asker.ts` (кто пишет), `bookings/application/live-booking.ts` |
| «Bronni ochish» | `?open=trips&trip=<id>`: `market/team-trips-screen.tsx` открывает поездку сразу |
| Тихое «javob berdi» | `support/index.ts` (`tellAnswered`), индекс `support_links_person` (миграция 0053) |
| Часы и лимиты | `brands/rida/brand.config.ts`: `moderation.hours` 7 … 23, `remindMinutes` 25, `ownerMinutes` 30 |

## Отступления от макета g68/4

| # | На макете | В коде | Почему |
|---|---|---|---|
| 1 | Обращения в боте «Rida Yordam» | в боте админки | вся работа команды в боте админки (`50`, `92`); в боте поддержки команда сама была бы «человеком» |
| 2 | «Bobur chatda 3 marta raqam yubordi», «3 haydovchida pul kam» одной строкой | строка на каждого человека | сигналы приходят по одному; сумма за день: в «Statistika» |
| 3 | В итоге дня «o‘rtacha 11 daq», «30 daq dan oshgan 1», «+86 obunachi» | нет | эти числа пока не собираются; добавим вместе с каналами и статистикой команды |
| 4 | Карточка обращения у всех операторов | у одного назначенного (`92`: «другие не видят чужие обращения») | «javob berdi» получают те, у кого была копия того же человека за 2 дня |
| 5 | Фото лица: решение в приложении | кнопки фото пока в боте | экрана фото в админке нет; кнопки переедут в приложение вместе с G67 (админка заново, `120`) |
