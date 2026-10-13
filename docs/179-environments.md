# 179. Две среды: внутренняя и прод

> **Кратко:** решение владельца 13.10.2026. Первый аккаунт Cloudflare и `myrida.uz` становятся **внутренней средой** команды. Новый аккаунт и `ridaone.uz`: **прод** для людей. Код один, бренд один. Отличаются адрес, боты и каналы. Цель G81.

## Решение владельца (13.10.2026)

- «Текущая среда стала внутренней для использования»; новый аккаунт Cloudflare, на нём весь стек.
- Внутренняя: 2 канала. Главный, как сейчас, и один для всех направлений: туда идут поездки.
- Прод: 67 каналов направлений и один главный канал (`176`).
- Адрес прода `ridaone.uz`, боты прода `@rida1uz_*` (владелец через сессию инфраструктуры).

## Что отличается

| | Внутренняя (`internal`) | Прод (`production`) |
|---|---|---|
| Аккаунт Cloudflare | первый | новый |
| Имя бренда | «MyRida»: боты «MyRida \| yoʻlovchi» и другие, Mini App, сайт | «Rida» |
| Сайт и API | `myrida.uz`, `api.myrida.uz` | `ridaone.uz`, `api.ridaone.uz` |
| Mini App | `passenger.`, `driver.`, `admin.myrida.uz` | `passenger.`, `driver.`, `admin.ridaone.uz` |
| Боты | `@myrida_bot`, `@myrida_haydovchi_bot`, `@myrida_admin_bot`, `@myrida_support_bot` | `@rida1uz_bot`, `@rida1uz_haydovchi_bot`, `@rida1uz_admin_bot`, `@rida1uz_yordam_bot` |
| Бот каналов | `@myrida_poster_bot` | `@rida1uz_poster_bot` |
| Главный канал | `@myrida_uz` | `@rida1uz` |
| Каналы направлений | один приватный «MyRida \| Viloyatlar»: все направления | 67 приватных (`176`) |
| Поисковики | закрыт: `robots.txt` «Disallow: /» | открыт, карта сайта (`60`) |
| Деплой | сам, после зелёного CI на `main` | позже, с новым аккаунтом: после внутренней, с согласием владельца |
| Данные | тестовые данные команды остаются | новая база: справочники из миграций, люди с нуля |

Всё остальное одно на обе среды: правила, цены, комиссия, лимиты, тексты (с именем своей среды), вид экранов.

## Как устроено в коде

- `brands/rida/environments.ts`: имя, адрес, `indexed`, боты, каналы и главный канал каждой среды.
  Остальное в `brand.config.ts`, одно на обе (`22`).
- `loadBrand(id, environment)`: без среды прод. Тесты и стенд работают с продом (67 каналов).
- Worker читает переменную `ENVIRONMENT`, Mini App, их заставка при сборке и сайт: `VITE_ENVIRONMENT`.
- Команды `deploy`, `setup-bots`, `map-data` требуют `--env=internal|production`.
  Прод «по умолчанию» никогда. Стенд (`--local`) среду не спрашивает.
- `brands/rida/wrangler.toml` один. Деплой пишет `wrangler.<среда>.toml` (git его не хранит):
  адрес API, id базы D1 этого аккаунта, `ENVIRONMENT`.
- На пустом аккаунте деплой сам создаёт D1 `rida-db`, очередь `rida-notifications`, R2 `rida-media`.
  Карту `rida-map`, проекты Pages и их домены он создавал и раньше (`46`).
- Имена ресурсов одинаковые в обоих аккаунтах. Отличается только id базы D1.
- Деплой и «Map data» сначала ищут на аккаунте секретов зону домена своей среды (`scripts/deploy/account.mjs`).
  Зоны нет: это секреты другой среды, команда останавливается до любых изменений (урок №271).
- Канал «MyRida | Viloyatlar» попадёт в код, когда бот каналов узнает его номер (`chat`).
  До этого у внутренней среды каналов направлений нет: посты никуда не идут.

## CI и секреты

- `deploy-internal`: Environment `internal`, без согласия, после зелёного CI на `main`.
- Прода в CI пока нет (решение владельца 13.10.2026, вечер): сначала работает внутренняя среда. `deploy-production` и прод в «Map data» вернутся вместе с новым аккаунтом: Environment `production`, согласие владельца (`32`), тот же коммит после внутренней среды.
- Секреты Environment: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` своего аккаунта, имена одинаковые.
- Workflow «Map data»: пока только `internal`.
- Секреты Worker у каждой среды свои (`46`): токены 5 ботов своей среды, свой `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_TELEGRAM_IDS`, ключи аналитики, звонков и TURN своего аккаунта.

## Права токена нового аккаунта

Токен деплоя (Account API Token) с правами:

| Где | Право |
|---|---|
| Account | Workers Scripts, D1, Workers R2 Storage, Queues, Cloudflare Pages: Edit |
| Account | Account Analytics: Read; Realtime (Calls): Edit |
| Zone `ridaone.uz` | Workers Routes, DNS: Edit; Zone: Read |

## Шаги: сначала внутренняя среда

| № | Кто | Что |
|---|---|---|
| 1 | Владелец | GitHub → Settings → Environments: новый `internal` с `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID` первого аккаунта (те же, что в `production`). Переименовать Environment в GitHub нельзя; `production` пока не трогать |
| 2 | Владелец | `@myrida_poster_bot` админ в «MyRida \| Viloyatlar»: публикация, редактирование и удаление сообщений, добавление подписчиков; одно сообщение в канале |
| 3 | Владелец | Переменная окружения Claude `INTERNAL_POSTER_BOT_TOKEN`, потом новая сессия (`32`). В чат никогда |
| 4 | Claude | Номер канала (`getUpdates`) и ссылка-приглашение с одобрением заявок (бот) → `environments.ts`; полный стенд; PR; слияние |
| 5 | CI | `deploy-internal` |
| 6 | Claude | `POSTER_BOT_TOKEN` и новый `TELEGRAM_WEBHOOK_SECRET` в Worker; `setup-bots --env=internal` (боты «MyRida \| …»); тестовая поездка, пост в канале, скриншоты |

## Шаги прода (позже, к запуску 18.10)

| № | Кто | Что |
|---|---|---|
| 1 | Владелец | R2 на новом аккаунте: включить в панели (может попросить карту, платить не нужно) |
| 2 | Владелец | В `production`: токен и Account ID **нового** аккаунта (Approve владельца там уже стоит) |
| 3 | Владелец | Переменные Claude: `PROD_CLOUDFLARE_API_TOKEN`, `PROD_CLOUDFLARE_ACCOUNT_ID`, `PROD_PASSENGER_BOT_TOKEN`, `PROD_DRIVER_BOT_TOKEN`, `PROD_ADMIN_BOT_TOKEN`, `PROD_SUPPORT_BOT_TOKEN`, `PROD_POSTER_BOT_TOKEN`; Telegram ID команды для прода (или «те же») |
| 4 | Claude | Вернуть `deploy-production` и прод в «Map data»; PR; слияние; деплой прода (Approve владельца) |
| 5 | Claude | Секреты Worker прода, новый секрет вебхука, `setup-bots --env=production`, «Map data» прода; проверка: `/health`, боты, Mini App, карта, сайт |

## Решения владельца 13.10.2026 (ответ «Запуск 18.10, да на всё, посты во внутреннем да»)

- Запуск 18.10.2026 (`27`).
- Внутренняя среда выкладывается без Approve, прод только с Approve.
- Посты: во внутренней среде включены (`posts` в `environments.ts`), в проде выключены до «да» владельца.
- Картинки бренд-пакета (`38`): домен и бот прода (`ridaone.uz`, `@rida1uz_bot`) из конфига бренда (`brand-kit/lib/production.mjs`); картинка ссылок сайта, наклейка, пост «Tez orada», QR-плакат и финал ролика. QR перерисован теми же настройками (уровень H, версия 3) и проверен: ведёт на `https://ridaone.uz`.
- Изменения сессии инфраструктуры для нового аккаунта (датчик расхода, ночная копия D1): да.
- Имя во внутренней среде «MyRida» везде: боты, Mini App, сайт (ответ «1 да»). Команда не путает своих ботов с ботами прода.
- Вечер 13.10: пока только внутренняя среда («текущую сделаем, чтобы заработала как есть, только с internal»). Прод в CI вернётся с новым аккаунтом.
