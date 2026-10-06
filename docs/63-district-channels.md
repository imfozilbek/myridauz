# 63. Каналы районов: один пост в нескольких каналах

> **Кратко:** Просьба владельца 30.09.2026: канал на каждый район и город, один пост может уйти сразу в несколько каналов (пример: Kitob, Shahrisabz, Yakkabogʻ). По справочнику СОАТО получается 177 каналов. Код готов быстро, узкое место: Telegram разрешает одному аккаунту только 10 публичных каналов (20 с Premium). Механизм «канал = список мест» и экран «Kanallar» сделаны 30.09.2026. **Решено: 20 зон** (владелец, 30.09.2026).

Как звать людей в каналы: `119`. Вид постов, доска дня, итоги: `122`.

Сейчас в коде: 20 зон, список в `brands/rida/channels.json`, поиск зоны `channelOf` (`brands/channels.ts`).

## Сколько подразделений (справочник `48`)

| Регион | Районов и городов |
|---|---|
| Andijon viloyati | 15 |
| Buxoro viloyati | 11 |
| Fargʻona viloyati | 18 |
| Jizzax viloyati | 13 |
| Namangan viloyati | 11 |
| Navoiy viloyati | 11 |
| Qashqadaryo viloyati | 14 |
| Qoraqalpogʻiston Respublikasi | 16 |
| Samarqand viloyati | 14 |
| Sirdaryo viloyati | 10 |
| Surxondaryo viloyati | 14 |
| Toshkent viloyati | 19 |
| Xorazm viloyati | 11 |
| **Всего** | **177** |

- Всего в СОАТО 206: 175 районов и 31 город.
- Без 12 районов города Ташкента: у Ташкента канала нет (решение владельца, `15`).
- Город и район с одним именем (Qarshi shahri и Qarshi tumani): один канал.

## Как работает «один пост в нескольких каналах» (совет Claude)

- **Канал = список мест.** У каждого канала свой список: регион целиком или несколько районов.
  Район может быть в нескольких каналах.
- Пост поездки уходит во **все каналы**, в списке которых есть район «откуда» или «куда».
- Пример: канал «Rida | Kitob» = Kitob, Shahrisabz, Yakkabogʻ. Поездка из Shahrisabz попадёт в каналы
  Shahrisabz, Kitob и Yakkabogʻ, если в их списках есть Shahrisabz.
- 13 каналов регионов остаются: это тот же механизм, в списке весь регион.
- Список каналов ведёт команда в админке (экран «Kanallar»), без деплоя: 177 записей в конфиге бренда неудобно.
- По умолчанию соседи: районы ближе 40 км друг к другу (координаты `48`). Команда правит список.

## Как сделано

| Часть | Где |
|---|---|
| Выбор каналов поездки | `apps/backend/src/modules/channels/domain/route-channels.ts` (`channelsOf`) |
| Каналы команды | таблица `team_channels` (миграция `0016`), API `/admin/channels` |
| Проверка бота | `getChatMember`: бот должен быть админом канала с правом публиковать |
| Экран «Kanallar» | админка → «Boshqaruv» → «Kanallar» (`packages/ui/src/channels/`) |
| Соседи 40 км | кнопка «Yaqin tumanlarni qoʻshish» (`near.ts`) |

- Каналы регионов из конфига бренда видны в списке, но меняются только в коде.
- Скриншоты: `e2e/channels-screenshots.spec.ts`.

## Ограничения Telegram

| Что | Лимит | Что значит для нас |
|---|---|---|
| Публичных каналов на 1 аккаунт | 10, с Premium 20 | 177 каналов: 9 аккаунтов с Premium или передача владения |
| Каналов, где бот админ | не ограничено | Бот публикует во все |
| Сообщений бота в один канал | ~20 в минуту | Хватает |

- Приватные каналы (ссылка-приглашение) без лимита, но их не найти поиском.

## Нагрузка

- 300 поездок в день × ~3 канала = ~900 постов. Queues: +2 700 операций в день, помещается в $5 (`61`).

## Решение владельца 30.09: 20 зон вместо 177 каналов

Зоны по главным дорогам: крупные регионы делятся на 2 … 3 части. Каждый район ровно в одной зоне, у города Ташкента зоны нет.
Откуда направления: из Ташкента во все областные центры, Ферганская долина, Самарканд → Шахрисабз, Бухара → Хива;
автобусы из Ташкента идут и в Qiziltepa, Zarafshon, Uchquduq, Mirbozor, Denov, Xatirchi, Qorakoʻl (mintrans.uz).

| # | Зона | Ссылка | Код | Районы |
|---|---|---|---|---|
| 1 | Andijon | t.me/rida_andijon | 60 | Oltinkoʻl, Andijon, Baliqchi, Boʻston, Buloqboshi, Jalaquduq, Izboskan, Ulugʻnor, Qoʻrgʻontepa, Asaka, Marhamat, Shahrixon, Paxtaobod, Xoʻjaobod, Xonobod |
| 2 | Namangan | t.me/rida_namangan | 50 | Mingbuloq, Kosonsoy, Namangan, Norin, Pop, Toʻraqoʻrgʻon, Uychi, Uchqoʻrgʻon, Chortoq, Chust, Yangiqoʻrgʻon |
| 3 | Fargʻona, Margʻilon | t.me/rida_fargona | 40 | Oltiariq, Qoʻshtepa, Bagʻdod, Quva, Rishton, Soʻx, Toshloq, Fargʻona, Yozyovon, Quvasoy, Margʻilon |
| 4 | Qoʻqon | t.me/rida_qoqon | 40 | Buvayda, Beshariq, Uchkoʻprik, Oʻzbekiston, Dangʻara, Furqat, Qoʻqon |
| 5 | Chirchiq, Boʻstonliq | t.me/rida_chirchiq | 10 | Boʻstonliq, Yuqori Chirchiq, Qibray, Parkent, Toshkent, Chirchiq |
| 6 | Angren, Olmaliq, Bekobod | t.me/rida_angren | 10 | Ohangaron, Bekobod, Boʻka, Piskent, Olmaliq, Angren |
| 7 | Yangiyoʻl, Chinoz, Nurafshon | t.me/rida_yangiyol | 10 | Oqqoʻrgʻon, Quyi Chirchiq, Zangiota, Oʻrta Chirchiq, Chinoz, Yangiyoʻl, Nurafshon |
| 8 | Sirdaryo | t.me/rida_sirdaryo | 20 | Oqoltin, Boyovut, Sayxunobod, Guliston, Sardoba, Mirzaobod, Sirdaryo, Xovos, Shirin, Yangiyer |
| 9 | Jizzax | t.me/rida_jizzax | 25 | Arnasoy, Baxmal, Gʻallaorol, Sharof Rashidov, Doʻstlik, Zomin, Zarbdor, Mirzachoʻl, Zafarobod, Paxtakor, Forish, Yangiobod, Jizzax |
| 10 | Samarqand | t.me/rida_samarqand | 30 | Oqdaryo, Bulungʻur, Jomboy, Payariq, Pastdargʻom, Samarqand, Urgut, Toyloq |
| 11 | Kattaqoʻrgʻon | t.me/rida_kattaqorgon | 30 | Ishtixon, Kattaqoʻrgʻon, Qoʻshrabot, Narpay, Paxtachi, Nurobod |
| 12 | Navoiy | t.me/rida_navoiy | 85 | Konimex, Qiziltepa, Navbahor, Karmana, Nurota, Tomdi, Uchquduq, Xatirchi, Navoiy, Zarafshon, Gʻozgʻon |
| 13 | Buxoro | t.me/rida_buxoro | 80 | Olot, Buxoro, Vobkent, Gʻijduvon, Kogon, Qorakoʻl, Qorovulbozor, Peshku, Romitan, Jondor, Shofirkon |
| 14 | Qarshi | t.me/rida_qarshi | 70 | Gʻuzor, Dehqonobod, Qamashi, Qarshi, Koson, Mirishkor, Muborak, Nishon, Kasbi |
| 15 | Shahrisabz, Kitob, Yakkabogʻ | t.me/rida_shahrisabz | 70 | Kitob, Koʻkdala, Chiroqchi, Shahrisabz, Yakkabogʻ |
| 16 | Termiz | t.me/rida_termiz | 75 | Angor, Bandixon, Muzrabot, Jarqoʻrgʻon, Qumqoʻrgʻon, Qiziriq, Termiz, Sherobod |
| 17 | Denov | t.me/rida_denov | 75 | Oltinsoy, Boysun, Denov, Sariosiyo, Uzun, Shoʻrchi |
| 18 | Xorazm | t.me/rida_xorazm | 90 | Bogʻot, Gurlan, Qoʻshkoʻpir, Urganch, Hazorasp, Tuproqqalʼa, Xonqa, Xiva, Shovot, Yangiariq, Yangibozor |
| 19 | Nukus | t.me/rida_nukus | 95 | Boʻzatov, Qoraoʻzak, Kegeyli, Qoʻngʻirot, Qanlikoʻl, Moʻynoq, Nukus, Taxiatosh, Taxtakoʻpir, Xoʻjayli, Chimboy, Shumanay |
| 20 | Beruniy, Toʻrtkoʻl | t.me/rida_beruniy | 95 | Amudaryo, Beruniy, Toʻrtkoʻl, Ellikqalʼa |

- 20 каналов: ровно лимит одного аккаунта с Premium (`20`).
- Пост поездки уходит в зону «откуда» и в зону «куда». Поездка внутри зоны: один пост.

## Правила группировки (решение владельца 30.09)

Главное: на старте поездок мало, пустой канал выглядит мёртвым (`18`). Поэтому правила по порядку важности:

| # | Правило |
|---|---|
| 1 | В зоне достаточно людей: не меньше ~0,8 млн |
| 2 | Районы зоны на одной трассе из Ташкента |
| 3 | Название по главному городу, его человек узнаёт сразу |
| 4 | Не больше 20 каналов: лимит одного аккаунта с Premium |

- Пробовали 4 правки только по дорогам (Bekobod и Zarafshon отдельно, Kattaqoʻrgʻon в Samarqand, Beruniy в Xorazm). Разница зон по людям выросла с 4 до 30 раз. Владелец выбрал первые 20 зон (урок 33, `49`).
- Зона Shahrisabz названа «Shahrisabz, Kitob, Yakkabogʻ».
- После запуска делим или объединяем зоны по числу поездок из «Statistika» (`56`), а не по населению.

## Население зон (оценка на 01.01.2025, citypopulation.de по данным stat.uz)

| Вариант | Меньше всего | Больше всего | Разница |
|---|---|---|---|
| Первые 20 зон | Beruniy, Toʻrtkoʻl 0,83 млн | Andijon 3,46 млн | 4 раза |
| 4 правки по дорогам (отклонены) | Zarafshon, Uchquduq 0,15 млн | Samarqand 4,30 млн | 30 раз |

- Всего в зонах 34,4 млн, в среднем 1,7 млн на зону.

## Тексты (одобрены владельцем 30.09)

- «viloyat kanali» заменено: «hudud kanali» (лендинг, бот водителя), «Asosiy kanal» (пометка зоны в админке), «kanal Telegramda» (цифры).

## Ждёт владельца (`33`)

1. Ссылки 20 каналов (публичные, `33`): владелец создаёт каналы.
2. Аватары и пакет `37` для 20 зон: после пункта 1.
