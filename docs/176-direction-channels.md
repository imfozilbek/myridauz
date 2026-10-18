# 176. Каналы направлений: 67 приватных каналов и главный @rida1uz

> **Кратко:** решение владельца 12.10.2026 («Да каналы и зоны»): вместо 20 зон (`63`) у Rida 67 приватных каналов направлений и один главный публичный канал `@rida1uz` со ссылками на все. Список в `brands/rida/channels.json`. Посты и доски публикует отдельный бот каналов. Кто в каком канале, бот узнаёт сам (`chat_member`), «Kanallar» не спрашивает Telegram 67 раз. Цель: G80.

## Что такое канал направления

| Поле в `channels.json` | Что значит | Пример |
|---|---|---|
| `chat` | Номер канала для Bot API | `-1004328825984` |
| `title` | Места имени для текстов: имя без «Rida \| », « \| » заменено на «, » | `Boʻka, Bekobod` |
| `name` | Имя в Telegram как есть: его показывают сайт и бот; Mini App без бренда впереди | `Rida \| Boʻka \| Bekobod` |
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

## Куда уходит пост поездки

- Вид поста: как на утверждённом макете `g68/5` (`154`). G80 его не меняет: другое только имя канала в шапке и число каналов.
- Во **все** каналы, где есть место «откуда» или «куда» (`channelsOf`, как раньше, `63`).
- Решение владельца 12.10.2026: поездка между двумя направлениями уходит в оба канала.
- Пример: Toshkent → Samarqand shahri уходит в 4 канала, где есть Samarqand shahri.
- Пример: Urganch shahri → Nurafshon уходит в 3 канала: 2 канала с Urganch shahri и канал Nurafshon (тест `brand-channels.test.ts`).
- Доска дня и итоги дня и недели идут в те же каналы (`154`).

## Бот каналов

- Отдельный бот `@rida1uz_poster_bot` (имя в коде `poster`): посты, доски, итоги, проверка канала, число подписчиков.
- Токен: секрет Worker `POSTER_BOT_TOKEN` (`46`), никогда в коде, в чате и в GitHub. Владелец кладёт его сам в секреты Worker своей среды (карта ключей, `179`); в окружении Claude токенов ботов нет.
- Бот админ всех 67 каналов с правами публиковать и менять посты и «Добавление подписчиков» (в Bot API `can_invite_users`): без него Telegram не даёт сделать ссылку «{brand} ilovasi». Права всех 67 каналов Claude проверяет сам (`getChatMember`), владелец включает право только там, где его нет. 13.10 сессия «infra»: право есть в 67 из 67 и в `@rida1uz`.
- Вебхук `api.<домен среды>/telegram/poster`: только обновления `chat_member` и `message_reaction_count` (G87 V6), с `secret_token` (`pnpm run setup-bots --env=<среда>`). 67 каналов и этот бот: прод; у внутренней среды свой бот `@myrida_poster_bot` и свой канал (`179`).

## Кто в каком канале (`chat_member`)

- Telegram сам сообщает боту каналов, кто вошёл и кто вышел.
- Запись в таблицу `channel_members` (миграция `0064`): канал, человек, в канале или нет, время.
- Храним только людей Rida (есть аккаунт) и только каналы бренда. Чужие номера не храним (`30`).
- Поздняя запись не перебивает новую: Telegram может прислать их не по порядку.
- Удаление аккаунта стирает его строки (`30`).
- «Kanallar» человека: два чтения D1, ни одного вызова Telegram. Раньше: вызов на каждый канал; 67 больше лимита 50 подзапросов бесплатного Workers (`117`).
- Кто вошёл в канал до включения вебхука, у того «Qoʻshilish», пока он не выйдет и не войдёт снова. Кнопка просто откроет канал.
- Канал, где проверка нашла «Bot yoza olmaydi», людям не показываем.
- G87 V5: каждый вход и выход в канале бренда считается числом за день в `channel_days` (миграция `0075`), у любого человека, без id; смена прав (участник стал админом) не вход. Там же число людей по проверке Cron за день. Админка «Kanallar» владельца: «7 kunda kelgan va ketganlar».
- G87 V6: реакции на посты поездок: Telegram шлёт сумму по видам реакций (анонимно, с задержкой до нескольких минут), храним число в `channel_posts.reactions` (миграция `0076`). «Kanallar» владельца: «7 kunda koʻp reaksiya olgan postlar», нажатие открывает пост.

## Ссылка «Rida ilovasi» (решение 4)

- У каждого канала своя ссылка-приглашение приложения. Её имя «{brand} ilovasi» (`bot.zone.appLink`) видят только админы канала.
- Ссылку делает проверка здоровья (Cron раз в час): бот каналов вызывает `createChatInviteLink` у канала без ссылки. Ссылка хранится в `channel_health.app_link` (миграция `0065`).
- Один вызов на канал один раз: за круг проверки (около 22 часов) ссылки есть у всех 67. Не 67 вызовов в одном запросе (урок №262).
- Не вышло (нет права «Приглашать по ссылке», ошибка Telegram): ссылка общая, новая попытка при следующей проверке канала.
- Приложение открывает эту ссылку везде: «Kanallar», «Profil», карточка канала в поиске и «Kutayotganda», «Safaringiz kanalda chiqdi» у водителя. Пока ссылки нет: общая ссылка из `channels.json`.
- Счёт: Telegram сам считает, сколько людей вошло по каждой ссылке. Владелец видит это в канале: «Управление каналом», «Пригласительные ссылки», «Rida ilovasi».
- Сайт и посты в каналах открывают общую ссылку: так вход из приложения виден отдельно.
- Имя, описание и логотип канала ставит код (решение владельца 13.10.2026, вечер, меняет решение 3): `180`.

## Логотип канала в приложении (решение владельца 13.10.2026)

- Владелец: «в апте, в списках каналов, их логотипы должны быть так же, как у Телеграма».
- У 67 каналов в Telegram логотип области: номер «код | R» и имя области (бренд-пакет, `37`). Сверка 13.10: все 67 фото из ссылок-приглашений совпадают с аватаром своей области (разница 1,3 из 255, это сжатие JPEG).
- Приложение показывает ту же картинку: файл бренда `brands/rida/public/channels/<код>.webp` (13 файлов по 2,4 КБ), круглый, как в Telegram.
- Файлы делает `pnpm logos` в бренд-пакете из того же исходника, что аватары каналов. Тест: у кода каждого канала есть файл.
- Где: «Kanallar», строка «Kanallar» в «Profil», карточка канала в поиске и «Kutayotganda», «Safaringiz kanalda chiqdi» у водителя. Рисунки областей остались там, где речь об области (выбор места, шапка поиска).
- Без Telegram и без Worker: ни одного запроса, работает до токена бота каналов.
- Владелец сменил логотип в Telegram: заменить исходник в бренд-пакете и запустить `pnpm logos`.

## Имя канала в приложении (решение владельца 13.10.2026)

- Владелец: «название бери из самих каналов». Раньше приложение собирало имя само: «Boʻka», «Rida | Boʻka, Bekobod kanali» (урок №265).
- В Mini App имя без «Rida \| » впереди (решение владельца 13.10.2026): «Boʻka \| Bekobod». Приложение и так Rida. Сайт и бот пишут имя целиком, как в Telegram.
- Имена всех 67 каналов прочитаны 13.10 со страниц приглашений (`og:title`): поле `name` в `channels.json`. Тест: имена разные, `name` = бренд и места `title` через « \| ».
- Где: «Kanallar», карточка и строка канала в поиске и «Kutayotganda», «Safaringiz kanalda chiqdi», админка «Kanallar», приход в статистике, сайт («Hammasi Telegramda», кнопка страницы направления), бот: ««…» kanalida har kuni».
- В «Barcha kanallar» строка мест под именем убрана: имя уже называет места. В «Siz uchun» под именем причина, как раньше.
- Длинное имя переносится на 2 или 3 строки и не обрезается (`121`). Знак « \| » стоит в конце строки, а не в начале.
- Шрифт имени мелкий (владелец 13.10.2026: «уменьшай»): «Kanallar» 12…14 px, карточка и строка в поиске 13 px, вес 600. Админка как на макете g67/1.
- Канал команды: имя, которое команда дала в админке (`title`).
- `title` остался для итога недели в канале. Подсказка в карточке поиска места не повторяет: «Shu yoʻnalishdagi barcha yangi safarlar bir joyda» (`177`).
- Вид и тексты согласованы владельцем: «да», 13.10.2026.
- Владелец сменил имя канала в Telegram: поменять `name` и `title` в `channels.json`.
- Не менял: картинка телефона на сайте и в промо-видео (старые имена «Rida \| Samarqand»).

## Где ещё видно

| Место | Что | Документ |
|---|---|---|
| Бот водителя при одобрении | Ссылка на `@rida1uz`, кнопка «Kanalga oʻtish» | `119` |
| Mini App, «Kanallar» | 67 каналов по областям, «Siz uchun», поиск; вид макетов `7-channels-2`, `7-channels-3` (сверка 13.10: 1,9 %), логотипы и имена как в Telegram | `119`, `149` |
| Сайт: страница направления, карта | Кнопка канала по ссылке-приглашению | `60` |
| Сайт: «Hammasi Telegramda» | 13 областей с кодом; область открывается, в ней её каналы (решение 5) | `59` |
| Админка «Kanallar» | 67 каналов бренда и каналы команды, здоровье; пришли и ушли за 7 дней, лучший пост по реакциям (G87) | `120`, `191` |
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
| 1 | Токен бота каналов | `/revoke` и новый токен: владелец сам в секрет Worker прода `POSTER_BOT_TOKEN` (`46`, `179`). Не в чат |
| 2 | Посты поездок в `@rida1uz` | Нет: там только ссылки на каналы |
| 3 | Имя, описание, логотип 67 каналов | 12.10: код их не меняет. 13.10, вечер: оформление всех каналов ставит код, в обеих средах (`180`, G82) |
| 4 | Своя ссылка «Rida ilovasi» на каждый канал | Да: считать вход из приложения |
| 5 | Каналы на сайте | 13 областей, внутри каналы области |
| 6 | Имена и профиль ботов | 12.10: позже. 13.10, вечер: ставит код; делает настройка ботов G83 (`46`) |
| 7 | Новые тексты (`177`) | Да; профиль бота водителя как есть (вопрос 6) |
| 8 | Пост поездки | Как на макете `g68/5`; в каналы обоих концов; хабы оставить |
| 9 | Секрет вебхука для `setup-bots` (13.10) | Claude сам делает новый `TELEGRAM_WEBHOOK_SECRET`, кладёт в Worker и сразу запускает `setup-bots` для 5 ботов. Боты молчат несколько секунд, Telegram шлёт повторно. В обеих средах при запуске прода (G81) и при каждой новой настройке ботов |
