# 189. Ключи и доступы обеих сред: по шагам

> **Кратко:** решение владельца 17.10.2026: полная симметрия обеих сред в GitHub, Cloudflare и Telegram, всё настраивается заново по одному списку, «чтобы больше не возвращаться». Страница с отметками шагов для владельца: https://claude.ai/artifact/EYnwD27jVRfTthViKV9tJJ (Claude читает отметки и поля через её базу, документ `progress/main`). Карта ключей: `179`. Значения ключей в чат, на страницу и в репозиторий никогда (`32`).

## Правила

- Токен Cloudflare: My Profile → API Tokens → Create Token → Create Custom Token. Account Resources: аккаунт среды; Zone Resources: зона среды. TTL и IP Filtering пустые.
- Значение токена показывают один раз: сразу вставить в место назначения.
- Права добавляются потом через «Edit» токена: значение не меняется, вставлять заново не нужно.
- GitHub: только Environment secrets (не Variables, не секреты репозитория).
- Секрет Worker: Workers & Pages → `rida-backend` → Settings → Variables and Secrets → Type: Secret → Deploy.
- Окружение Claude: меню среды в заголовке сессии → Edit. Новые значения видит только новая сессия.
- Токен бота: BotFather → `/mybots` → бот → API Token → Revoke, прямо перед вставкой в Worker.

## Наборы прав Cloudflare (одинаковые в обеих средах)

| Набор | Строки |
|---|---|
| «Выкладка» | Account: Workers Scripts, D1, Workers R2 Storage, Queues, Cloudflare Pages: Edit; Account Settings: Read. Zone: Workers Routes, DNS: Edit; Zone: Read |
| «Claude» | «Выкладка» и ещё: Account: Realtime (или Calls): Edit; Account Analytics, Workers Tail: Read. Zone: Zone Settings, SSL and Certificates: Edit |
| «Аналитика» | Account: Account Analytics: Read |

## 1. GitHub

| Что | Как |
|---|---|
| Секреты репозитория | Удалить `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` из Repository secrets и Variables, если есть |
| Environment `internal` | Ветки: только `main`; Required reviewers выключено (решение 13.10); Variables пусто |
| Environment `production` | Required reviewers: владелец; Prevent self-review выключено; Wait timer выключен; ветки: только `main`; Variables пусто |

## 2 и 3. Cloudflare

| Что | Внутренняя: аккаунт 1, `myrida.uz` | Прод: аккаунт 2, `ridaone.uz` |
|---|---|---|
| Account ID | GitHub `internal`: `CLOUDFLARE_ACCOUNT_ID`; Claude: `CLOUDFLARE_ACCOUNT_ID` | GitHub `production`: `CLOUDFLARE_ACCOUNT_ID` (заменить); Claude: `PROD_CLOUDFLARE_ACCOUNT_ID` |
| Токен «Выкладка» | `rida-internal-deploy` → GitHub `internal`: `CLOUDFLARE_API_TOKEN` | `rida-prod-deploy` → GitHub `production`: `CLOUDFLARE_API_TOKEN` (заменить) |
| Токен «Claude» | `rida-internal-claude` → Claude: `CLOUDFLARE_API_TOKEN` | `rida-prod-claude` → Claude: `PROD_CLOUDFLARE_API_TOKEN` |
| Токен «Аналитика» | `rida-internal-analytics` → Worker: `ANALYTICS_API_TOKEN` | `rida-prod-analytics` → Worker: `ANALYTICS_API_TOKEN`, после первой выкладки |
| R2 | включён | включить до первой выкладки (может попросить карту, платить не нужно) |
| Web Analytics | есть, автоустановка (`59`) | добавить сайт, автоустановка |
| Зона | SSL/TLS Full (strict); Always Use HTTPS On; Minimum TLS 1.2; Bot Fight Mode Off (`85`) | то же |
| DNS | не трогать | удалить старые записи `@`, `www`, `api`, `passenger`, `driver`, `admin`, `main`, `map`, если есть |

## 4 и 5. Telegram

Секреты Worker (6 ботов; во внутренней сейчас, в проде после первой выкладки):

| Роль | Внутренняя | Прод | Секрет |
|---|---|---|---|
| попутчик | `@myrida_bot` | `@rida1uz_bot` | `PASSENGER_BOT_TOKEN` |
| водитель | `@myrida_haydovchi_bot` | `@rida1uz_haydovchi_bot` | `DRIVER_BOT_TOKEN` |
| админ | `@myrida_admin_bot` | `@rida1uz_admin_bot` | `ADMIN_BOT_TOKEN` |
| поддержка | `@myrida_support_bot` | `@rida1uz_yordam_bot` | `SUPPORT_BOT_TOKEN` |
| главный | `@myridauz_bot` | `@ridauz_bot` | `MAIN_BOT_TOKEN` |
| каналы | `@myrida_poster_bot` | `@rida1uz_poster_bot` | `POSTER_BOT_TOKEN` |

BotFather руками (в API Telegram этого нет):

| Бот | Configure Mini App: адрес | Сплэш: фон | Картинка описания |
|---|---|---|---|
| попутчик | `https://passenger.<домен>` | `#0D9488` | `bot-passenger-description.png` |
| водитель | `https://driver.<домен>` | `#D97706` | `bot-driver-description.png` |
| админ | `https://admin.<домен>` | `#334155` | `bot-admin-description.png` |
| главный | `https://main.<домен>` | `#0D9488` | нет |
| поддержка | нет | нет | `bot-support-description.png` |

- Сплэш: иконка `brands/rida/landing/bot/miniapp-splash.svg`, фон одинаковый для светлой и тёмной темы, иконка и текст `#FFFFFF` (`121`, OPS-05).
- Mini App в BotFather нужна ссылкам `t.me/<бот>?startapp` (доска дня, `openApp`): без неё ссылка открывает только чат.
- Картинки описания: `brands/rida/brand-kit/kit/telegram/` (собирает бренд-пакет, `38`); на странице владельца они есть для скачивания.
- Бот каналов админ в главном канале и каналах направлений с 4 правами: изменение профиля канала, публикация, редактирование чужих публикаций, добавление подписчиков (`176`, `180`). Прод: стоят в 68 каналах (проверка infra 13.10). Внутренняя: `@myrida_uz` и «MyRida | Viloyatlar».
- Владелец даёт (не ключи, поля на странице): Telegram ID обоих аккаунтов (web.telegram.org/k → «Избранное» → число после `#`), номер «MyRida | Viloyatlar» и ссылку-приглашение с заявками.

## Делает Claude

- `TELEGRAM_WEBHOOK_SECRET` в каждой среде и сразу setup-bots, иначе боты замолчат.
- `CF_ACCOUNT_ID` и `ADMIN_TELEGRAM_IDS` (оба ID владельца в обеих средах).
- Ключи звонков `REALTIME_APP_ID`, `REALTIME_APP_SECRET`, `TURN_KEY_ID`, `TURN_KEY_TOKEN`: свои у каждого аккаунта (`08`).

## Где симметрии нет

| Что | Почему |
|---|---|
| В окружении Claude `CLOUDFLARE_*` и `PROD_CLOUDFLARE_*` | обе пары в одном окружении |
| Approve только у прода | решение 13.10 |
| Каналов 2 и 68 | решение 13.10; права бота каналов одинаковые |
| Секреты Worker прода позже | Worker прода появится с первой выкладкой |

## В конце

- Cloudflare, оба аккаунта: удалить `rida-deploy`, `rida-claude` и все токены Rida, кроме шести из этого списка. Раньше нельзя: старый ключ может стоять в Worker как `ANALYTICS_API_TOKEN` (`179`).
- GitHub: удалить ветку `goal/g84-environments-launch`.
- Ключ перестал работать: создать заново с тем же набором и положить в то же место (урок №297). Новый бренд или среда (`22`): тот же список, имена `<бренд>-<среда>-<задача>`.
