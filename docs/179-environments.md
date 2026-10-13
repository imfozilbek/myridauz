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
| Сайт и API | `myrida.uz`, `api.myrida.uz` | `ridaone.uz`, `api.ridaone.uz` |
| Mini App | `passenger.`, `driver.`, `admin.myrida.uz` | `passenger.`, `driver.`, `admin.ridaone.uz` |
| Боты | `@myrida_bot`, `@myrida_haydovchi_bot`, `@myrida_admin_bot`, `@myrida_support_bot` | `@rida1uz_bot`, `@rida1uz_haydovchi_bot`, `@rida1uz_admin_bot`, `@rida1uz_yordam_bot` |
| Бот каналов | `@myrida_poster_bot` | `@rida1uz_poster_bot` |
| Главный канал | `@myrida_uz` | `@rida1uz` |
| Каналы направлений | один приватный «MyRida \| Viloyatlar»: все направления | 67 приватных (`176`) |
| Поисковики | закрыт: `robots.txt` «Disallow: /» | открыт, карта сайта (`60`) |
| Деплой | сам, после зелёного CI на `main` | после внутренней, с согласием владельца |
| Данные | тестовые данные команды остаются | новая база: справочники из миграций, люди с нуля |

Всё остальное одно на обе среды: правила, цены, комиссия, лимиты, тексты, вид экранов.

## Как устроено в коде

- `brands/rida/environments.ts`: адрес, `indexed`, боты, каналы и главный канал каждой среды.
  Остальное в `brand.config.ts`, одно на обе (`22`).
- `loadBrand(id, environment)`: без среды прод. Тесты и стенд работают с продом (67 каналов).
- Worker читает переменную `ENVIRONMENT`, Mini App и сайт: `VITE_ENVIRONMENT`.
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

- `deploy-internal`: Environment `internal`, без согласия. Потом `deploy-production`: Environment `production`, согласие владельца (`32`).
- Тот же коммит идёт к людям, только если он уже работает у команды.
- В обоих Environment секреты с одинаковыми именами: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. У каждого: своего аккаунта.
- Workflow «Map data»: при запуске выбрать среду.
- Секреты Worker у каждой среды свои (`46`): токены 5 ботов своей среды, свой `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_TELEGRAM_IDS`, ключи аналитики, звонков и TURN своего аккаунта.

## Права токена нового аккаунта

Токен деплоя (Account API Token) с правами:

| Где | Право |
|---|---|
| Account | Workers Scripts, D1, Workers R2 Storage, Queues, Cloudflare Pages: Edit |
| Account | Account Analytics: Read; Realtime (Calls): Edit |
| Zone `ridaone.uz` | Workers Routes, DNS: Edit; Zone: Read |

## Шаги запуска прода

| № | Кто | Что |
|---|---|---|
| 1 | Владелец | GitHub → Settings → Environments: новый `internal` с секретами первого аккаунта (те же, что сейчас в `production`); в `production` включить Required reviewers (владелец). Оба до слияния G81 |
| 2 | Владелец | В `production`: токен и Account ID **нового** аккаунта |
| 3 | Владелец | R2 на новом аккаунте: включить в панели (может попросить карту, платить не нужно) |
| 4 | Владелец | Переменные новой сессии Claude: `PROD_CLOUDFLARE_API_TOKEN`, `PROD_CLOUDFLARE_ACCOUNT_ID`, `PROD_PASSENGER_BOT_TOKEN`, `PROD_DRIVER_BOT_TOKEN`, `PROD_ADMIN_BOT_TOKEN`, `PROD_SUPPORT_BOT_TOKEN`, `PROD_POSTER_BOT_TOKEN`, `INTERNAL_POSTER_BOT_TOKEN`. В чат никогда |
| 5 | Владелец | `@myrida_poster_bot`: админ в `@myrida_uz` и «MyRida \| Viloyatlar», написать там одно сообщение |
| 6 | Владелец | Telegram ID команды для прода (или «те же») |
| 7 | Claude | Номер канала «Viloyatlar» → `environments.ts`; полный стенд; PR; слияние |
| 8 | CI | `deploy-internal`, потом `deploy-production` (Approve владельца): стек на новом аккаунте |
| 9 | Claude | Секреты Worker прода из переменных сессии; новый секрет вебхука в обеих средах; `setup-bots` обеих сред |
| 10 | Claude | «Map data» для прода (Approve владельца); проверка: `/health`, боты, Mini App, карта, сайт |

## Решения владельца 13.10.2026 (ответ «Запуск 18.10, да на всё, посты во внутреннем да»)

- Запуск 18.10.2026 (`27`).
- Внутренняя среда выкладывается без Approve, прод только с Approve.
- Посты: во внутренней среде включены (`posts` в `environments.ts`), в проде выключены до «да» владельца.
- Картинки бренд-пакета (`38`): домен и бот прода (`ridaone.uz`, `@rida1uz_bot`) из конфига бренда (`brand-kit/lib/production.mjs`); картинка ссылок сайта, наклейка, пост «Tez orada», QR-плакат и финал ролика. QR перерисован теми же настройками (уровень H, версия 3) и проверен: ведёт на `https://ridaone.uz`.
- Изменения сессии инфраструктуры для нового аккаунта (датчик расхода, ночная копия D1): да.
