# 176. Каналы направлений: 67 приватных каналов и главный @rida1uz

> **Кратко:** решение владельца 12.10.2026 («Да каналы и зоны»): вместо 20 зон (`63`) у Rida 67 приватных каналов направлений и один главный публичный канал `@rida1uz` со ссылками на все. Список в `brands/rida/channels.json`. Посты и доски публикует отдельный бот каналов. Кто в каком канале, бот узнаёт сам (`chat_member`), «Kanallar» не спрашивает Telegram 67 раз. Цель: G80.

## Что такое канал направления

| Поле в `channels.json` | Что значит | Пример |
|---|---|---|
| `chat` | Номер канала для Bot API | `-1004328825984` |
| `title` | Имя в Telegram без «Rida \| », « \| » заменено на «, » | `Boʻka, Bekobod` |
| `code` | Код области на номере машины | `10` |
| `places` | Районы и города канала (СОАТО, `48`) | `["1727206", …]` |
| `hubs` | Большой город, через который канал только идёт | `["1730405"]` (Qoʻqon) |
| `link` | Ссылка-приглашение | `https://t.me/+…` |
| `page` | Страница направления на сайте (`60`) | `/yonalish/toshkent-nurafshon/` |

- Каналы приватные: публичного имени нет, только номер и ссылка-приглашение.
- Все 194 места вне Ташкента входят хотя бы в один канал (тест `brands/channels.test.ts`).
- У города Ташкента канала нет (решение владельца, `15`).

## Свой канал человека (`channelOf`, `brands/channels.ts`)

- Большой город (Qoʻqon, Samarqand, Nukus …) открывает имя нескольких каналов: он «хаб».
- Хаб: первое слово имени, место есть в нескольких каналах и дальше в имени не названо.
- Свой канал места: первый канал, где место есть и оно не хаб. Нет такого: первый канал с местом.
- Без своего канала только Yangiyoʻl (район и город) и Sherobod: им даём первый канал.
- Короткое имя на экране «Kanallar»: первое слово имени, у канала с хабом второе (`channelName`).

## Куда уходит пост поездки

- Вид поста: как на утверждённом макете `g68/5` (`154`). G80 его не меняет: другое только имя канала в шапке и число каналов.
- Во **все** каналы, где есть место «откуда» или «куда» (`channelsOf`, как раньше, `63`).
- Решение владельца 12.10.2026: поездка между двумя направлениями уходит в оба канала.
- Пример: Toshkent → Samarqand shahri уходит в 4 канала, где есть Samarqand shahri.
- Пример: Urganch shahri → Nurafshon уходит в 3 канала: 2 канала с Urganch shahri и канал Nurafshon (тест `brand-channels.test.ts`).
- Доска дня и итоги дня и недели идут в те же каналы (`154`).

## Бот каналов

- Отдельный бот `@rida1uz_poster_bot` (имя в коде `poster`): посты, доски, итоги, проверка канала, число подписчиков.
- Токен: секрет Worker `POSTER_BOT_TOKEN` (`46`), никогда в коде, в чате и в GitHub.
- Бот админ всех 67 каналов с правом публиковать и менять посты.
- Вебхук `api.myrida.uz/telegram/poster`: только обновления `chat_member`, с `secret_token` (`pnpm run setup-bots`).

## Кто в каком канале (`chat_member`)

- Telegram сам сообщает боту каналов, кто вошёл и кто вышел.
- Запись в таблицу `channel_members` (миграция `0064`): канал, человек, в канале или нет, время.
- Храним только людей Rida (есть аккаунт) и только каналы бренда. Чужие номера не храним (`30`).
- Поздняя запись не перебивает новую: Telegram может прислать их не по порядку.
- Удаление аккаунта стирает его строки (`30`).
- «Kanallar» человека: два чтения D1, ни одного вызова Telegram. Раньше: вызов на каждый канал; 67 больше лимита 50 подзапросов бесплатного Workers (`117`).
- Кто вошёл в канал до включения вебхука, у того «Qoʻshilish», пока он не выйдет и не войдёт снова. Кнопка просто откроет канал.
- Канал, где проверка нашла «Bot yoza olmaydi», людям не показываем.

## Где ещё видно

| Место | Что | Документ |
|---|---|---|
| Бот водителя при одобрении | Ссылка на `@rida1uz`, кнопка «Kanalga oʻtish» | `119` |
| Mini App, «Kanallar» | 67 каналов по областям, «Siz uchun», поиск; вид макетов `7-channels-2`, `7-channels-3` (сверка 13.10: 1,9 %) | `119`, `149` |
| Сайт: страница направления, карта | Кнопка канала по ссылке-приглашению | `60` |
| Сайт: «Hammasi Telegramda» | 13 областей с кодом; область открывается, в ней её каналы (решение 5) | `59` |
| Админка «Kanallar» | 67 каналов бренда и каналы команды, здоровье | `120` |
| Статистика | Приход из канала по имени канала, а не по номеру | `116` |

- Метка прихода: `ch-` и номер канала без минуса (`channelVia`), до 64 знаков.
- Проверка здоровья: 3 канала в час, круг по 67 каналам около 22 часов (`117`).

## Список (по областям)

| Область | Каналов | Каналы (название без «Rida \| ») |
|---|---|---|
| Toshkent viloyati | 8 | Boʻka, Bekobod; Nurafshon, Oʻrta Chirchiq, Piskent; Ohangaron, Olmaliq, Angren; Qibray, Chirchiq, Boʻstonliq; Yangiyoʻl, Chinoz; Yangiyoʻl, Quyi Chirchiq, Oqqoʻrgʻon; Yuqori Chirchiq, Parkent; Zangiota, Toshkent tumani (Keles) |
| Andijon viloyati | 5 | Andijon shahri / Andijon tumani; Andijon, Xoʻjaobod, Jalaquduq, Qoʻrgʻontepa, Xonobod; Asaka, Marhamat, Buloqboshi; Baliqchi, Izboskan, Paxtaobod; Ulugʻnor, Boʻston, Shahrixon, Oltinkoʻl |
| Fargʻona viloyati | 8 | Fargʻona, Fargʻona tumani (Vodil), Quvasoy; Margʻilon, Fargʻona shahri; Qamchiq, Furqat, Qoʻqon; Qoʻqon, Bagʻdod, Rishton, Soʻx; Qoʻqon, Dangʻara, Buvayda, Uchkoʻprik; Qoʻqon, Oltiariq, Qoʻshtepa; Qoʻqon, Oʻzbekiston, Beshariq; Toshloq, Yozyovon, Quva |
| Namangan viloyati | 4 | Namangan tumani, Namangan shahri; Namangan, Chortoq, Uychi, Uchqoʻrgʻon, Norin; Qamchiq, Pop, Chust, Mingbuloq; Toʻraqoʻrgʻon, Kosonsoy, Yangiqoʻrgʻon |
| Sirdaryo viloyati | 4 | Chinoz, Sirdaryo, Sayxunobod; Guliston shahri, Guliston tumani, Boyovut; Guliston, Mirzaobod, Oqoltin, Sardoba; Guliston, Yangiyer, Xovos, Shirin |
| Jizzax viloyati | 4 | Jizzax sharqi, Zarbdor, Zomin, Yangiobod; Jizzax, Gʻallaorol, Baxmal; Mirzachoʻl, Doʻstlik, Paxtakor, Arnasoy; Zafarobod, Sharof Rashidov, Jizzax, Forish |
| Samarqand viloyati | 6 | Bulungʻur, Jomboy, Payariq, Qoʻshrabot; Kattaqoʻrgʻon shahri, Narpay, Paxtachi; Samarqand shahri, Samarqand tumani; Samarqand, Oqdaryo, Ishtixon, Kattaqoʻrgʻon tumani; Samarqand, Pastdargʻom, Nurobod; Samarqand, Toyloq, Urgut |
| Buxoro viloyati | 4 | Buxoro shahri, Kogon, Qorovulbozor; Buxoro, Jondor, Qorakoʻl, Olot; Gʻijduvon, Shofirkon, Peshku; Vobkent, Romitan, Buxoro tumani |
| Navoiy viloyati | 3 | Navoiy, Konimex, Tomdi, Zarafshon, Uchquduq; Navoiy, Navbahor, Gʻozgʻon, Nurota; Xatirchi, Karmana, Navoiy, Qiziltepa |
| Qashqadaryo viloyati | 6 | Gʻuzor, Dehqonobod; Kitob, Shahrisabz, Yakkabogʻ; Koʻkdala, Chiroqchi, Qamashi; Qarshi shahri, Qarshi tumani, Nishon; Qarshi, Kasbi, Mirishkor; Qarshi, Koson, Muborak |
| Surxondaryo viloyati | 5 | Darband, Boysun, Bandixon, Qumqoʻrgʻon, Shoʻrchi; Denov, Sariosiyo, Uzun; Sherobod, Muzrabot, Termiz; Sherobod, Qiziriq, Jarqoʻrgʻon, Angor; Shoʻrchi, Oltinsoy, Denov |
| Xorazm viloyati | 4 | Hazorasp, Bogʻot, Yangiariq, Xiva; Tuproqqalʼa, Hazorasp, Xonqa; Urganch shahri, Urganch tumani, Yangibozor; Urganch, Qoʻshkoʻpir, Shovot, Gurlan |
| Qoraqalpogʻiston Respublikasi | 6 | Beruniy, Amudaryo, Taxiatosh, Nukus shahri; Nukus, Chimboy, Qoraoʻzak, Taxtakoʻpir; Nukus, Nukus tumani, Kegeyli, Boʻzatov; Nukus, Qoʻngʻirot, Moʻynoq; Nukus, Xoʻjayli, Shumanay, Qanlikoʻl; Toʻrtkoʻl, Ellikqalʼa, Beruniy |

## Решения владельца (12 и 13.10.2026)

| № | Вопрос | Решение |
|---|---|---|
| 1 | Токен бота каналов | `/revoke` и новый токен в секрет Worker `POSTER_BOT_TOKEN` (`46`): делает владелец 14.10. Не в чат |
| 2 | Посты поездок в `@rida1uz` | Нет: там только ссылки на каналы |
| 3 | Имя, описание, логотип 67 каналов | Каналы готовы, их не трогаем. Код их не меняет |
| 4 | Своя ссылка «Rida ilovasi» на каждый канал | Да: считать вход из приложения |
| 5 | Каналы на сайте | 13 областей, внутри каналы области |
| 6 | Имена и профиль ботов | Позже; пока как есть |
| 7 | Новые тексты (`177`) | Да; профиль бота водителя как есть (вопрос 6) |
| 8 | Пост поездки | Как на макете `g68/5`; в каналы обоих концов; хабы оставить |
