# 46. Инфраструктура: ресурсы, домены, секреты

> **Кратко:** Rida работает в одном аккаунте Cloudflare: Worker `api.myrida.uz`, база D1, приватный R2, Analytics Engine, 3 Mini App на Pages. Секреты только в Cloudflare и в Environment `production`. Сделано в G03 (28.09.2026).

## Адреса

| Адрес | Что там | Где |
|---|---|---|
| `api.myrida.uz` | Backend: API, вебхуки ботов, `/health` | Worker `rida-backend` |
| `passenger.myrida.uz` | Mini App попутчика | Pages `rida-passenger` |
| `driver.myrida.uz` | Mini App водителя | Pages `rida-driver` |
| `admin.myrida.uz` | Mini App админа | Pages `rida-admin` |
| `myrida.uz`, `www.myrida.uz` | Лендинг и документы (`59`) | Pages `rida-landing` |

- Адреса строятся из домена бренда: `brands/hosts.ts` (`22`).
- `myrida.uz` зарегистрирован в Eskiz, DNS в Cloudflare (OPS-01).

## Ресурсы Cloudflare

| Ресурс | Имя | Привязка в Worker |
|---|---|---|
| D1 | `rida-db` (Западная Европа) | `DB` |
| R2 | `rida-media`, приватный | `MEDIA` |
| Analytics Engine | `rida_analytics` | `ANALYTICS` |
| Workers Logs | включены | `observability` |
| Durable Objects | `ChatRoom` (SQLite), один на чат брони (G09) | `CHATS` |
| Queues | `rida-notifications`, сообщения ботов (G09) | `NOTIFICATIONS` |

- Настройки: `brands/rida/wrangler.toml`. Миграции: `apps/backend/migrations`
  (таблицы `users`, `blocked_phones` с G04, `47`).
- Фото людей в R2: `avatars/<id>/<uuid>`, отдаёт только API (`47`).
- Карта в R2: `map/uzbekistan-<дата>.pmtiles` и `map/fonts/...`, кладёт workflow «Map data», отдаёт API `/map/...` (G22, `67`).
- Очередь создана один раз: `wrangler queues create rida-notifications` (G09). Cron каждые 15 минут (G07).
- Резервные копии D1: Time Travel 7 дней на бесплатном тарифе (`03`).

## Боты

| Бот | Вебхук | Кнопка меню |
|---|---|---|
| `@myrida_bot` | `api.myrida.uz/telegram/passenger` | «Ochish» → `passenger.myrida.uz` |
| `@myrida_haydovchi_bot` | `api.myrida.uz/telegram/driver` | «Ochish» → `driver.myrida.uz` |
| `@myrida_admin_bot` | `api.myrida.uz/telegram/admin` | нет: кнопка только в ответе команде |

- Вебхук принимает только запросы с `secret_token` (заголовок Telegram).
- Админ-бот открывает Mini App только людям из `ADMIN_TELEGRAM_IDS`.

## Где лежат секреты

| Секрет | Где | Кто видит |
|---|---|---|
| Токены 3 ботов, `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_TELEGRAM_IDS` | Секреты Worker (`wrangler secret`) | Только Worker |
| `ANALYTICS_API_TOKEN`, `CF_ACCOUNT_ID` (G12, `56`) | Секреты Worker | Только Worker |
| `REALTIME_APP_ID`, `REALTIME_APP_SECRET`, `TURN_KEY_ID`, `TURN_KEY_TOKEN` (G13, `08`) | Секреты Worker | Только Worker |
| `CLOUDFLARE_API_TOKEN` (деплой), `CLOUDFLARE_ACCOUNT_ID` | GitHub Environment `production` | Только job `deploy` на `main` |
| Токен Claude и ключи для настройки | Переменные окружения сессии Claude | Только Claude |

- `ANALYTICS_API_TOKEN` сейчас равен токену деплоя (решение владельца 29.09.2026). Позже заменить
  на токен только для чтения Account Analytics.
- В репозитории и в CI для PR секретов нет (`32`).

## Деплой

- `pnpm run deploy --brand=rida`: одна команда на бренд (`45`).
- CI: job `deploy` только на `main`, после барьеров, с подтверждением владельца.
  Машина делает всё за 2 или 3 минуты; остальное время деплой ждёт нажатия **Approve**.
- **Одобрение деплоя (решение владельца 29.09.2026):** только в GitHub Mobile.
  Уведомление «requested your review to deploy» (или ссылка от Claude) → **Approve** →
  поставить галочку у `production` (без неё кнопка серая) → **Approve** вверху справа.
  Claude присылает ссылку на запуск сразу после каждого слияния.
- **Деплой только при изменении прода:** job `changes` смотрит, что поменялось
  (`apps/`, `packages/`, `brands/`, скрипт деплоя, зависимости). Только docs или CI:
  деплоя нет, одобрять нечего.
- Cron Worker: каждые 15 минут (`brands/rida/wrangler.toml`). Завершает поездки, закрывает
  старые заявки (`51`), шлёт пачки подписок и напоминания о поездке (`54`).
- Посты в каналы включает переменная `CHANNEL_POSTS` в `wrangler.toml` (`off` или `on`, `54`).
  Бот попутчиков должен быть админом 13 каналов с правом публиковать и менять посты.
- После смены настроек ботов: `pnpm run setup-bots --brand=rida`. Он ставит вебхук, меню, команды, имя и описания ботов (`62`). После G06 обязательно:
  боты получают нажатия кнопок (`callback_query`, `50`).
