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
| Общий бот списка ожидания (G83, `181`) | `@myridauz_bot` «MyRida» | `@ridauz_bot` «Rida» (решение владельца 15.10.2026) |
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

## Ключи обеих сред (карта владельца 15.10.2026)

Источник правды по ключам: карта в репозитории инфраструктуры `dream-infra`, `docs/18-rida-keys.md` (утвердил владелец).
Правило: один ключ лежит в одном месте и делает одно дело; имя `rida-<среда>-<задача>`.

| Токен Cloudflare | Аккаунт | Права | Где лежит, имя |
|---|---|---|---|
| `rida-internal-deploy` | первый | права деплоя (ниже), зона `myrida.uz` | GitHub Environment `internal`: `CLOUDFLARE_API_TOKEN` |
| `rida-internal-claude` | первый | права деплоя; Realtime: Edit; Account Analytics, Workers Tail: Read | окружение Claude: `CLOUDFLARE_API_TOKEN` |
| `rida-internal-analytics` | первый | только Account Analytics: Read | секрет Worker: `ANALYTICS_API_TOKEN` |
| `rida-prod-deploy` | новый | права деплоя, зона `ridaone.uz` | GitHub Environment `production`: `CLOUDFLARE_API_TOKEN` |
| `rida-prod-claude` | новый | права деплоя; Realtime: Edit; Account Analytics, Workers Tail: Read; зона `ridaone.uz`: Zone Settings, SSL and Certificates: Edit (настройки зоны делает infra) | окружение Claude: `PROD_CLOUDFLARE_API_TOKEN` |
| `rida-prod-analytics` | новый | только Account Analytics: Read | секрет Worker прода: `ANALYTICS_API_TOKEN` |

- Рядом с токеном: Account ID своего аккаунта (`CLOUDFLARE_ACCOUNT_ID`, `PROD_CLOUDFLARE_ACCOUNT_ID`, в Worker `CF_ACCOUNT_ID`).
- Окружение Claude для Rida: только эти 4 переменные. Токенов ботов в нём нет: окружение одно на все проекты.
- Токены 6 ботов своей среды кладёт владелец: BotFather (Revoke, новый токен) → Cloudflare → Workers & Pages → `rida-backend` → Settings → Variables and Secrets. Cron сам ставит ботам вебхук, меню и описания (`46`).
- Claude ставит в Worker: новый `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_TELEGRAM_IDS` (номера даёт владелец), `CF_ACCOUNT_ID`. Ключи звонков (`REALTIME_*`, `TURN_*`) у каждого аккаунта свои (`08`).
- Значения ключей в чат и в репозиторий никогда (`32`).
- `deploy-internal`: без согласия, после зелёного CI на `main`. Прод в CI вернётся с новым аккаунтом: Environment `production`, согласие владельца (`32`). «Map data»: пока только `internal`.

## Права токена деплоя

Значение секрета в GitHub прочитать нельзя: «тот же токен, что в другом Environment» не скопировать, только создать заново с этими правами (урок №297).

| Где | Право |
|---|---|
| Account | Workers Scripts, D1, Workers R2 Storage, Queues, Cloudflare Pages: Edit |
| Account | Account Settings: Read |
| Zone своей среды | Workers Routes, DNS: Edit; Zone: Read |

- Только то, что вызывает `scripts/deploy.mjs`: Worker и его маршрут, D1, очередь, R2, Pages, DNS. KV, Realtime и аналитика выкладке не нужны.
- Без «Workers Routes» выкладка падает после загрузки Worker: Mini App и сайт не выкладываются (15.10.2026).
- В GitHub токен лежит в **Secrets** Environment, не в Variables. Секрет Environment сильнее секрета репозитория с тем же именем: общий секрет репозитория лишний.

## Шаги: сначала внутренняя среда

Шаги владельца и прода ведёт цель G84 (решение владельца 15.10.2026).

| № | Кто | Что |
|---|---|---|
| 1 | Владелец | `rida-internal-deploy` → GitHub `internal` (`CLOUDFLARE_API_TOKEN`; `CLOUDFLARE_ACCOUNT_ID` первого аккаунта); общий секрет репозитория с тем же именем удалить, если есть; перезапуск `deploy-internal` |
| 2 | Владелец | `rida-internal-claude` → окружение Claude; `rida-internal-analytics` → Worker первого аккаунта |
| 3 | Владелец | 6 ботов внутренней среды: Revoke → новый токен → Worker первого аккаунта; Claude от владельца: «боты внутренней среды готовы» |
| 4 | Владелец | `@myrida_poster_bot` админ в «MyRida \| Viloyatlar» и `@myrida_uz`; Claude от владельца: номер канала (web.telegram.org, число после `#`) и ссылка-приглашение с одобрением заявок. Это не секреты |
| 5 | Claude | Канал в `environments.ts`; `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_TELEGRAM_IDS`, `CF_ACCOUNT_ID` в Worker; полный стенд; PR; слияние; `deploy-internal` |
| 6 | Claude | Тестовая поездка, пост в канале, скриншоты |

## Шаги прода (к запуску 18.10)

| № | Кто | Что |
|---|---|---|
| 1 | Владелец | Новый аккаунт: включить R2 (может попросить карту, платить не нужно); `rida-prod-deploy` → GitHub `production` (Approve владельца там уже стоит); `rida-prod-claude` → окружение Claude; новая сессия; Telegram ID команды (или «те же») |
| 2 | Claude | Вернуть `deploy-production` и прод в «Map data»; PR; слияние; деплой прода (Approve владельца) |
| 3 | Владелец | `rida-prod-analytics` и 6 ботов прода → Worker нового аккаунта |
| 4 | Claude | `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_TELEGRAM_IDS`, `CF_ACCOUNT_ID` прода; «Map data» прода; проверка: `/health`, боты, Mini App, карта, сайт |
| 5 | Владелец | Удалить старые `rida-deploy`, `rida-claude` и все токены, которых нет в карте |

## Решения владельца 13.10.2026 (ответ «Запуск 18.10, да на всё, посты во внутреннем да»)

- Запуск 18.10.2026 (`27`).
- Внутренняя среда выкладывается без Approve, прод только с Approve.
- Посты: во внутренней среде включены (`posts` в `environments.ts`), в проде выключены до «да» владельца.
- Картинки бренд-пакета (`38`): домен и бот прода (`ridaone.uz`, `@rida1uz_bot`) из конфига бренда (`brand-kit/lib/production.mjs`); картинка ссылок сайта, наклейка, пост «Tez orada», QR-плакат и финал ролика. QR перерисован теми же настройками (уровень H, версия 3) и проверен: ведёт на `https://ridaone.uz`.
- Изменения сессии инфраструктуры для нового аккаунта (датчик расхода, ночная копия D1): да.
- Имя во внутренней среде «MyRida» везде: боты, Mini App, сайт (ответ «1 да»). Команда не путает своих ботов с ботами прода.
- Вечер 13.10: пока только внутренняя среда («текущую сделаем, чтобы заработала как есть, только с internal»). Прод в CI вернётся с новым аккаунтом.
