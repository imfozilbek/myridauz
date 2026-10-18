# 46. Инфраструктура: ресурсы, домены, секреты

> **Кратко:** у Rida две среды (`179`, G81): внутренняя команды на первом аккаунте Cloudflare (`myrida.uz`) и прод для людей на новом (`ridaone.uz`). В каждой: Worker, база D1, приватный R2, Analytics Engine, 4 Mini App и сайт на Pages. Секреты только в Cloudflare и в Environment `internal` и `production`. Первая среда сделана в G03 (28.09.2026).

## Адреса

| Адрес (`<домен>`: `myrida.uz` внутренняя, `ridaone.uz` прод) | Что там | Где |
|---|---|---|
| `api.<домен>` | Backend: API, вебхуки ботов, `/health` | Worker `rida-backend` |
| `passenger.<домен>` | Mini App попутчика | Pages `rida-passenger` |
| `driver.<домен>` | Mini App водителя | Pages `rida-driver` |
| `admin.<домен>` | Mini App админа | Pages `rida-admin` |
| `main.<домен>` | Mini App списка ожидания (G83, `181`) | Pages `rida-main`: деплой создаёт сам |
| `<домен>`, `www.<домен>` | Лендинг и документы (`59`); внутренний закрыт для поисковиков | Pages `rida-landing` |

- Адреса строятся из домена среды: `brands/hosts.ts`, `brands/rida/environments.ts` (`22`, `179`).
- `myrida.uz` зарегистрирован в Eskiz, DNS в Cloudflare (OPS-01). `ridaone.uz`: DNS в новом аккаунте.
- Почта компании: `myrida.llc@gmail.com` (владелец, 02.10.2026). Хранится в конфиге бренда (`company.email`), стоит в оферте и политике (`30`, версия 1.1).

## Ресурсы Cloudflare (одинаковые имена в обоих аккаунтах)

| Ресурс | Имя | Привязка в Worker |
|---|---|---|
| D1 | `rida-db` (Западная Европа) | `DB` |
| R2 | `rida-media`, приватный | `MEDIA` |
| R2 | `rida-map`, публичный, `map.<домен>` (G57) | без привязки: Mini App читают напрямую |
| Analytics Engine | `rida_analytics` | `ANALYTICS` |
| Workers Logs | включены | `observability` |
| Durable Objects | `ChatRoom` (SQLite), один на чат брони (G09) | `CHATS` |
| Queues | `rida-notifications`, сообщения ботов (G09) | `NOTIFICATIONS` |

- Настройки: `brands/rida/wrangler.toml`; деплой дописывает адрес, id базы и среду (`179`). Миграции: `apps/backend/migrations`
  (таблицы `users`, `blocked_phones` с G04, `47`).
- Фото людей в R2: `avatars/<id>/<uuid>`, отдаёт только API (`47`).
- Картинки историй в R2: `stories/<id поездки>`, одна на поездку. API отдаёт их без подписи по `/stories/<id>`: Telegram читает картинку сам. В картинке только маршрут, время, места и цена (`88` L19). Живут 1 день: правило R2 `stories-1-day` ставит деплой (G57); новая история загружает картинку заново.
- Карта в R2 `rida-map`: `map/uzbekistan-<дата>.pmtiles` и `map/fonts/...`, кладёт workflow «Map data» (среда на выбор), отдаёт `map.<домен>` без Worker (G22, G57, `67`).
- База D1, очередь и R2 `rida-media` на пустом аккаунте создаёт деплой (`179`). Cron каждые 15 минут (G07).
- Резервные копии D1: Time Travel 7 дней на бесплатном тарифе (`03`).

## Боты

| Бот: внутренняя / прод | Вебхук | Кнопка меню |
|---|---|---|
| `@myrida_bot` / `@rida1uz_bot` | `api.<домен>/telegram/passenger` | «ilova» → `passenger.<домен>` |
| `@myrida_haydovchi_bot` / `@rida1uz_haydovchi_bot` | `api.<домен>/telegram/driver` | «ilova» → `driver.<домен>` |
| `@myrida_admin_bot` / `@rida1uz_admin_bot` | `api.<домен>/telegram/admin` | «ilova» → `admin.<домен>`: ставит владелец в BotFather, код её не трогает |
| `@myridauz_bot` / прод: `@ridauz_bot` (общий бот, G83, `181`) | `api.<домен>/telegram/main` | «ilova» → `main.<домен>`: ставит `setup-bots` |
| `@myrida_support_bot` / `@rida1uz_yordam_bot` | `api.<домен>/telegram/support` | нет: люди пишут вопрос (G30, `50`) |
| `@myrida_poster_bot` / `@rida1uz_poster_bot` (бот каналов) | `api.<домен>/telegram/poster`: только `chat_member` | нет: публикует в каналы среды (G80, `176`, `179`) |

- Вебхук принимает только запросы с `secret_token` (заголовок Telegram).
- Админ-бот открывает Mini App только команде. Остальных он ведёт в бот поддержки (G30).

## Где лежат секреты

Карта всех ключей обеих сред и права токенов: `179` («Ключи обеих сред»), источник правды: `dream-infra`, `docs/18-rida-keys.md`.

| Секрет | Где | Кто кладёт |
|---|---|---|
| Токены 6 ботов своей среды (`PASSENGER_`, `DRIVER_`, `ADMIN_`, `SUPPORT_`, `POSTER_`, `MAIN_BOT_TOKEN`) | Секреты Worker своей среды | Владелец (BotFather → панель Cloudflare); Cron сам настраивает ботов |
| `TELEGRAM_WEBHOOK_SECRET` (свой в каждой среде), `ADMIN_TELEGRAM_IDS`, `CF_ACCOUNT_ID` | Секреты Worker | Claude (`wrangler secret`) |
| `ANALYTICS_API_TOKEN`: токен `rida-<среда>-analytics`, только Account Analytics: Read | Секреты Worker | Владелец |
| `REALTIME_APP_ID`, `REALTIME_APP_SECRET`, `TURN_KEY_ID`, `TURN_KEY_TOKEN` (G13, `08`): свои у каждого аккаунта | Секреты Worker | Позже, со звонками |
| `CLOUDFLARE_API_TOKEN` (`rida-<среда>-deploy`), `CLOUDFLARE_ACCOUNT_ID` | GitHub Environment `internal`; `production` вернётся с продом (`179`) | Владелец |
| `CLOUDFLARE_*`, `PROD_CLOUDFLARE_*` (`rida-<среда>-claude`) | Окружение Claude: только эти 4 переменные, без токенов ботов | Владелец |

- `ANALYTICS_API_TOKEN` больше не равен токену деплоя: карта владельца 15.10.2026 заменяет решение 29.09.2026.
- В репозитории, в CI для PR и в чате секретов нет (`32`).

## Деплой

- `pnpm run deploy --brand=rida --env=internal|production`: одна команда на бренд и среду (`45`, `179`).
  Порядок: сайт, потом Worker, потом Mini App. Бот шлёт новый адрес картинки сайта, только когда сайт её уже отдаёт (урок №313).
- CI: только на `main`, после барьеров: `deploy-internal` сам, без **Approve** (решение владельца 13.10.2026).
  Прод: свой workflow «Deploy production» после зелёного CI, с **Approve** (G84, `179`).
- **Одобрение деплоя прода (решение владельца 29.09.2026):** только в GitHub Mobile.
  Уведомление «requested your review to deploy» (или ссылка от Claude) → **Approve** →
  поставить галочку у `production` (без неё кнопка серая) → **Approve** вверху справа.
  Claude присылает ссылку на запуск сразу после каждого слияния.
- **Деплой только при изменении прода:** job `changes` смотрит, что поменялось
  (`apps/`, `packages/`, `brands/`, скрипт деплоя, зависимости). Только docs или CI:
  деплоя нет.
- Сравнение идёт с **последним успешным деплоем** своей среды её workflow (`deployments` окружения `internal` или `production`; «Map data» не в счёт, `scripts/deploy-needed.mjs`),
  а не с прошлым слиянием: код, чей деплой упал или был пропущен, уйдёт в прод со следующим
  слиянием (решение владельца 10.10.2026, урок №208). Нет ответа GitHub: деплой предлагается.
- Cron Worker: каждые 15 минут (`brands/rida/wrangler.toml`). Завершает поездки, закрывает
  старые заявки (`51`), шлёт пачки подписок и напоминания о поездке (`54`).
- Посты в каналы включает переменная `CHANNEL_POSTS` в `wrangler.toml` (`off` или `on`, `54`).
  Бот каналов среды должен быть админом её каналов с правами публиковать и менять посты и «Добавление подписчиков» (`176`).
- Настройку ботов Cron делает сам (G83, таблица `bot_setup`): после деплоя с новыми текстами и когда владелец добавил токен нового бота, следующий тик ставит вебхук, меню, команды, имя, описания и аватар (`62`). Руками `pnpm run setup-bots --brand=rida --env=<среда>` нужен только после смены токена того же бота; он же сразу оформляет каналы (`180`). После G06 обязательно:
  боты получают нажатия кнопок (`callback_query`, `50`).
- Секрета вебхука нет в окружении сессии Claude: перед `setup-bots` Claude делает новый и кладёт в Worker своей среды (решение владельца 13.10, `176`).
