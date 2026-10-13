# 177. G80: новые тексты каналов направлений

> **Кратко:** тексты, которые меняет переход на 67 каналов направлений (`176`). Раньше они говорили «hudud» (область) и звали в один канал зоны. Согласие владельца: **да, 13.10.2026** (решение 7 в `176`); профиль бота водителя не меняем (решение 6). Дальше: проверка носителем (`25`). `{…}`: подставляется кодом.

## Боты

| Ключ | Было | Будет |
|---|---|---|
| `bot.driver.channel` (одобрение водителя) | «{zone}» kanalida safarlaringiz chiqadi, yoʻlovchilar u yerdan topadi: t.me/{username} | Safarlaringiz yoʻnalish kanallarida chiqadi, yoʻlovchilar u yerdan topadi. Barcha kanallar: t.me/{username} |
| `bot.zone.invite` (после регистрации) | {zone} hududi kanalida har kuni yangi safarlar chiqadi. Kanalga qoʻshiling: ilovani ochmasdan safarlarni koʻrib turasiz. | «{channel}» kanalida har kuni yangi safarlar chiqadi. Kanalga qoʻshiling: ilovani ochmasdan safarlarni koʻrib turasiz. |

- В `bot.driver.channel` `{username}` это главный канал `@rida1uz`: водитель ездит по разным направлениям, ему нужны все каналы.
- В `bot.zone.invite` `{channel}` это имя канала в Telegram как есть, например «Rida | Samarqand shahri | Samarqand tumani» (13.10.2026, ниже).

## Ссылка приложения в канале

| Ключ | Текст | Кто видит |
|---|---|---|
| `bot.zone.appLink` | {brand} ilovasi | Только админы канала, в списке ссылок-приглашений. Имя дал владелец (решение 4 в `176`) |

## Сайт

| Ключ | Было | Будет |
|---|---|---|
| `landing.map.channel` (карточка у карты) | Hudud kanali | Yoʻnalish kanali |
| `landing.telegram.text` (блок «Hammasi Telegramda») | Ilova yuklab olish shart emas. Har bir hududning oʻz kanali bor: yangi safarlar u yerda ham chiqadi. | Ilova yuklab olish shart emas. Har bir yoʻnalishning oʻz kanali bor: yangi safarlar u yerda ham chiqadi. |
| `landing.how.driver.2.text` (как это работает, водитель) | Safaringiz qidiruvda va hudud kanalida koʻrinadi. | Safaringiz qidiruvda va yoʻnalish kanalida koʻrinadi. |

## Без изменений

- `bot.profile.driver.description` (профиль бота водителя): как есть, решение владельца 13.10.2026 «профиль бота потом решим».
- «Kanalga oʻtish», «Safar topish», «Safar eʼlon qilish», «Kanallar», «Siz uchun», «Qoʻshilish», «✓ Aʼzosiz».
## Имя канала как в Telegram (13.10.2026, на согласие)

Владелец: «название бери из самих каналов» (`176`). Имя канала больше не собирается из текста: его берём из Telegram.

| Ключ | Было | Будет |
|---|---|---|
| `landing.direction.channel` (кнопка страницы направления) | Telegram kanal: {brand} \| {zone} | Telegram kanal: {channel} |
| `bot.zone.invite` | «{brand} \| {zone}» kanalida … | «{channel}» kanalida … (строка выше) |
| `find.channel` (карточка канала в поиске) | {brand} \| {zone} kanali | Удалён: имя канала из Telegram |
| `driverTrip.channel.name` («Safaringiz kanalda chiqdi») | {brand} \| {title} | Удалён: имя канала из Telegram |
| `channels.mine.zone` («Kanallar», строка под именем) | {brand} \| {zone} | Удалён: строку мест под именем убрали |
